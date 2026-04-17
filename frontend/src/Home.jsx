import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ingressosAPI } from './api';

// Máscaras
const maskPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})\d+?$/, '$1-$2');
};

const maskCpf = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCardNumber = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .substring(0, 19);
};

const maskExpiry = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .substring(0, 5);
};

function Home() {
  const [step, setStep] = useState(1); // 1: Form, 2: Pix, 3: Success
  const [loading, setLoading] = useState(false);
  const [ingressoId, setIngressoId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', cpf: '',
    forma_pagamento: 'cartao',
    parcelas: 1
  });

  const [cardData, setCardData] = useState({
    numero: '', nomeCartao: '', validade: '', cvv: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'telefone') finalValue = maskPhone(value);
    if (name === 'cpf') finalValue = maskCpf(value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'numero') finalValue = maskCardNumber(value);
    if (name === 'validade') finalValue = maskExpiry(value);
    if (name === 'cvv') finalValue = value.replace(/\D/g, '').substring(0, 4);
    setCardData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.forma_pagamento === 'cartao') {
        // Envia dados puros para o Backend processar via Raw Sandbox 
        const res = await ingressosAPI.createPagBankCompra({ 
            ...formData, 
            rawCardData: { ...cardData }
        });
        
        setIngressoId(res.ingressoId);
        setStep(3); // Sucesso
      } else if (formData.forma_pagamento === 'pix') {
        const res = await ingressosAPI.createCompra({ ...formData, parcelas: null });
        setIngressoId(res.ingressoId);
        setStep(2); // Vai pro Pix simulador
      }
    } catch (err) {
      alert(err.message || 'Erro ao processar compra financeira. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Section */}
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Show de Inauguração da Girafa Tech
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          A festa tecnológica mais aguardada do ano. Inteligência, Inovação e Muita Música!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem' }}>
             📅 <strong>Data:</strong> 7 de junho de 2026
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem' }}>
             📍 <strong>Local:</strong> FIAP de Pereira Barreto
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem' }}>
             🎟️ <strong>Valor:</strong> R$ 250,00
          </div>
        </div>
      </div>

      {/* Main Flow */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="glass-panel animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            Garanta seu Ingresso
          </h2>

          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input required type="text" name="nome" className="form-control" value={formData.nome} onChange={handleChange} placeholder="João da Silva" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">E-mail</label>
              <input required type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="joao@exemplo.com" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Telefone</label>
              <input required type="text" name="telefone" className="form-control" value={formData.telefone} onChange={handleChange} placeholder="(11) 90000-0000" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">CPF (PagBank)</label>
              <input required type="text" name="cpf" className="form-control" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" />
            </div>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Forma de Pagamento</h3>
          <div className="payment-selector">
            <div 
              className={`payment-option ${formData.forma_pagamento === 'cartao' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, forma_pagamento: 'cartao' }))}
            >
              <div style={{fontWeight: 'bold'}}>💳 Cartão de Crédito</div>
              <div style={{fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.2rem'}}>Liberação Imediata</div>
            </div>
            <div 
              className={`payment-option ${formData.forma_pagamento === 'pix' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, forma_pagamento: 'pix' }))}
            >
              💠 PIX
            </div>
          </div>

          {formData.forma_pagamento === 'cartao' && (
            <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Número do Cartão</label>
                <input required type="text" name="numero" className="form-control" value={cardData.numero} onChange={handleCardChange} placeholder="0000 0000 0000 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Nome impresso no cartão</label>
                <input required type="text" name="nomeCartao" className="form-control" value={cardData.nomeCartao} onChange={handleCardChange} placeholder="JOAO DA SILVA" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Validade</label>
                  <input required type="text" name="validade" className="form-control" value={cardData.validade} onChange={handleCardChange} placeholder="MM/AA" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CVV</label>
                  <input required type="text" name="cvv" className="form-control" value={cardData.cvv} onChange={handleCardChange} placeholder="123" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Parcelamento</label>
                <select name="parcelas" className="form-control" value={formData.parcelas} onChange={handleChange}>
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>
                      {i+1}x de R$ {(250 / (i+1)).toFixed(2)} {i===0?'(Sem juros)':''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
              {loading ? 'Processando...' : `Pagar R$ 250,00`}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <PixSimulador onsuccess={() => setStep(3)} ingressoId={ingressoId} />
      )}

      {step === 3 && (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--success)' }}>
            {formData.forma_pagamento === 'cartao' ? 'Pagamento Aprovado!' : 'Pedido Recebido!'}
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            {formData.forma_pagamento === 'cartao' 
              ? 'Sua reserva para o Show de Inauguração da Girafa Tech foi confirmada!' 
              : 'Sua reserva para o Show de Inauguração da Girafa Tech foi registrada.'}
          </p>

          {formData.forma_pagamento === 'pix' ? (
            <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--secondary)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'inline-block', maxWidth: '600px' }}>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>
                Atenção: Seu ingresso será validado em até 24 horas. 
                Você receberá um e-mail com a cópia do ingresso informando que o mesmo foi validado com sucesso.
              </p>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'inline-block', maxWidth: '600px' }}>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>
                ✉️ O seu ingresso em formato digital também foi enviado para o seu e-mail: {formData.email}!
              </p>
            </div>
          )}

          <br/>
          
          {formData.forma_pagamento === 'cartao' ? (
            <div id="print-ticket" style={{ border: '2px dashed var(--primary)', background: 'rgba(0,0,0,0.4)', padding: '2rem', borderRadius: '1rem', display: 'inline-block', textAlign: 'left', minWidth: '300px', position: 'relative' }}>
              <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>GIRAFA TECH🎫</h3>
              <p><strong>Show de Inauguração</strong></p>
              <p><strong>Titular:</strong> {formData.nome}</p>
              <p><strong>Nº do Ingresso:</strong> #GT-{ingressoId.toString().padStart(5, '0')}</p>
              <p><strong>Data:</strong> 7 de junho de 2026</p>
              <p><strong>Local:</strong> FIAP de Pereira Barreto</p>
              
              <div style={{ background: 'white', padding: '0.5rem', display: 'inline-block', marginTop: '1rem', borderRadius: '0.5rem' }}>
                <QRCodeSVG value={`INGRESSO-GT-${ingressoId}-${formData.cpf}`} size={120} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem' }}>✓ Pago e Garantido</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '1rem', display: 'inline-block', textAlign: 'left' }}>
              <p><strong>Número do Pedido:</strong> #GT-{ingressoId.toString().padStart(5, '0')}</p>
              <p><strong>Nome:</strong> {formData.nome}</p>
              <p><strong>E-mail:</strong> {formData.email}</p>
              <p><strong>Status atual:</strong> <span className="badge badge-warning">Em Análise / Validação</span></p>
            </div>
          )}

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {formData.forma_pagamento === 'cartao' && (
              <button className="btn" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => window.print()}>
                🖨️ Imprimir / Baixar PDF
              </button>
            )}
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Comprar outro Ingresso</button>
          </div>
        </div>
      )}

    </div>
  );
}

