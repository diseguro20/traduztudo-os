const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');

const mailOptions = {
  from: '"Iago Peixoto | Traduz Tudo" <contato@traduztudo.com>',
  to: 'teste@traduztudo.com',
  subject: 'Tradução juramentada.',
  text: 'Olá, tudo bem?',
  html: '<p>Olá, tudo bem?</p>',
};

const composer = new MailComposer(mailOptions);
composer.compile().build((err, message) => {
  if (err) {
    console.error('Build err:', err);
  } else {
    console.log('Compiled RFC822 raw length:', message.length);
    console.log('Header sample:\n', message.toString().substring(0, 300));
  }
});
