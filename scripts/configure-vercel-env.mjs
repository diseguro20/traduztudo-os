import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const envVars = [
  { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: 'AIzaSyClkdeJ8B2qkG7n8aFrrOquQ8flBQMIpFU', type: 'config' },
  { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: 'saltocash-platform-2026.firebaseapp.com', type: 'config' },
  { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: 'saltocash-platform-2026', type: 'config' },
  { name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: 'saltocash-platform-2026.firebasestorage.app', type: 'config' },
  { name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: '526114457881', type: 'config' },
  { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: '1:526114457881:web:ab605cae6d2394a4ec1d88', type: 'config' },
  { name: 'NEXT_PUBLIC_APP_NAME', value: 'TraduzTudo OS', type: 'config' },
  { name: 'NEXT_PUBLIC_APP_URL', value: 'https://traduztudo-os.vercel.app', type: 'config' },
  { name: 'NEXT_PUBLIC_API_SECRET_KEY', value: 'traduztudo-saas-api-secret-key-2026', type: 'config' },
  { name: 'HOSTINGER_MAIL_ACCOUNT', value: 'contato@traduztudo.com', type: 'config' },
  { name: 'HOSTINGER_WEBHOOK_SECRET', value: 'tt_whsec_98f4b1e7c3a0d52e1864a2b97c', type: 'secret' },
  { name: 'HOSTINGER_SMTP_HOST', value: 'smtp.hostinger.com', type: 'config' },
  { name: 'HOSTINGER_SMTP_PORT', value: '465', type: 'config' },
  { name: 'HOSTINGER_SMTP_USER', value: 'contato@traduztudo.com', type: 'config' },
  { name: 'AUTO_SEND', value: 'false', type: 'config' },
];

console.log('--- Configurando Variáveis de Ambiente no Vercel ---');

for (const env of envVars) {
  try {
    console.log(`Configurando ${env.name}...`);
    const cmd = `cmd /c npx vercel env add ${env.name} production,preview,development --type ${env.type} --value "${env.value}" --force --yes --non-interactive`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`Aviso ao configurar ${env.name}:`, err.message);
  }
}

console.log('--- Atualizando .env.local local ---');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let content = '';
if (fs.existsSync(envLocalPath)) {
  content = fs.readFileSync(envLocalPath, 'utf8');
}

for (const env of envVars) {
  if (!content.includes(`${env.name}=`)) {
    content += `\n${env.name}="${env.value}"`;
  }
}

fs.writeFileSync(envLocalPath, content.trim() + '\n', 'utf8');
console.log('✓ Todas as variáveis configuradas com sucesso no Vercel e localmente!');