function PixSimulador({ onsuccess, ingressoId }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const pixKey = "09551040848"; // Solicitado pelo usuário
  const payloadFormatado = `00020126330014br.gov.bcb.pix0111${pixKey}5204000053039865406250.005802BR5915Girafa Tech Inc6009Sao Paulo62070503***6304`; // Payload fake mas com a chave CPF

  const handleManualCheck = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 1000));
    try {
      await ingressosAPI.updateStatus(ingressoId, "em análise / aguardando 24h");
      onsuccess();
    } catch(err) {
      alert("Erro ao enviar confirmação");
      setIsVerifying(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ textAlign: 'center' }}>
      <h2>Pagamento via PIX</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Escaneie o QR Code abaixo com o aplicativo do seu banco:
      </p>
      
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem' }}>
        <QRCodeSVG value={payloadFormatado} size={250} level="M" />
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem', padding: '1rem. 1.5rem' }}
          onClick={handleManualCheck}
          disabled={isVerifying}
        >
          {isVerifying ? 'Aguarde...' : 'Já fiz o pagamento...'}
        </button>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
        <p className="form-label">Ou utilize o Pix Copia e Cola:</p>
        <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--accent)', marginBottom: '1rem' }}>
          {payloadFormatado}
        </p>
        <button 
          className="btn" 
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          onClick={() => {
            navigator.clipboard.writeText(payloadFormatado);
            alert("Chave Pix copiada!");
          }}
        >
          Copiar Chave
        </button>
      </div>


      <style>{`
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

export default Home;
