import fs from 'fs';
import dns from 'dns';

const dnsPromises = dns.promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

const content = fs.readFileSync('src/lib/prospecting/discoveryEngine.ts', 'utf8');
const emails = [...content.matchAll(/"contactEmail":\s*"([^"]+)"/g)].map((m) => m[1]);

console.log('Total emails no catálogo:', emails.length);

async function testAll() {
  let okCount = 0;
  let failCount = 0;
  const invalidList = [];

  for (const email of emails) {
    const domain = email.split('@')[1];
    try {
      const records = await dnsPromises.resolveMx(domain);
      if (records && records.length > 0) {
        okCount++;
      } else {
        failCount++;
        invalidList.push(email);
      }
    } catch {
      failCount++;
      invalidList.push(email);
    }
  }

  console.log({ okCount, failCount });
  if (invalidList.length > 0) {
    console.log('Emails com domínio inválido no catálogo:', invalidList);
  }
}

testAll();
