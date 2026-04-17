require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');
const { sendConfirmationEmail } = require('./emailService');

const app = express();
const PORT = 3001;
const PAGBANK_URL = process.env.PAGBANK_ENV === 'production' ? 'https://api.pagseguro.com/orders' : 'https://sandbox.api.pagseguro.com/orders';


app.use(cors());
app.use(express.json());

// Criar nova compra simulada (PIX ou bypass antigo)
app.post('/api/ingressos', (req, res) => {
    const { nome, email, telefone, forma_pagamento, parcelas } = req.body;
    
    // Validações básicas
    if (!nome || !email || !telefone || !forma_pagamento) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios' });
    }

    const valor = 250.00; // Valor fixo do ingresso
    const status_pagamento = forma_pagamento === 'pix' ? 'aguardando pagamento' : 'em teste'; 

    const query = `
        INSERT INTO ingressos (nome, email, telefone, forma_pagamento, status_pagamento, valor, parcelas, transaction_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [nome, email, telefone, forma_pagamento, status_pagamento, valor, parcelas || null, null], function(err) {
        if (err) {
            console.error('Erro ao inserir ingresso:', err);
            return res.status(500).json({ error: 'Erro ao processar compra' });
        }
        res.status(201).json({ 
            message: 'Compra registrada com sucesso', 
            ingressoId: this.lastID,
            status: status_pagamento
        });
    });
});

// Criar nova compra com PagBank Real (Cartão)
app.post('/api/pagamento-pagbank', async (req, res) => {
    const { nome, email, telefone, cpf, parcelas, rawCardData } = req.body;

    if (!nome || !email || !telefone || !cpf || !rawCardData) {
        return res.status(400).json({ error: 'Dados incompletos para a transação' });
    }

    try {
        const valorFinal = 25000; // R$ 250,00 em centavos (padrão PagBank)
        
        let chargeStatus = 'PAID';
        let txId = `SIM-${Date.now()}`;

        // Se o usuário ainda não colocou o token real, criamos um mock da adquirente para visualização da interface
        if (!process.env.PAGBANK_TOKEN || process.env.PAGBANK_TOKEN.includes('adicione_seu_token_aqui')) {
            console.log("Gateway Simulado: Token não detectado. Simulando aprovação teste.");
            await new Promise(r => setTimeout(r, 1500)); // Delay da operadora
        } else {
            // Chamada real a API do PagBank
            const month = rawCardData.validade.split('/')[0];
            const yearStr = rawCardData.validade.split('/')[1];
            const year = "20" + (yearStr || "30"); // fallback
            
            const payload = {
                reference_id: `ING-${Date.now()}`,
                customer: { name: nome, email: email, tax_id: cpf.replace(/\D/g, '') },
                items: [
                    { name: "Show de Inauguração Girafa Tech", quantity: 1, unit_amount: valorFinal }
                ],
                charges: [{
                    reference_id: `CHARGE-${Date.now()}`,
                    description: 'Ingresso Show Girafa Tech',
                    amount: { value: valorFinal, currency: "BRL" },
                    payment_method: {
                        type: "CREDIT_CARD",
                        installments: parseInt(parcelas) || 1,
                        capture: true,
                        card: { 
                            number: rawCardData.numero.replace(/\D/g, ''),
                            exp_month: month,
                            exp_year: year,
                            security_code: rawCardData.cvv,
                            holder: { name: rawCardData.nomeCartao }
                        }
                    }
                }]
            };

            const response = await axios.post(PAGBANK_URL, payload, {
                headers: {
                    'Authorization': `Bearer ${process.env.PAGBANK_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            chargeStatus = response.data.charges[0].status; // Ex: AUTHORIZED, PAID, DECLINED
            txId = response.data.id;
        }
        
        // Determina status base para o nosso SQLite 
        const statusInterno = (chargeStatus === 'PAID' || chargeStatus === 'AUTHORIZED') ? 'pago' : 'recusado';

        // Salva  no banco
        const query = `
            INSERT INTO ingressos (nome, email, telefone, forma_pagamento, status_pagamento, valor, parcelas, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [nome, email, telefone, 'cartao', statusInterno, 250.00, parseInt(parcelas), txId], function(err) {
            res.status(200).json({
                message: 'Processamento efetuado',
                ingressoId: this.lastID,
                status: statusInterno,
                transaction_id: txId,
                gatewayStatus: chargeStatus
            });
        });

    } catch(err) {
        console.error("Erro no Gateway PagBank:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Falha ao processar pagamento com seu cartão. Verifique os dados.', details: err.response?.data });
    }
});

// Listar ingressos
app.get('/api/ingressos', (req, res) => {
    db.all('SELECT * FROM ingressos ORDER BY data_compra DESC', [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar ingressos:', err);
            return res.status(500).json({ error: 'Erro ao buscar dados' });
        }
        res.json(rows);
    });
});

// Atualizar status de pagamento
app.put('/api/ingressos/:id/status', (req, res) => {
    const ingressoId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Faltam o status a ser atualizado' });
    }

    const query = `UPDATE ingressos SET status_pagamento = ? WHERE id = ?`;
    db.run(query, [status, ingressoId], function(err) {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            return res.status(500).json({ error: 'Erro ao atualizar status do ingresso' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ingresso não encontrado' });
        }
        
        if (status === 'pago') {
            db.get('SELECT * FROM ingressos WHERE id = ?', [ingressoId], (err, ingresso) => {
                if (!err && ingresso) {
                    sendConfirmationEmail(ingresso);
                }
            });
        }

        res.json({ message: 'Status atualizado com sucesso' });
    });
});

// Remover ingresso
app.delete('/api/ingressos/:id', (req, res) => {
    const ingressoId = req.params.id;
    const query = `DELETE FROM ingressos WHERE id = ?`;
    db.run(query, [ingressoId], function(err) {
        if (err) {
            console.error('Erro ao deletar ingresso:', err);
            return res.status(500).json({ error: 'Erro ao deletar ingresso' });
        }
        res.json({ message: 'Ingresso removido com sucesso' });
    });
});

// Limpeza automática a cada 1 hora (apaga pedentes > 24h)
setInterval(() => {
    const query = `
        DELETE FROM ingressos 
        WHERE status_pagamento != 'pago' 
        AND data_compra <= datetime('now', '-24 hours')
    `;
    db.run(query, function(err) {
        if (err) {
            console.error('Erro no auto-cleanup (24h):', err);
        } else if (this.changes > 0) {
            console.log(`Auto-cleanup: ${this.changes} ingressos não pagos e expirados foram removidos.`);
        }
    });
}, 3600000); // 3600000ms = 1 hora

app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
});
