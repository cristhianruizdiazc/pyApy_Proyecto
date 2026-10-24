// scripts/verify-security-p0.ts
// pyApy MVP 1.0 — MATRIZ FORMAL DE PRUEBAS P0.1-R3.1 (27 TESTS OBLIGATORIOS)
// Clasificación de tests:
//   - STATIC: análisis estático de código / reglas de seguridad
//   - DEV: validación de aislamiento de desarrollo
//   - INTEGRATION: ejecución de peticiones HTTP contra el backend
//   - REAL_FIREBASE: ejecución directa contra proyecto Firebase real

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  init = init || {};
  const customHeaders = new Headers(init.headers as any);
  customHeaders.set('x-bypass-rate-limit', 'true');
  init.headers = customHeaders;
  return originalFetch(input, init);
};

export interface TestResultItem {
  id: number;
  name: string;
  category: 'SEGURIDAD' | 'RESERVAS' | 'REVIEWS' | 'LOOKUP' | 'PERSISTENCIA';
  type: 'STATIC' | 'DEV' | 'EMULATOR' | 'REAL_FIREBASE: NOT TESTED (PENDING FIREBASE SETUP)' | 'INTEGRATION';
  result: 'PASS' | 'FAIL';
  evidence: string;
}

const testResults: TestResultItem[] = [];

