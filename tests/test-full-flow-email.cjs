const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');
const fs = require('fs');
const path = require('path');
const tls = require('tls');

const smtpUser = 'contato@traduztudo.com';
const smtpPass = 'Diegoenrico2001*';

const pdfPath = path.join(__dirname, '..', 'public', 'attachments', 'Proposta_Comercial_Traduz_Tudo_Italiano.pdf');
const imgPath = path.join(__dirname, '..', 'public', 'attachments', 'assinatura-cartao-traduztudo.png');

const pdfContent = fs.readFileSync(pdfPath);
const imgContent = fs.readFileSync(imgPath);

const mailOptions = {
  from: '"Iago Peixoto | Traduz Tudo" <contato@traduztudo.com>',
  to: 'contato@traduztudo.com',
  subject: 'Tradução juramentada. (Teste de Validação Automática)',
  text: `Olá, tudo bem?

Meu nome é Iago Peixoto e represento a Traduz Tudo, uma empresa especializada em soluções linguísticas para pessoas físicas e jurídicas.

Gostaria de apresentar nossos serviços e colocar nossa equipe à disposição para uma possível parceria com sua empresa.

🌐 Trabalhamos com mais de 15 idiomas, oferecendo:

- Tradução juramentada, com assinatura física ou digital;
- Tradução técnica e especializada;
- Tradução livre de documentos;
- Tradução simultânea.

Nosso compromisso é oferecer qualidade, agilidade, organização e preços altamente competitivos, atendendo desde demandas pontuais até grandes volumes de documentos.

Contamos com profissionais qualificados e buscamos construir parcerias duradouras, oferecendo condições comerciais diferenciadas para empresas com demandas recorrentes.

📌 Segue em anexo PDF contendo os valores para tradução juramentada no idioma italiano.

Será um prazer entender as necessidades da sua empresa e apresentar uma proposta personalizada, com excelentes condições comerciais.

Fico à disposição para conversarmos!

Atenciosamente,
Iago Peixoto | Traduz Tudo
contato@traduztudo.com | (11) 94748-5091`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 15px;">
      <p>Olá, tudo bem?</p>
      <p>Meu nome é <strong>Iago Peixoto</strong> e represento a <strong>Traduz Tudo</strong>, uma empresa especializada em soluções linguísticas para pessoas físicas e jurídicas.</p>
      <p>Gostaria de apresentar nossos serviços e colocar nossa equipe à disposição para uma possível parceria com sua empresa.</p>
      <p>🌐 <strong>Trabalhamos com mais de 15 idiomas, oferecendo:</strong></p>
      <ul style="list-style-type: disc; margin-left: 20px; padding-left: 0;">
        <li>Tradução juramentada, com assinatura física ou digital;</li>
        <li>Tradução técnica e especializada;</li>
        <li>Tradução livre de documentos;</li>
        <li>Tradução simultânea.</li>
      </ul>
      <p>Nosso compromisso é oferecer qualidade, agilidade, organização e preços altamente competitivos, atendendo desde demandas pontuais até grandes volumes de documentos.</p>
      <p>Contamos com profissionais qualificados e buscamos construir parcerias duradouras, oferecendo condições comerciais diferenciadas para empresas com demandas recorrentes.</p>
      <p>📌 <strong>Segue em anexo PDF contendo os valores para tradução juramentada no idioma italiano.</strong></p>
      <p>Será um prazer entender as necessidades da sua empresa e apresentar uma proposta personalizada, com excelentes condições comerciais.</p>
      <p>Fico à disposição para conversarmos!</p>
      <p>Atenciosamente,</p>
      <div style="margin-top: 15px; margin-bottom: 25px;">
        <img src="cid:cartao-traduztudo" alt="Traduz Tudo - Cartão de Visita e Contato" width="556" style="max-width: 100%; height: auto; border-radius: 6px; display: block;" />
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
      <p style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
        Esta mensagem foi enviada em conformidade com a LGPD (Lei 13.709/2018). Caso não queira mais receber nossos contatos, <a href="https://traduztudo-os.vercel.app/api/prospecting/unsubscribe?token=contato%40traduztudo.com" style="color: #64748b; text-decoration: underline;">clique aqui para descadastrar</a>.
      </p>
    </div>
  `,
  attachments: [
    {
      filename: 'Proposta_Comercial_Traduz_Tudo_Italiano.pdf',
      content: pdfContent,
      contentType: 'application/pdf',
    },
    {
      filename: 'assinatura corrigidda.jpeg',
      content: imgContent,
      cid: 'cartao-traduztudo',
      contentType: 'image/jpeg',
    },
  ],
};

async function run() {
  console.log('1. Sending via Hostinger SMTP...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const sendInfo = await transporter.sendMail(mailOptions);
  console.log('SMTP SENT! Message-ID:', sendInfo.messageId);

  console.log('2. Compiling raw RFC822 for IMAP append...');
  const composer = new MailComposer(mailOptions);
  composer.compile().build(async (err, rawBuf) => {
    if (err) {
      console.error('Error compiling:', err);
      return;
    }
    console.log('Raw buffer size:', rawBuf.length);

    console.log('3. Appending to INBOX.Sent via IMAP...');
    const client = tls.connect(993, 'imap.hostinger.com', () => {
      console.log('Connected to Hostinger IMAP on 993');
    });

    let step = 0;
    client.on('data', (data) => {
      const str = data.toString();
      if (step === 0 && str.includes('* OK')) {
        step = 1;
        client.write(`A1 LOGIN "${smtpUser}" "${smtpPass}"\r\n`);
      } else if (step === 1 && str.includes('A1 OK')) {
        step = 2;
        const size = Buffer.byteLength(rawBuf);
        client.write(`A2 APPEND "INBOX.Sent" (\\Seen) {${size}}\r\n`);
      } else if (step === 2 && str.includes('+')) {
        step = 3;
        client.write(rawBuf);
        client.write('\r\n');
      } else if (step === 3 && str.includes('A2 OK')) {
        console.log('SUCCESS! Appended to INBOX.Sent!');
        client.write('A3 LOGOUT\r\n');
        setTimeout(() => process.exit(0), 1000);
      }
    });
  });
}

run().catch(console.error);
