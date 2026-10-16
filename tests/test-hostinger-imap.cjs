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
    console.log('Authenticating with contato@traduztudo.com...');
    client.write('A1 LOGIN "contato@traduztudo.com" "Diegoenrico2001*"\r\n');
  } else if (step === 1 && str.includes('A1 OK')) {
    step = 2;
    console.log('Authentication Successful! Listing folders...');
    client.write('A2 LIST "" "*"\r\n');
  } else if (step === 2 && str.includes('A2 OK')) {
    step = 3;
    console.log('Checking INBOX and Sent statuses...');
    client.write('A3 STATUS "INBOX" (MESSAGES UNSEEN)\r\n');
    client.write('A4 STATUS "Sent" (MESSAGES UNSEEN)\r\n');
    client.write('A5 LOGOUT\r\n');
  }
});

client.on('error', (err) => console.error('IMAP Error:', err));
client.on('end', () => console.log('IMAP Disconnected'));
setTimeout(() => {
  client.destroy();
  process.exit(0);
}, 8000);
