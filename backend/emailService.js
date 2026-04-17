const nodemailer = require('nodemailer');

async function createTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Fallback to Ethereal
        let testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
}

async function sendConfirmationEmail(ingresso) {
    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: '"Girafa Tech" <inauguracao2026@girafatech.com>',
            to: ingresso.email,
            subject: "✔ Ingresso Confirmado! Show de Inauguração Girafa Tech",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">🎫 Show de Inauguração</h1>
                        <p style="margin: 0; font-size: 16px;">Sua reserva foi confirmada!</p>
                    </div>
                    <div style="padding: 20px;">
                        <p>Olá, <strong>${ingresso.nome}</strong>!</p>
                        <p>O pagamento do seu ingresso foi recebido e validado com sucesso pela nossa equipe. Estamos prontos para viver essa incrível experiência com você!</p>
                        
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1e3a8a;">Detalhes do Ingresso</h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li><strong>Pedido:</strong> #GT-${ingresso.id.toString().padStart(5, '0')}</li>
                                <li><strong>Data:</strong> 7 de junho de 2026</li>
                                <li><strong>Local:</strong> FIAP de Pereira Barreto</li>
                                <li><strong>Valor Pago:</strong> R$ 250,00</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 14px; text-align: center; color: #666;">Por favor, apresente este e-mail na portaria acompanhado de um documento com foto.</p>
                    </div>
                    <div style="background-color: #1e3a8a; color: white; text-align: center; padding: 10px; font-size: 12px;">
                        &copy; 2026 Girafa Tech Innovations
                    </div>
                </div>
            `,
        });

        console.log(`[EMAIL SEND] Mensagem enviada com sucesso: ${info.messageId}`);
        
        // Log para testes com Ethereal (só roda se não tivermos SMTP local produtivo)
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log(`\n===========================================`);
            console.log(`[ETHEREAL PREVIEW URL] 🔗 Abra para visualizar o e-mail: `);
            console.log(nodemailer.getTestMessageUrl(info));
            console.log(`===========================================\n`);
        }
        
        return true;
    } catch (error) {
        console.error("[EMAIL SEND ERROR] Erro ao enviar e-mail:", error);
        return false;
    }
}

module.exports = { sendConfirmationEmail };
