// scripts/verify-notifications.ts
// PHASE 6: NOTIFICATION VERIFICATION SCRIPT

const BASE_URL = 'http://127.0.0.1:3000';

async function verifyNotifications() {
  console.log('================================================================');
  console.log('📢 FASE 6: VERIFICACIÓN DEL SISTEMA DE NOTIFICACIONES pyApy');
  console.log('================================================================\n');

  const testDate = `2029-06-${Math.floor(10 + Math.random() * 15)}`;
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      propertyId: 'prop-sanber-sol-brisa',
      turnId: 'turn-dia-completo',
      clientName: 'Don Arnaldo Giménez',
      clientDoc: '2.980.111',
      clientPhone: '+595 981 900 800',
      clientEmail: 'arnaldo@pyapy.com.py',
      startDate: testDate,
      startTime: '09:00',
      endTime: '18:30',
      guestCount: 6
    })
  });

  const data = await res.json();
  const notification = data.ownerNotificationMessage;

  console.log('1. Mensaje de notificación generado por el servidor autoritativo:');
  console.log('----------------------------------------------------------------');
  console.log(notification);
  console.log('----------------------------------------------------------------\n');

  // Verify strict format compliance
  const hasGreeting = notification.includes('🔔 ¡Conseguimos una reserva para vos!');
  const hasAccommodation = notification.includes('Alojamiento: Quinta Sanber Sol & Brisa');
  const hasDate = notification.includes(`Fecha: ${testDate} (09:00 a 18:30 hs)`);
  const hasGuests = notification.includes('Huéspedes: 6 personas');
  const hasClient = notification.includes('Cliente: Don Arnaldo Giménez (+595 981 900 800)');
  const hasTotal = notification.includes('Total: Gs. 1.200.000');
  const hasOriginTag = notification.includes('"Esta reserva llegó a través de pyApy."');

  console.log('2. Verificación de campos obligatorios:');
  console.log(`- Encabezado oficial pyApy   : ${hasGreeting ? 'PASS' : 'FAIL'}`);
  console.log(`- Nombre del alojamiento     : ${hasAccommodation ? 'PASS' : 'FAIL'}`);
  console.log(`- Fecha y rango horario      : ${hasDate ? 'PASS' : 'FAIL'}`);
  console.log(`- Cantidad de huéspedes      : ${hasGuests ? 'PASS' : 'FAIL'}`);
  console.log(`- Datos de contacto cliente  : ${hasClient ? 'PASS' : 'FAIL'}`);
  console.log(`- Total autoritativo en Gs.  : ${hasTotal ? 'PASS' : 'FAIL'}`);
  console.log(`- Atribución de plataforma   : ${hasOriginTag ? 'PASS' : 'FAIL'}\n`);

  console.log('3. Mecanismo de despacho y canal:');
  console.log('- Generación: En el backend server.ts al confirmar la reserva atómicamente.');
  console.log('- Canal primario: Disparo vía WhatsApp Web / API (wa.me/{hostPhone}?text={encodedMsg}) desde el modal de confirmación.');
  console.log('- Canal secundario: Registro inmutable en el log de auditoría (dbAuditLogs) y almacenamiento en disco.');
  console.log('- Notificación de plataforma: Bandeja de notificaciones internas en UI de anfitrión y administrador.\n');

  if (hasGreeting && hasAccommodation && hasDate && hasGuests && hasClient && hasTotal && hasOriginTag) {
    console.log('🎉 RESULTADO NOTIFICACIONES: APROBADO CON 100% CUMPLIMIENTO');
  } else {
    console.error('❌ RESULTADO NOTIFICACIONES: FALLÓ');
    process.exit(1);
  }
}

verifyNotifications().catch(err => {
  console.error(err);
  process.exit(1);
});
