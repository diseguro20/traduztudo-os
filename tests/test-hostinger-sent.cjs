const tls = require('tls');

const client = tls.connect(993, 'imap.hostinger.com', () => {
  console.log('Connected to Hostinger IMAP on port 993 (SSL)');
});

let step = 0;
client.on('data', (data) => {
  const str = data.toString();
  console.log('IMAP <<', str.trim());

  if (step === 0 && str.includes('* OK')) {
    step = 1;
    client.write('A1 LOGIN "contato@traduztudo.com" "Diegoenrico2001*"\r\n');
  } else if (step === 1 && str.includes('A1 OK')) {
    step = 2;
    client.write('A2 STATUS "INBOX.Sent" (MESSAGES UNSEEN)\r\n');
  } else if (step === 2 && str.includes('A2 OK')) {
    step = 3;
    client.write('A3 SELECT "INBOX.Sent"\r\n');
  } else if (step === 3 && str.includes('A3 OK')) {
    step = 4;
    client.write('A4 FETCH 1:* (BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT MESSAGE-ID)])\r\n');
    setTimeout(() => {
      client.write('A5 LOGOUT\r\n');
    }, 1500);
  }
});

client.on('error', (err) => console.error('IMAP Error:', err));
client.on('end', () => console.log('IMAP Disconnected'));
setTimeout(() => {
  client.destroy();
  process.exit(0);
}, 10000);
