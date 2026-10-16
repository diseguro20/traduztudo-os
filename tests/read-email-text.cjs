const fs = require('fs');
const path = require('path');

const emlPath = path.join(__dirname, 'raw-last-sent.eml');
const raw = fs.readFileSync(emlPath, 'utf8');

// Search for text/plain or text/html
const plainIdx = raw.indexOf('Content-Type: text/plain');
if (plainIdx !== -1) {
  const end = raw.indexOf('Content-Type: text/html', plainIdx);
  console.log('=== TEXT/PLAIN ===');
  console.log(raw.substring(plainIdx, end !== -1 ? end : plainIdx + 1000));
}

const htmlIdx = raw.indexOf('Content-Type: text/html');
if (htmlIdx !== -1) {
  const end = raw.indexOf('--enmime-', htmlIdx);
  console.log('=== TEXT/HTML ===');
  console.log(raw.substring(htmlIdx, end !== -1 ? end : htmlIdx + 2000));
}
