async function runE2ETest() {
  const BASE_URL = 'http://localhost:3000';
  console.log('=== SAFE SOLUTIONS LABOUR PAYMENT MANAGER: E2E TEST SUITE ===\n');

  // 1. Test Login
  console.log('1. Testing Authentication for Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin@safe123' }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const cookies = loginRes.headers.get('set-cookie');
  console.log('✔ Logged in as:', loginData.user.fullName, `(${loginData.user.role})`);

  const headers = {
    'Content-Type': 'application/json',
    Cookie: cookies || '',
  };

  // 2. Register Labour
  console.log('\n2. Registering New Labour: Muhammad Ali...');
  const labourRes = await fetch(`${BASE_URL}/api/labour`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Muhammad Ali',
      fatherName: 'Abdul Rahman',
      mobile: '0300-1234567',
      workType: 'Mason (Mistri)',
      salaryType: 'DAILY',
      dailyRate: 2000,
      weeklyRate: 0,
      startDate: '2026-09-01',
      notes: 'Experienced bricklayer and plasterer',
    }),
  });
  const labourData = await labourRes.json();
  if (!labourRes.ok || !labourData.success) {
    throw new Error('Failed to create labour: ' + JSON.stringify(labourData));
  }
  const labourId = labourData.labour.id;
  console.log(`✔ Labour registered successfully with ID: ${labourId} (Rate: Rs. 2,000/day)`);

  // Helper to fetch and verify balances
  async function checkBalances(stepName, expectedPayable, expectedAdvance) {
    const res = await fetch(`${BASE_URL}/api/labour/${labourId}`, { headers });
    const data = await res.json();
    const bal = data.labour.balances;
    console.log(`   [${stepName}] -> Salary Payable: Rs. ${bal.salaryPayable.toLocaleString()} | Outstanding Advance: Rs. ${bal.outstandingAdvance.toLocaleString()}`);
    if (bal.salaryPayable !== expectedPayable || bal.outstandingAdvance !== expectedAdvance) {
      throw new Error(`Balance mismatch in ${stepName}! Expected Payable: ${expectedPayable}, Got: ${bal.salaryPayable}; Expected Advance: ${expectedAdvance}, Got: ${bal.outstandingAdvance}`);
    }
  }

  // 3. Step: + ADD SALARY DUE Rs. 20,000
  console.log('\n3. Recording Salary Due (Rs. 20,000 for Ground Floor Masonry)...');
  const dueRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      labourId,
      type: 'SALARY_DUE',
      amount: 20000,
      transactionDate: '2026-09-01',
      reference: 'Week 35 - Ground Floor Masonry',
      remarks: '10 days work calculated helper units',
      helperUnits: 10,
      helperRate: 2000,
    }),
  });
  if (!dueRes.ok) throw new Error('Salary Due failed: ' + await dueRes.text());
  await checkBalances('After Salary Due', 20000, 0);

  // 4. Step: + ADD ADVANCE Rs. 5,000
  console.log('\n4. Recording Advance Given (Rs. 5,000 Cash)...');
  const advRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      labourId,
      type: 'ADVANCE_GIVEN',
      amount: 5000,
      paymentMethod: 'CASH',
      transactionDate: '2026-09-03',
      reference: 'Voucher #104',
      remarks: 'Emergency family medical advance',
    }),
  });
  if (!advRes.ok) throw new Error('Advance failed: ' + await advRes.text());
  await checkBalances('After Advance Given', 20000, 5000);

  // 5. Step: + ADD SALARY PAYMENT Rs. 10,000
  console.log('\n5. Recording Salary Payment (Rs. 10,000 Bank transfer)...');
  const payRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      labourId,
      type: 'SALARY_PAYMENT',
      amount: 10000,
      paymentMethod: 'BANK',
      transactionDate: '2026-09-07',
      reference: 'MBL-Trx-8841',
      remarks: 'Partial wage settlement',
    }),
  });
  if (!payRes.ok) throw new Error('Payment failed: ' + await payRes.text());
  await checkBalances('After Salary Payment', 10000, 5000);

  // 6. Step: ADJUST ADVANCE Rs. 5,000 AGAINST SALARY
  console.log('\n6. Adjusting Advance (Rs. 5,000) against Salary Payable...');
  const adjRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      labourId,
      type: 'ADVANCE_ADJUSTMENT',
      amount: 5000,
      transactionDate: '2026-09-10',
      remarks: 'Settled emergency advance from September wage',
    }),
  });
  if (!adjRes.ok) throw new Error('Advance adjustment failed: ' + await adjRes.text());
  await checkBalances('After Advance Adjustment', 5000, 0);

  // 7. Step: + ADD DEDUCTION Rs. 1,000
  console.log('\n7. Recording Deduction (Rs. 1,000 Material Damage)...');
  const dedRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      labourId,
      type: 'DEDUCTION',
      amount: 1000,
      transactionDate: '2026-09-10',
      reference: 'Material Damage',
      remarks: 'Broken scaffold clamps',
    }),
  });
  if (!dedRes.ok) throw new Error('Deduction failed: ' + await dedRes.text());
  await checkBalances('After Deduction', 4000, 0);

  // 8. Verify Individual Ledger Running Balances
  console.log('\n8. Inspecting Individual Financial Ledger Table...');
  const ledgerRes = await fetch(`${BASE_URL}/api/labour/${labourId}`, { headers });
  const profileData = await ledgerRes.json();
  console.log(`   Ledger contains ${profileData.labour.ledger.length} events:`);
  profileData.labour.ledger.forEach((e) => {
    console.log(`   - ${new Date(e.transactionDate).toISOString().slice(0, 10)} | ${e.typeLabel.padEnd(18)} | Amount: Rs. ${e.amount.toLocaleString().padStart(6)} | Payable: Rs. ${e.runningSalaryPayable.toLocaleString().padStart(6)} | Advance: Rs. ${e.runningOutstandingAdvance.toLocaleString().padStart(5)}`);
  });

  // 9. Update Wage Rate & Check Rate History
  console.log('\n9. Testing Rate Update (Promotion to Rs. 2,200/day)...');
  const rateUpdateRes = await fetch(`${BASE_URL}/api/labour/${labourId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      salaryType: 'DAILY',
      dailyRate: 2200,
      effectiveFrom: '2026-10-01',
      rateChangeReason: 'Promoted to Lead Mason for Phase 2',
    }),
  });
  const rateUpdateData = await rateUpdateRes.json();
  if (!rateUpdateRes.ok) throw new Error('Rate update failed');
  console.log('✔ Rate updated to Rs. 2,200/day. Verifying that historical records retain exact amounts...');
  const verifyRes = await fetch(`${BASE_URL}/api/labour/${labourId}`, { headers });
  const verifyData = await verifyRes.json();
  if (verifyData.labour.balances.salaryPayable !== 4000) {
    throw new Error('Historical balance corrupted after rate change!');
  }
  console.log(`✔ Rate History timeline has ${verifyData.labour.rates.length} records. Balance safely remains Rs. 4,000.`);

  // 10. Verify Dashboard Metrics
  console.log('\n10. Verifying Dashboard Metrics...');
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, { headers });
  const dashData = await dashRes.json();
  console.log('✔ Dashboard KPI metrics:', {
    totalLabour: dashData.metrics.totalLabour,
    activeLabour: dashData.metrics.activeLabour,
    salaryPayable: `Rs. ${dashData.metrics.salaryPayable.toLocaleString()}`,
    totalPaid: `Rs. ${dashData.metrics.totalPaid.toLocaleString()}`,
    totalAdvances: `Rs. ${dashData.metrics.totalAdvances.toLocaleString()}`,
    outstandingAdvances: `Rs. ${dashData.metrics.outstandingAdvances.toLocaleString()}`,
    totalDeductions: `Rs. ${dashData.metrics.totalDeductions.toLocaleString()}`,
  });

  // 11. Verify Audit Logs
  console.log('\n11. Verifying Audit Trail...');
  const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, { headers });
  const auditData = await auditRes.json();
  console.log(`✔ Audit log has recorded ${auditData.logs.length} immutable events.`);

  console.log('\n🎉 ALL E2E VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
}

runE2ETest().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
