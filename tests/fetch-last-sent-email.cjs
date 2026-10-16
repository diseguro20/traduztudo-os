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
    // Get total messages and fetch last 3
    client.write('A3 SEARCH ALL\r\n');
  } else if (step === 3 && str.includes('A3 OK')) {
    step = 4;
    const match = str.match(/\* SEARCH ([\d\s]+)/);
    if (match && match[1]) {
      const ids = match[1].trim().split(/\s+/).map(Number);
      console.log('Total sent messages count:', ids.length);
      const lastId = ids[ids.length - 1];
      console.log('Fetching full structure and content of message UID/Seq:', lastId);
      // Fetch body structure and body
      client.write(`A4 FETCH ${lastId} (BODYSTRUCTURE)\r\n`);
      client.write(`A5 FETCH ${lastId} (BODY[TEXT])\r\n`);
      client.write(`A6 FETCH ${lastId} (BODY[HEADER])\r\n`);
    } else {
      console.log('No messages found in SEARCH:', str);
      client.write('A7 LOGOUT\r\n');
    }
  } else if (step === 4 && (str.includes('A5 OK') || str.includes('A6 OK'))) {
    console.log('--- RECEIVED DATA ---');
    console.log(str);
    setTimeout(() => {
      client.write('A8 LOGOUT\r\n');
    }, 1000);
  }
});

client.on('error', (err) => console.error('IMAP Error:', err));
client.on('end', () => console.log('IMAP Disconnected'));
setTimeout(() => {
  client.destroy();
  process.exit(0);
}, 15000);
