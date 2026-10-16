const fs = require('fs');
const path = require('path');

const emlPath = path.join(__dirname, 'raw-last-sent.eml');
const raw = fs.readFileSync(emlPath, 'utf8');

// 1. Extract and save the PDF
const pdfStart = raw.indexOf('filename=Proposta_Comercial_Traduz_Tudo_Italiano.pdf');
if (pdfStart !== -1) {
  const headerEnd = raw.indexOf('\r\n\r\n', pdfStart);
  const boundaryNext = raw.indexOf('--enmime-c14c4a2d-5509-4767-9919-641576b0e62b', headerEnd);
  const base64Content = raw.substring(headerEnd + 4, boundaryNext).replace(/\r?\n/g, '').trim();
  const pdfBuffer = Buffer.from(base64Content, 'base64');
  
  const publicDir = path.join(__dirname, '..', 'public', 'attachments');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  
  const targetPdf = path.join(publicDir, 'Proposta_Comercial_Traduz_Tudo_Italiano.pdf');
  fs.writeFileSync(targetPdf, pdfBuffer);
  console.log(`Saved PDF to ${targetPdf} (${pdfBuffer.length} bytes)`);
}

// 2. Extract inner multipart/related
const innerBoundaryMatch = raw.match(/boundary="?([^"\r\n]+)"?/g);
console.log('All boundaries:', innerBoundaryMatch);

const relBoundary = 'enmime-9c27a68c-0997-457b-8e53-5769c1e15f05';
if (raw.includes(relBoundary)) {
  const relParts = raw.split('--' + relBoundary);
  console.log('Inner parts count:', relParts.length);
  relParts.forEach((p, idx) => {
    console.log(`\n--- INNER PART ${idx} ---`);
    const sep = p.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const h = p.substring(0, sep);
      const b = p.substring(sep + 4);
      console.log('Headers:', h);
      if (h.includes('base64')) {
        const decoded = Buffer.from(b.replace(/\r?\n/g, ''), 'base64').toString('utf8');
        console.log('Decoded Body:\n', decoded);
      } else if (h.includes('quoted-printable')) {
        console.log('QP Body:\n', b.substring(0, 1500));
      } else {
        console.log('Plain Body:\n', b.substring(0, 1500));
      }
    }
  });
}
