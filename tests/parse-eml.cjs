const fs = require('fs');
const path = require('path');

const emlPath = path.join(__dirname, 'raw-last-sent.eml');
const raw = fs.readFileSync(emlPath, 'utf8');

console.log('--- HEADERS & PARTS PREVIEW ---');
const lines = raw.split(/\r?\n/);
let headerSection = true;
let headers = [];
for (let line of lines) {
  if (headerSection) {
    if (line.trim() === '') {
      headerSection = false;
      break;
    }
    headers.push(line);
  }
}
console.log('HEADERS:\n', headers.join('\n'));

// Let's find boundary and content-types
const boundaryMatch = raw.match(/boundary="?([^"\r\n]+)"?/);
if (boundaryMatch) {
  const boundary = boundaryMatch[1];
  console.log('Boundary:', boundary);
  const parts = raw.split('--' + boundary);
  console.log('Parts count:', parts.length);
  parts.forEach((part, idx) => {
    console.log(`\n=== PART ${idx} ===`);
    const partHeaderEnd = part.indexOf('\r\n\r\n');
    if (partHeaderEnd !== -1) {
      const partHeaders = part.substring(0, partHeaderEnd);
      console.log('Part Headers:\n', partHeaders);
      const partBody = part.substring(partHeaderEnd + 4);
      if (partHeaders.includes('text/plain') || partHeaders.includes('text/html')) {
        console.log('Part Body Content:\n', partBody.substring(0, 1000));
      } else if (partHeaders.includes('application/pdf') || partHeaders.includes('filename=')) {
        console.log('PDF Attachment detected! Length in base64 chars:', partBody.length);
      }
    }
  });
}