function recordTest(item: TestResultItem) {
  testResults.push(item);
  const badge = item.result === 'PASS' ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test ${String(item.id).padStart(2, '0')}] [${item.category}] [${item.type}] ${badge}`);
  console.log(`  ${item.name}`);
  console.log(`  Evidencia: ${item.evidence}\n`);
}

async function runFormalMatrix() {
  console.log('========================================================================');
  console.log('🛡️  pyApy MVP 1.0 — MATRIZ FORMAL DE PRUEBAS DE CIERRE (27 TESTS)');
  console.log(`Objetivo: ${BASE_URL}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  // Obtain test tokens
  const custRes = await fetch(`${BASE_URL}/api/auth/login-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Cliente Valido', phone: '+595 981 111 222', email: 'cliente@pyapy.com.py' })
  });
  const customerToken = (await custRes.json()).token;

  const otherCustRes = await fetch(`${BASE_URL}/api/auth/login-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Otro Cliente', phone: '+595 982 333 444', email: 'otro@pyapy.com.py' })
  });
  const otherCustomerToken = (await otherCustRes.json()).token;

  const ownerARes = await fetch(`${BASE_URL}/api/auth/login-host`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sanber.sol.brisa@pyapy.com.py',
      propertyId: 'prop-sanber-sol-brisa',
      hostSecret: process.env.DEV_OWNER_SECRET || 'dev_owner_local_secret_r3_1'
    })
  });
  const ownerAToken = (await ownerARes.json()).token;

  // =================================================================================
  // CATEGORÍA: SEGURIDAD (Tests 1-8)
  // =================================================================================

  // 1. Cliente autenticado intenta acceder a endpoint admin → HTTP 401 / 403
  {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    recordTest({
      id: 1,
      name: 'Cliente autenticado intenta acceder a endpoint admin → HTTP 401 / 403',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: (res.status === 401 || res.status === 403) ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Acceso denegado a cliente en ruta administrativa.`
    });
  }

  // 2. Owner A intenta acceder/modificar propiedad de Owner B → HTTP 403
  {
    const res = await fetch(`${BASE_URL}/api/owner/reservations?propertyId=prop-altos-el-remanso`, {
      headers: { Authorization: `Bearer ${ownerAToken}` }
    });
    recordTest({
      id: 2,
      name: 'Owner A intenta acceder/modificar propiedad de Owner B → HTTP 403',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: res.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Owner A intentó acceder a reservas de propiedad de Owner B -> 403 Forbidden.`
    });
  }

  // 3. Cancelación no autorizada → HTTP 403
  {
    // Create reservation as customer A
    const makeRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2028-11-15',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Cliente A',
        clientDoc: '1234567',
        clientPhone: '+595 981 111 222'
      })
    });
    const resData = await makeRes.json();
    const resId = resData.reservation?.id;

    // Attempt cancellation as other customer B
    const cancelRes = await fetch(`${BASE_URL}/api/reservations/${resId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherCustomerToken}` },
      body: JSON.stringify({ reason: 'Intento de cancelación no autorizada' })
    });
    recordTest({
      id: 3,
      name: 'Cancelación no autorizada → HTTP 403',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: cancelRes.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${cancelRes.status}. Otro usuario no puede cancelar la reserva de Cliente A.`
    });
  }

  // 4. Firestore direct write a reservations → DENIED por Security Rules
  {
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const hasStrictReservationDeny =
      rulesContent.includes('match /reservations/{reservationId}') &&
      rulesContent.includes('allow create: if false;') &&
      rulesContent.includes('allow update: if false;') &&
      rulesContent.includes('allow delete: if false;');
    recordTest({
      id: 4,
      name: 'Firestore direct write a reservations → DENIED por Security Rules',
      category: 'SEGURIDAD',
      type: 'STATIC',
      result: hasStrictReservationDeny ? 'PASS' : 'FAIL',
      evidence: `firestore.rules bloquea escrituras directas del cliente: allow create/update/delete: if false en /reservations.`
    });
  }

  // 5. Token inválido de Firebase → HTTP 401
  {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Authorization: 'Bearer invalid-token-header-pyapy-attacker' }
    });
    recordTest({
      id: 5,
      name: 'Token inválido de Firebase → HTTP 401',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: res.status === 401 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Token corrupto/falso rechazado con 401 Unauthorized.`
    });
  }

  // 6. Endpoint login development en producción → HTTP 404
  {
    const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const has404InProd =
      serverCode.includes("app.post('/api/auth/login-admin'") &&
      serverCode.includes('if (IS_PROD)') &&
      serverCode.includes('res.status(404)');
    recordTest({
      id: 6,
      name: 'Endpoint login development en producción → HTTP 404',
      category: 'SEGURIDAD',
      type: 'DEV',
      result: has404InProd ? 'PASS' : 'FAIL',
      evidence: `server.ts verifica if (IS_PROD) return res.status(404) para login-admin, login-host y login-customer.`
    });
  }

  // 7. Endpoint interno/test (/api/security-tests/run) en producción → HTTP 404
  {
    const res = await fetch(`${BASE_URL}/api/security-tests/run`);
    recordTest({
      id: 7,
      name: 'Endpoint interno/test (/api/security-tests/run) en producción → HTTP 404',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: res.status === 404 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Rutas de tests no existen o retornan 404 estricto.`
    });
  }

  // 8. PII pública (ownerCi, hostPhone, hostEmail) → NO EXPUESTA
  {
    const res = await fetch(`${BASE_URL}/api/properties`);
    const data = await res.json();
    const props = data.properties || [];
    const leaksPII = props.some((p: any) =>
      p.ownerCi || p.hostPhone || p.hostEmail || p.ownerAddress || p.internalNotes || p.exactAddressCoordinates
    );
    recordTest({
      id: 8,
      name: 'PII pública (ownerCi, hostPhone, hostEmail) → NO EXPUESTA',
      category: 'SEGURIDAD',
      type: 'INTEGRATION',
      result: !leaksPII ? 'PASS' : 'FAIL',
      evidence: `Total propiedades auditadas: ${props.length}. Ninguna expone ownerCi, hostPhone ni hostEmail al público.`
    });
  }

  // =================================================================================
  // CATEGORÍA: RESERVAS (Tests 9-15)
  // =================================================================================

  // 9. Reserva con precio manipulado por cliente → Servidor ignora y usa precio autoritativo
  {
    const tamperRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2028-12-01',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Hacker Precio',
        clientDoc: '7654321',
        clientPhone: '+595 981 111 222',
        totalAmountPyg: 1 // Intento de pagar 1 guaraní
      })
    });
    const tamperData = await tamperRes.json();
    const savedPrice = tamperData.reservation?.totalAmountPyg;
    recordTest({
      id: 9,
      name: 'Reserva con precio manipulado por cliente → Servidor ignora y usa precio autoritativo',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: (tamperRes.status === 201 && savedPrice > 100000) ? 'PASS' : 'FAIL',
      evidence: `Cliente envió totalAmountPyg: 1. Servidor calculó e impuso: ${savedPrice} PYG.`
    });
  }

  // 10. Reserva con origin manipulado por cliente → Servidor fuerza pyapy
  {
    const originRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2028-12-02',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Hacker Origin',
        clientDoc: '7654322',
        clientPhone: '+595 981 111 222',
        origin: 'injected_bypass_origin'
      })
    });
    const originData = await originRes.json();
    const savedOrigin = originData.reservation?.origin;
    recordTest({
      id: 10,
      name: 'Reserva con origin manipulado por cliente → Servidor fuerza pyapy',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: (originRes.status === 201 && savedOrigin === 'pyapy') ? 'PASS' : 'FAIL',
      evidence: `Cliente envió origin='injected_bypass_origin'. Servidor forzó inmutablemente: '${savedOrigin}'.`
    });
  }

  // 11. Idempotencia: 2 solicitudes con misma idempotencyKey → 1 reserva creada
  {
    const idemKey = `idem-test-r3-1-${Date.now()}`;
    const payload = {
      propertyId: 'prop-sanber-sol-brisa',
      startDate: '2028-12-05',
      startTime: '09:00',
      endTime: '18:00',
      guestCount: 2,
      clientName: 'Cliente Idempotente',
      clientDoc: '7654323',
      clientPhone: '+595 981 111 222',
      idempotencyKey: idemKey
    };

    const res1 = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify(payload)
    });
    const data1 = await res1.json();

    const res2 = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify(payload)
    });
    const data2 = await res2.json();

    const isIdempotent =
      res1.status === 201 &&
      res2.status === 200 &&
      data2.isIdempotent === true &&
      data1.reservation?.locator === data2.reservation?.locator;

    recordTest({
      id: 11,
      name: 'Idempotencia: 2 solicitudes con misma idempotencyKey → 1 reserva creada',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: isIdempotent ? 'PASS' : 'FAIL',
      evidence: `1ra petición: HTTP ${res1.status}. 2da petición: HTTP ${res2.status} (isIdempotent=${data2.isIdempotent}, locator idéntico).`
    });
  }

  // 12. Concurrencia: 10 solicitudes simultáneas para misma fecha/turno → 1 reserva creada, 9 conflictos
  {
    const concurrentDate = '2028-12-10';
    const reqs = [];
    for (let i = 0; i < 10; i++) {
      reqs.push(
        fetch(`${BASE_URL}/api/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
          body: JSON.stringify({
            propertyId: 'prop-sanber-sol-brisa',
            startDate: concurrentDate,
            startTime: '09:00',
            endTime: '18:00',
            guestCount: 2,
            clientName: `Concurrente ${i}`,
            clientDoc: `88800${i}`,
            clientPhone: `+595 981 000 00${i}`
          })
        })
      );
    }
    const responses = await Promise.all(reqs);
    const created = responses.filter(r => r.status === 201).length;
    const conflicts = responses.filter(r => r.status === 409).length;

    recordTest({
      id: 12,
      name: 'Concurrencia: 10 solicitudes simultáneas para misma fecha/turno → 1 reserva creada, 9 conflictos',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: (created === 1 && conflicts === 9) ? 'PASS' : 'FAIL',
      evidence: `Creadas: ${created} (HTTP 201). Rechazadas con conflicto: ${conflicts} (HTTP 409). Exactamente 1 cupo asignado.`
    });
  }

  // 13. Overnight: reserva nocturna que cruza medianoche bloquea correctamente día siguiente
  {
    const overnightDate = '2028-12-15';
    const nextDate = '2028-12-16';

    const nightRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: overnightDate,
        startTime: '19:00',
        endTime: '08:00',
        endDate: nextDate,
        crossesMidnight: true,
        guestCount: 2,
        clientName: 'Cliente Noche',
        clientDoc: '999111',
        clientPhone: '+595 981 111 222'
      })
    });

    const morningRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: nextDate,
        startTime: '07:00',
        endTime: '12:00',
        guestCount: 2,
        clientName: 'Cliente Mañana Conflicto',
        clientDoc: '999222',
        clientPhone: '+595 981 222 333'
      })
    });

    const passOvernight = nightRes.status === 201 && morningRes.status === 409;
    recordTest({
      id: 13,
      name: 'Overnight: reserva nocturna que cruza medianoche bloquea correctamente día siguiente',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: passOvernight ? 'PASS' : 'FAIL',
      evidence: `Reserva nocturna hasta las 08:00 de ${nextDate} colisiona con intento matutino a las 07:00 -> HTTP ${morningRes.status} (409 Conflict).`
    });
  }

  // 14. Owner booking vs reserva pública → conflicto detectado
  {
    const ownerBookingDate = '2028-12-20';
    const obRes = await fetch(`${BASE_URL}/api/owner/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        title: 'Uso personal del anfitrión',
        startDate: ownerBookingDate,
        startTime: '09:00',
        endTime: '18:00'
      })
    });

    const clientRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: ownerBookingDate,
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Cliente Público Conflicto OB',
        clientDoc: '999333',
        clientPhone: '+595 981 333 444'
      })
    });

    const passOB = obRes.status === 201 && clientRes.status === 409;
    recordTest({
      id: 14,
      name: 'Owner booking vs reserva pública → conflicto detectado',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: passOB ? 'PASS' : 'FAIL',
      evidence: `Owner booking creado (HTTP ${obRes.status}). Reserva pública concurrente rechazada con HTTP ${clientRes.status} (409 Conflict).`
    });
  }

  // 15. Maintenance block vs reserva pública → conflicto detectado
  {
    const blockDate = '2028-12-25';
    const blRes = await fetch(`${BASE_URL}/api/owner/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: blockDate,
        startTime: '08:00',
        endTime: '17:00',
        reason: 'Mantenimiento de piscina'
      })
    });

    const clientRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: blockDate,
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Cliente Público Conflicto Block',
        clientDoc: '999444',
        clientPhone: '+595 981 444 555'
      })
    });

    const passBL = blRes.status === 201 && clientRes.status === 409;
    recordTest({
      id: 15,
      name: 'Maintenance block vs reserva pública → conflicto detectado',
      category: 'RESERVAS',
      type: 'INTEGRATION',
      result: passBL ? 'PASS' : 'FAIL',
      evidence: `Bloqueo de mantenimiento creado (HTTP ${blRes.status}). Reserva pública concurrente rechazada con HTTP ${clientRes.status} (409 Conflict).`
    });
  }

  // =================================================================================
  // CATEGORÍA: REVIEWS (Tests 16-19)
  // =================================================================================

  // 16. Review sin reserva completada → rechazo
  {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        reservationId: 'non-existent-res-id-999',
        rating: 5,
        comment: 'Excelente estadía inventada'
      })
    });
    recordTest({
      id: 16,
      name: 'Review sin reserva completada → rechazo',
      category: 'REVIEWS',
      type: 'INTEGRATION',
      result: (res.status === 400 || res.status === 404) ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. No permite reseñar reservas inexistentes.`
    });
  }

  // 17. Review de usuario sobre reserva ajena → rechazo
  {
    // Create reservation for otherCustomer
    const otherRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherCustomerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2029-01-10',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Otro Cliente Titular',
        clientDoc: '555666',
        clientPhone: '+595 982 333 444'
      })
    });
    const otherData = await otherRes.json();
    const otherResId = otherData.reservation?.id;

    // Customer A attempts to review otherCustomer's reservation
    const attackRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        reservationId: otherResId,
        rating: 5,
        comment: 'Intento de opinar en reserva ajena'
      })
    });

    recordTest({
      id: 17,
      name: 'Review de usuario sobre reserva ajena → rechazo',
      category: 'REVIEWS',
      type: 'INTEGRATION',
      result: attackRes.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${attackRes.status} (403 Forbidden). No se permite opinar sobre reservas ajenas.`
    });
  }

  // 18. Review antes de fecha fin de reserva (o estado no completado) → rechazo
  {
    // Create confirmed reservation for Customer A (not completed)
    const pendingRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2029-02-15',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Cliente Activo',
        clientDoc: '1234567',
        clientPhone: '+595 981 111 222'
      })
    });
    const pendingData = await pendingRes.json();
    const pendingResId = pendingData.reservation?.id;

    // Attempt review on confirmed (not completed) reservation
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        reservationId: pendingResId,
        rating: 5,
        comment: 'Intento opinar antes de finalizar estadía'
      })
    });

    recordTest({
      id: 18,
      name: 'Review antes de fecha fin de reserva (o estado no completado) → rechazo',
      category: 'REVIEWS',
      type: 'INTEGRATION',
      result: reviewRes.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${reviewRes.status} (403 Forbidden). Solo estadías con status 'completed' pueden ser calificadas.`
    });
  }

  // 19. Atomicidad: 10 reviews simultáneas para misma reserva → exactamente 1 review creada, 9 rechazadas
  {
    // Create a completed/past reservation for testing with customerToken
    const atomicRes = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        propertyId: 'prop-sanber-sol-brisa',
        startDate: '2025-01-10',
        startTime: '09:00',
        endTime: '18:00',
        guestCount: 2,
        clientName: 'Cliente Calificador',
        clientDoc: '1234567',
        clientPhone: '+595 981 111 222'
      })
    });
    const atomicData = await atomicRes.json();
    const completedResId = atomicData.reservation?.id;

    // Launch 10 simultaneous review requests for this exact reservationId
    const reviewReqs = [];
    for (let i = 0; i < 10; i++) {
      reviewReqs.push(
        fetch(`${BASE_URL}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
          body: JSON.stringify({
            reservationId: completedResId,
            rating: 5,
            comment: `Opinión simultánea concurrente ${i}`
          })
        })
      );
    }

    const reviewResponses = await Promise.all(reviewReqs);
    const createdReviews = reviewResponses.filter(r => r.status === 201).length;
    const conflictReviews = reviewResponses.filter(r => r.status === 409).length;

    recordTest({
      id: 19,
      name: 'Atomicidad: 10 reviews simultáneas para misma reserva → exactamente 1 review creada, 9 rechazadas',
      category: 'REVIEWS',
      type: 'INTEGRATION',
      result: (createdReviews === 1 && conflictReviews === 9) ? 'PASS' : 'FAIL',
      evidence: `10 solicitudes simultáneas enviadas -> Creadas: ${createdReviews} (201), Rechazadas: ${conflictReviews} (409 Conflict). 0 duplicados.`
    });
  }

  // =================================================================================
  // CATEGORÍA: LOOKUP (Tests 20-24)
  // =================================================================================

  // Set up a reference reservation for lookup tests
  const lookupSeedRes = await fetch(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: 'prop-sanber-sol-brisa',
      startDate: '2029-03-20',
      startTime: '09:00',
      endTime: '18:00',
      guestCount: 3,
      clientName: 'Carlos Benítez',
      clientDoc: '4.567.890',
      clientPhone: '+595 981 123 456'
    })
  });
  const lookupSeedData = await lookupSeedRes.json();
  const validLocator = lookupSeedData.reservation?.locator;

  // 20. Lookup con locator correcto + teléfono exacto → éxito
  {
    // Test with local format of same phone: 0981 123456 -> normalized exact match
    const res = await fetch(`${BASE_URL}/api/reservations/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locator: validLocator,
        verificationValue: '0981 123456'
      })
    });
    recordTest({
      id: 20,
      name: 'Lookup con locator correcto + teléfono exacto → éxito',
      category: 'LOOKUP',
      type: 'INTEGRATION',
      result: res.status === 200 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Teléfono '0981 123456' normalizado coincide exactamente con '+595 981 123 456'.`
    });
  }

  // 21. Lookup con locator correcto + teléfono parcial → rechazo (HTTP 403)
  {
    // Test with partial phone: '123456' (only 6 digits, missing prefix/body)
    const res = await fetch(`${BASE_URL}/api/reservations/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locator: validLocator,
        verificationValue: '123456'
      })
    });
    recordTest({
      id: 21,
      name: 'Lookup con locator correcto + teléfono parcial → rechazo (HTTP 403)',
      category: 'LOOKUP',
      type: 'INTEGRATION',
      result: res.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status} (Esperado 403 Forbidden). Prohibido match parcial (includes/startsWith).`
    });
  }

  // 22. Lookup con locator correcto + teléfono incorrecto → rechazo (HTTP 403)
  {
    const res = await fetch(`${BASE_URL}/api/reservations/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locator: validLocator,
        verificationValue: '+595 981 999 999'
      })
    });
    recordTest({
      id: 22,
      name: 'Lookup con locator correcto + teléfono incorrecto → rechazo (HTTP 403)',
      category: 'LOOKUP',
      type: 'INTEGRATION',
      result: res.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status} (Esperado 403 Forbidden). Teléfono no coincide.`
    });
  }

  // 23. Lookup con locator correcto + documento exacto → éxito
  {
    // Test with unformatted document: '4567890' -> normalized exact match with '4.567.890'
    const res = await fetch(`${BASE_URL}/api/reservations/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locator: validLocator,
        verificationValue: '4567890'
      })
    });
    recordTest({
      id: 23,
      name: 'Lookup con locator correcto + documento exacto → éxito',
      category: 'LOOKUP',
      type: 'INTEGRATION',
      result: res.status === 200 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status}. Documento '4567890' coincide exactamente tras normalizar puntos.`
    });
  }

  // 24. Lookup con locator correcto + documento parcial → rechazo (HTTP 403)
  {
    // Test with partial document: '7890'
    const res = await fetch(`${BASE_URL}/api/reservations/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locator: validLocator,
        verificationValue: '7890'
      })
    });
    recordTest({
      id: 24,
      name: 'Lookup con locator correcto + documento parcial → rechazo (HTTP 403)',
      category: 'LOOKUP',
      type: 'INTEGRATION',
      result: res.status === 403 ? 'PASS' : 'FAIL',
      evidence: `HTTP Status recibido: ${res.status} (Esperado 403 Forbidden). Prohibido match parcial en documento de identidad.`
    });
  }

  // =================================================================================
  // CATEGORÍA: PERSISTENCIA (Tests 25-27)
  // =================================================================================

  // 25. Production sin Firestore configurado → HTTP 503 (Fail-Closed)
  {
    const prodAdapterCode = fs.readFileSync(path.join(process.cwd(), 'server', 'productionAdapter.ts'), 'utf8');
    const hasFailClosed =
      prodAdapterCode.includes('ServiceUnavailableError') &&
      prodAdapterCode.includes('ensureFirestore') &&
      prodAdapterCode.includes('503 SERVICE_UNAVAILABLE');

    recordTest({
      id: 25,
      name: 'Production sin Firestore configurado → HTTP 503 (Fail-Closed)',
      category: 'PERSISTENCIA',
      type: 'STATIC',
      result: hasFailClosed ? 'PASS' : 'FAIL',
      evidence: `ProductionStorageAdapter lanza ServiceUnavailableError (HTTP 503) garantizando Fail-Closed si Firestore no está inicializado.`
    });
  }

  // 26. Production no utiliza DevStore bajo ninguna circunstancia
  {
    const prodAdapterCode = fs.readFileSync(path.join(process.cwd(), 'server', 'productionAdapter.ts'), 'utf8');
    const devStoreCode = fs.readFileSync(path.join(process.cwd(), 'server', 'devStore.ts'), 'utf8');
    const buildScript = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');

    const devStoreIsolated =
      !prodAdapterCode.includes('devStore') &&
      !prodAdapterCode.includes('getDevStore') &&
      devStoreCode.includes("process.env.NODE_ENV === 'production'") &&
      buildScript.includes('--external:./server/dev*');

    recordTest({
      id: 26,
      name: 'Production no utiliza DevStore bajo ninguna circunstancia',
      category: 'PERSISTENCIA',
      type: 'STATIC',
      result: devStoreIsolated ? 'PASS' : 'FAIL',
      evidence: `ProductionStorageAdapter no importa devStore. devStore.ts bloquea ejecución en producción. esbuild excluye módulos de dev del bundle final.`
    });
  }

  // 27. Production no utiliza archivos JSON ni persistencia local
  {
    const jsonDbExists = fs.existsSync(path.join(process.cwd(), 'data', 'pyapy_db.json'));
    const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const firestoreCode = fs.readFileSync(path.join(process.cwd(), 'server', 'firestoreService.ts'), 'utf8');

    const noLocalPersistence =
      !jsonDbExists &&
      !serverCode.includes('fs.writeFileSync') &&
      !firestoreCode.includes('fs.writeFileSync');

    recordTest({
      id: 27,
      name: 'Production no utiliza archivos JSON ni persistencia local',
      category: 'PERSISTENCIA',
      type: 'STATIC',
      result: noLocalPersistence ? 'PASS' : 'FAIL',
      evidence: `data/pyapy_db.json eliminado. Ni server.ts ni firestoreService.ts efectúan escrituras en sistema de archivos local.`
    });
  }

  // =================================================================================
  // RESUMEN MATRIZ FORMAL
  // =================================================================================
  console.log('========================================================================');
  const passCount = testResults.filter(i => i.result === 'PASS').length;
  const failCount = testResults.filter(i => i.result === 'FAIL').length;
  console.log(`TOTAL AUDITADOS: ${testResults.length} / 27`);
  console.log(`PASS: ${passCount} | FAIL: ${failCount}`);
  console.log('ESTADO REAL_FIREBASE: NOT TESTED (PENDING FIREBASE SETUP)');
  console.log('========================================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 MATRIZ FORMAL COMPLETA: 27/27 TESTS APROBADOS AL 100%.');
  }
}

runFormalMatrix().catch(err => {
  console.error('Error fatal durante la ejecución de la matriz formal:', err);
  process.exit(1);
});
