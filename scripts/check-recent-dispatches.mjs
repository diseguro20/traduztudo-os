import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

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

async function main() {
  const q = query(collection(db, 'traduztudo_prospect_outbound'), orderBy('sentAt', 'desc'), limit(15));
  const snap = await getDocs(q);
  console.log(`Found ${snap.docs.length} recent outbound messages:`);
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`- To: ${d.recipientEmail} (${d.recipientName}) | SentAt: ${d.sentAt} | Status: ${d.status} | Subject: ${d.subject}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
