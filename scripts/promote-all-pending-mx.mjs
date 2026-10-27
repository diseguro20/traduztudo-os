import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function checkMx(domain) {
  try {
    const recs = await dns.promises.resolveMx(domain);
    if (!recs || recs.length === 0) return false;
    const isHostingerPark = recs.every(r => r.exchange.toLowerCase().includes('hostinger'));
    if (isHostingerPark && !domain.includes('traduztudo')) return false;
    return true;
  } catch {
    return false;
  }
}

async function promoteAll() {
  console.log('[PROMOTER] Carregando empresas com status CONTATO_PENDENTE...');
  const snap = await getDocs(
    query(collection(db, 'traduztudo_prospect_companies'), where('status', '==', 'CONTATO_PENDENTE'))
  );
  console.log(`[PROMOTER] Total encontradas: ${snap.docs.length}`);

  let promotedCount = 0;
  let rejectedCount = 0;
  const now = new Date().toISOString();

  // Process in batches of 10 for speed
  const docs = snap.docs;
  const batchSize = 10;

  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (d) => {
        const comp = d.data();
        const email = comp.contactEmail || comp.email || '';
        if (!email || !email.includes('@')) {
          rejectedCount++;
          return;
        }

        const domain = email.split('@')[1].toLowerCase().trim();
        const mxOk = await checkMx(domain);

        if (mxOk) {
          promotedCount++;
          await updateDoc(doc(db, 'traduztudo_prospect_companies', d.id), {
            status: 'CONTATO_VERIFICADO',
            optOut: false,
            notes: `Contato verificado com servidor MX ativo (${domain}). Apto para disparo contínuo 24/7.`,
            updatedAt: now,
          });
        } else {
          rejectedCount++;
          await updateDoc(doc(db, 'traduztudo_prospect_companies', d.id), {
            status: 'CONTATO_INVALIDO',
            notes: `Domínio sem servidor MX ativo (${domain}). Descartado preventivamente contra bounces.`,
            updatedAt: now,
          });
        }
      })
    );

    if ((i + batchSize) % 50 === 0 || i + batchSize >= docs.length) {
      console.log(`[PROMOTER] Progresso: ${Math.min(i + batchSize, docs.length)}/${docs.length} avaliados (Promovidos: ${promotedCount}, Rejeitados: ${rejectedCount})`);
    }
  }

  console.log(`\n=== CONCLUÍDO ===`);
  console.log(`Total promovidos para CONTATO_VERIFICADO: ${promotedCount}`);
  console.log(`Total rejeitados para CONTATO_INVALIDO: ${rejectedCount}`);
}

promoteAll().catch(console.error);
