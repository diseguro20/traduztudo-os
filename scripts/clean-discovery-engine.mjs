import fs from 'fs';
import dns from 'dns';

const dnsPromises = dns.promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

const filePath = 'src/lib/prospecting/discoveryEngine.ts';
const content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'export const VERIFIED_BRAZILIAN_PROSPECTS: SeedProspectCandidate[] = [';
const endMarker = '\n];\n\nexport class DiscoveryEngine {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Marcadores não encontrados');
  process.exit(1);
}

const header = content.substring(0, startIdx + startMarker.length);
const footer = content.substring(endIdx);
const rawJson = content.substring(startIdx + startMarker.length, endIdx);

const items = JSON.parse(`[${rawJson}]`);
console.log('Original items count:', items.length);

async function clean() {
  const verifiedList = [];
  for (const item of items) {
    const domain = (item.contactEmail || '').split('@')[1];
    if (!domain) continue;
    try {
      const records = await dnsPromises.resolveMx(domain);
      if (records && records.length > 0) {
        verifiedList.push(item);
      } else {
        console.log('Removendo do catálogo (sem MX):', item.tradeName, item.contactEmail);
      }
    } catch {
      console.log('Removendo do catálogo (sem MX):', item.tradeName, item.contactEmail);
    }
  }

  console.log('Itens válidos mantidos:', verifiedList.length);
  const formatted = JSON.stringify(verifiedList, null, 2);
  const newContent = `${header}\n${formatted.substring(1, formatted.length - 1)}\n${footer}`;
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('discoveryEngine.ts atualizado com sucesso!');
}

clean().catch(console.error);
