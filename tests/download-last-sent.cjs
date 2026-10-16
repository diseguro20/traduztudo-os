const tls = require('tls');
const fs = require('fs');
const path = require('path');

const client = tls.connect(993, 'imap.hostinger.com', () => {
  console.log('Connected to Hostinger IMAP');
});

let step = 0;
let rawEmail = Buffer.alloc(0);
let collecting = false;

client.on('data', (data) => {
  if (collecting) {
    rawEmail = Buffer.concat([rawEmail, data]);
    if (data.toString().includes('A4 OK Fetch completed')) {
      collecting = false;
      client.write('A5 LOGOUT\r\n');
      processEmail(rawEmail);
    }
    return;
  }

  const str = data.toString();
  if (step === 0 && str.includes('* OK')) {
    step = 1;
    client.write('A1 LOGIN "contato@traduztudo.com" "Diegoenrico2001*"\r\n');
  } else if (step === 1 && str.includes('A1 OK')) {
    step = 2;
    client.write('A2 SELECT "INBOX.Sent"\r\n');
  } else if (step === 2 && str.includes('A2 OK')) {
    step = 3;
    client.write('A3 SEARCH ALL\r\n');
  } else if (step === 3 && str.includes('A3 OK')) {
    step = 4;
    const match = str.match(/\* SEARCH ([\d\s]+)/);
    if (match && match[1]) {
      const ids = match[1].trim().split(/\s+/).map(Number);
      const lastId = ids[ids.length - 1];
      console.log('Fetching raw RFC822 for message Seq:', lastId);
      collecting = true;
      client.write(`A4 FETCH ${lastId} (RFC822)\r\n`);
    }
  }
});

function processEmail(buf) {
  console.log('Total raw buffer bytes received:', buf.length);
  const outPath = path.join(__dirname, 'raw-last-sent.eml');
  fs.writeFileSync(outPath, buf);
  console.log('Saved raw email to:', outPath);
}

client.on('error', (err) => console.error('IMAP Error:', err));
client.on('end', () => console.log('IMAP Disconnected'));
setTimeout(() => {
  client.destroy();
}, 20000);
