const tls = require('tls');

function appendToSent(rawMime) {
  return new Promise((resolve, reject) => {
    const client = tls.connect(993, 'imap.hostinger.com', () => {
      console.log('Connected to IMAP for APPEND test');
    });

    let step = 0;
    client.on('data', (data) => {
      const str = data.toString();
      // console.log('IMAP <<', str.trim());

      if (step === 0 && str.includes('* OK')) {
        step = 1;
        client.write('A1 LOGIN "contato@traduztudo.com" "Diegoenrico2001*"\r\n');
      } else if (step === 1 && str.includes('A1 OK')) {
        step = 2;
        const size = Buffer.byteLength(rawMime);
        console.log(`Starting APPEND "INBOX.Sent" with size ${size}...`);
        client.write(`A2 APPEND "INBOX.Sent" (\\Seen) {${size}}\r\n`);
      } else if (step === 2 && str.includes('+')) {
        step = 3;
        client.write(rawMime);
        client.write('\r\n');
      } else if (step === 3 && str.includes('A2 OK')) {
        console.log('SUCCESSFULLY APPENDED TO INBOX.Sent!');
        client.write('A3 LOGOUT\r\n');
        resolve(true);
      } else if (step === 3 && str.includes('A2 NO') || str.includes('A2 BAD')) {
        console.error('APPEND FAILED:', str);
        reject(new Error(str));
      }
    });

    client.on('error', reject);
    setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 10000);
  });
}

// Test with a dummy message
const testMime = `From: <contato@traduztudo.com>\r
To: <teste@traduztudo.com>\r
Subject: Teste de Sincronizacao Sent\r
Date: ${new Date().toUTCString()}\r
Message-ID: <test_${Date.now()}@traduztudo.com>\r
MIME-Version: 1.0\r
Content-Type: text/plain; charset=utf-8\r
\r
Este e um teste de sincronizacao de enviados na Hostinger.\r\n`;

appendToSent(testMime).then((ok) => {
  console.log('Result:', ok);
  process.exit(0);
});
