import tls from 'tls';

const client = tls.connect(993, 'imap.hostinger.com', () => {
  client.setEncoding('utf8');
});

let step = 0;
let buf = '';

client.on('data', (chunk) => {
  buf += chunk;
  if (step === 0 && buf.includes('* OK')) {
    step = 1; buf = '';
    client.write('T1 LOGIN "contato@traduztudo.com" "Diegoenrico2001@"\r\n');
  } else if (step === 1 && buf.includes('T1 OK')) {
    step = 2; buf = '';
    client.write('T2 SELECT "INBOX"\r\n');
  } else if (step === 2 && buf.includes('T2 OK')) {
    step = 3; buf = '';
    client.write('T3 SEARCH ALL\r\n');
  } else if (step === 3 && buf.includes('T3 OK')) {
    const nums = buf.match(/\*\s+SEARCH\s+(.*)/i);
    const list = nums && nums[1] ? nums[1].trim().split(/\s+/).map(Number).filter((n) => !isNaN(n)) : [];
    console.log('Total de mensagens na INBOX:', list.length);
    if (list.length === 0) {
      client.write('T5 LOGOUT\r\n');
      client.destroy();
      return;
    }
    step = 4; buf = '';
    const last = list[list.length - 1];
    const fromSeq = Math.max(1, last - 10);
    client.write(`T4 FETCH ${fromSeq}:${last} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)] BODY.PEEK[TEXT]<0.500>)\r\n`);
  } else if (step === 4 && buf.includes('T4 OK')) {
    console.log('--- ÚLTIMAS MENSAGENS NA INBOX ---');
    console.log(buf);
    client.write('T5 LOGOUT\r\n');
    setTimeout(() => client.destroy(), 500);
  }
});

client.on('error', (e) => console.error('IMAP error:', e.message));
