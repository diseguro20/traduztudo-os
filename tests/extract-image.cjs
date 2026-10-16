const fs = require('fs');
const path = require('path');

const emlPath = path.join(__dirname, 'raw-last-sent.eml');
const raw = fs.readFileSync(emlPath, 'utf8');

// Search for the image cid:e5d60d1f-9ebb-4b90-a10e-d27c00340f49
const imgCid = 'e5d60d1f-9ebb-4b90-a10e-d27c00340f49';
const cidIdx = raw.indexOf(imgCid);
console.log('CID Index:', cidIdx);

if (cidIdx !== -1) {
  // Find headers of this part
  const partStart = raw.lastIndexOf('--enmime-', cidIdx);
  const headerEnd = raw.indexOf('\r\n\r\n', cidIdx);
  const headers = raw.substring(partStart, headerEnd);
  console.log('Image Part Headers:\n', headers);
  
  const nextBoundary = raw.indexOf('--enmime-', headerEnd);
  const base64Content = raw.substring(headerEnd + 4, nextBoundary).replace(/\r?\n/g, '').trim();
  console.log('Image base64 length:', base64Content.length);
  
  const imgBuffer = Buffer.from(base64Content, 'base64');
  const targetImg = path.join(__dirname, '..', 'public', 'attachments', 'assinatura-cartao-traduztudo.png');
  fs.writeFileSync(targetImg, imgBuffer);
  console.log(`Saved signature image to ${targetImg} (${imgBuffer.length} bytes)`);
}
