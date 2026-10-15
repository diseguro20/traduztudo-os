async function testActions() {
  const emailId = 'msg-1792093530604-keeuh';
  
  // Test 1: Save draft
  console.log('1. Testando SAVE_DRAFT...');
  const resSave = await fetch('https://traduztudo-os.vercel.app/api/email/central/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailId,
      action: 'SAVE_DRAFT',
      editedDraft: 'Olá Lucas, minuta revisada com sucesso pela equipe Traduz Tudo.',
      userId: 'user-carlos',
      userName: 'Carlos Silva',
    }),
  });
  const dataSave = await resSave.json();
  console.log('Save status:', resSave.status, 'Response:', dataSave);

  // Test 2: Approve and send (with AUTO_SEND=false simulation)
  console.log('\n2. Testando APPROVE_AND_SEND (modo de simulação/produção)...');
  const resApprove = await fetch('https://traduztudo-os.vercel.app/api/email/central/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailId,
      action: 'APPROVE_AND_SEND',
      editedDraft: 'Olá Lucas, sua proposta foi montada e está pronta.',
      userId: 'user-carlos',
      userName: 'Carlos Silva',
    }),
  });
  const dataApprove = await resApprove.json();
  console.log('Approve status:', resApprove.status, 'Response:', dataApprove);
}

testActions().catch(console.error);
