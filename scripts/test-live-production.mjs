const payload = {
  event: 'message.received',
  account: 'contato@traduztudo.com',
  data: {
    messageId: `<prod-check-${Date.now()}@teste-cliente.com>`,
    from: 'lucas.mendonca@advocaciainternacional.com',
    fromName: 'Lucas Mendonça - Advocacia',
    to: ['contato@traduztudo.com'],
    subject: 'Cotação: Tradução Juramentada para Cidadania Italiana (3 certidões)',
    date: new Date().toISOString(),
    text: 'Prezados, temos 3 certidões em inteiro teor (nascimento, casamento e óbito) para tradução juramentada com apostilamento. Precisamos do orçamento e prazo médio. Obrigado.',
  },
};

async function testProductionWebhook() {
  console.log('Testando Webhook de Produção Vercel...');
  const res = await fetch('https://traduztudo-os.vercel.app/api/webhooks/hostinger-mail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer tt_whsec_98f4b1e7c3a0d52e1864a2b97c',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('Status HTTP:', res.status);
  console.log('Resposta:', JSON.stringify(data, null, 2));

  if (res.status === 200 && data.success) {
    console.log('✓ TESTE DE PRODUÇÃO VALIDADO COM SUCESSO 100%!');
  } else {
    console.error('Falha no teste de produção:', data);
  }
}

testProductionWebhook().catch(console.error);
