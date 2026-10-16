const tls = require('tls');

const client = tls.connect(993, 'imap.hostinger.com', () => {
  console.log('Connected to Hostinger IMAP');
});

let step = 0;
client.on('data', (data) => {
  const str = data.toString();

  if (step === 0 && str.includes('* OK')) {
    step = 1;
    client.write('A1 LOGIN "contato@traduztudo.com" "Diegoenrico2001*"\r\n');
  } else if (step === 1 && str.includes('A1 OK')) {
    step = 2;
    client.write('A2 SELECT "INBOX.Sent"\r\n');
  } else if (step === 2 && str.includes('A2 OK')) {
    step = 3;
    client.write('A3 FETCH 14:* (BODY.PEEK[HEADER.FIELDS (DATE TO SUBJECT)])\r\n');
  } else if (step === 3 && str.includes('A3 OK')) {
    console.log('=== SENT HEADERS 14 to 21 ===\n', str);
    client.write('A4 LOGOUT\r\n');
  }
});

client.on('error', (err) => console.error(err));
client.on('end', () => console.log('Done'));
setTimeout(() => client.destroy(), 10000);
