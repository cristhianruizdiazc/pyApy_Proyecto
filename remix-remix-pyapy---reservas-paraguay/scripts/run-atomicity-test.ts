// scripts/run-atomicity-test.ts
// PHASE 4: RESERVATION ATOMICITY TEST (HEAVY CONCURRENT STRESS)

const BASE_URL = 'http://127.0.0.1:3000';

async function runAtomicityVerification() {
  console.log('================================================================');
  console.log('⚡ FASE 4: DEMOSTRACIÓN DE ATOMICIDAD BAJO CONCURRENCIA EXTREMA');
  console.log('================================================================\n');

  const testDate = `2029-05-${Math.floor(10 + Math.random() * 15)}`;
  const propertyId = 'prop-sanber-sol-brisa';
  const concurrencyCount = 10;

  console.log(`Disparando ${concurrencyCount} peticiones de reserva simultáneas (Promise.all)`);
  console.log(`Alojamiento: Quinta Sanber Sol & Brisa`);
  console.log(`Fecha objetivo: ${testDate} (09:00 - 18:30)\n`);

  const requests = Array.from({ length: concurrencyCount }, (_, i) => {
    return fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId,
        turnId: 'turn-dia-completo',
        clientName: `Huésped Concurrente #${i + 1}`,
        clientDoc: `777000${i + 1}`,
        clientPhone: `+595 981 777 ${String(i).padStart(3, '0')}`,
        clientEmail: `stress${i}@pyapy.com.py`,
        startDate: testDate,
        startTime: '09:00',
        endTime: '18:30',
        guestCount: 4
      })
    }).then(async res => {
      const json = await res.json();
      return {
        threadId: i + 1,
        status: res.status,
        body: json
      };
    });
  });

  const results = await Promise.all(requests);

  const successes = results.filter(r => r.status === 201);
  const conflicts = results.filter(r => r.status === 409);
  const errors = results.filter(r => r.status !== 201 && r.status !== 409);

  console.log('Resultados de la ráfaga atómica:');
  results.forEach(r => {
    const icon = r.status === 201 ? '✅ ÉXITO (201 CREATED)' : '🛡️ BLOQUEADO (409 CONFLICT)';
    const msg = r.status === 201 ? `Localizador: ${r.body.reservation?.locator}` : `Razón: ${r.body.error}`;
    console.log(`  Hilo #${r.threadId.toString().padStart(2, '0')}: HTTP ${r.status} -> ${icon} | ${msg}`);
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`Total solicitudes concurrentes : ${concurrencyCount}`);
  console.log(`Reservas creadas exitosamente  : ${successes.length} (esperado: EXACTAMENTE 1)`);
  console.log(`Colisiones prevenidas (409)    : ${conflicts.length} (esperado: EXACTAMENTE ${concurrencyCount - 1})`);
  console.log(`Errores inesperados            : ${errors.length} (esperado: 0)`);
  console.log('----------------------------------------------------------------\n');

  if (successes.length === 1 && conflicts.length === concurrencyCount - 1 && errors.length === 0) {
    console.log('🎉 RESULTADO ATOMICIDAD: APROBADO (ZERO DOUBLE-BOOKING DEMOSTRADO MATEMÁTICAMENTE)');
  } else {
    console.error('❌ RESULTADO ATOMICIDAD: FALLÓ');
    process.exit(1);
  }
}

runAtomicityVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
