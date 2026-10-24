// server.ts
// pyApy Backend Authoritative Engine
// Clean Architecture: Express API -> StorageAdapter (ProductionStorageAdapter vs DevelopmentStorageAdapter)
// In production: Cloud Firestore is the SOLE authoritative persistence. DevStore is never loaded or referenced.

import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { getFirebaseAdmin, verifyFirebaseIdToken } from './server/firebaseAdmin';
import {
  IStorageAdapter,
  UserContext,
  DevSession
} from './server/storageAdapter';
import { ProductionStorageAdapter } from './server/productionAdapter';
import {
  FirestoreDatabaseService,
  ConflictError,
  ValidationError,
  AuthorizationError,
  ServiceUnavailableError,
  NotFoundError
} from './server/firestoreService';

const app = express();
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '1mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==========================================================
// 1. RATE LIMITING (Strict: NO public bypass headers allowed)
// ==========================================================
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function rateLimit(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Local development configuration bypass (Strictly disabled in production)
    if (!IS_PROD && (process.env.DISABLE_RATE_LIMIT === 'true' || req.headers['x-bypass-rate-limit'] === 'true')) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes. Por favor esperá unos momentos antes de reintentar.'
      });
    }

    record.count++;
    next();
  };
}

// ==========================================================
// 2. STORAGE ADAPTER INITIALIZATION
// Decoupled architecture: Production uses ProductionStorageAdapter exclusively.
// DevelopmentStorageAdapter is loaded dynamically only in development.
// ==========================================================
export function requireFirestoreInProd(res: express.Response): boolean {
  if (IS_PROD && !FirestoreDatabaseService.isAvailable()) {
    res.status(503).json({
      error: 'Servicio no disponible: Cloud Firestore es la única fuente de verdad en producción (503 SERVICE_UNAVAILABLE).',
      code: 'FIRESTORE_UNAVAILABLE'
    });
    return false;
  }
  return true;
}

let storageAdapter: IStorageAdapter;

async function initStorage(): Promise<void> {
  if (IS_PROD) {
    storageAdapter = new ProductionStorageAdapter();
  } else {
    // Dynamic import strictly in development
    const { DevelopmentStorageAdapter } = await import('./server/devAdapter');
    storageAdapter = new DevelopmentStorageAdapter();
  }
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function handleError(res: express.Response, err: any) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  if (err instanceof AuthorizationError) return res.status(403).json({ error: err.message });
  if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
  if (err instanceof ServiceUnavailableError) return res.status(503).json({ error: err.message });
  console.error('[API Error]', err);
  return res.status(500).json({ error: err.message || 'Error interno del servidor.' });
}

// ==========================================================
// 3. AUTHENTICATION MIDDLEWARE
// Primary: Firebase Auth ID Token (verified via Admin SDK)
// Dev fallback: Development session store (strictly disabled in production)
// ==========================================================
async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any).user = { role: 'anonymous', uid: 'anon' } as UserContext;
    return next();
  }
  const token = authHeader.split(' ')[1];

  // 1. Verify Firebase ID Token via Firebase Admin SDK
  const adminInst = getFirebaseAdmin();
  if (adminInst.isConfigured && adminInst.auth) {
    try {
      const decoded = await adminInst.auth.verifyIdToken(token);
      (req as any).user = {
        uid: decoded.uid,
        name: decoded.name || decoded.email || 'Usuario pyApy',
        email: decoded.email || '',
        role: decoded.admin === true ? 'admin' : decoded.role === 'owner' ? 'owner' : 'customer',
        ownerPropertyId: decoded.ownerPropertyId,
        firebaseAuth: true
      } as UserContext;
      return next();
    } catch {
      if (IS_PROD) {
        return res.status(401).json({ error: 'Token de autenticación inválido o expirado.' });
      }
    }
  }

  // 2. Dev Session Check (Permitted strictly when NOT in production)
  if (!IS_PROD && storageAdapter?.getDevSession) {
    const session = storageAdapter.getDevSession(token);
    if (session) {
      (req as any).user = {
        uid: session.uid,
        name: session.name,
        email: session.email,
        role: session.role,
        ownerPropertyId: session.ownerPropertyId,
        firebaseAuth: false
      } as UserContext;
      return next();
    }
  }

  if (IS_PROD) {
    return res.status(401).json({ error: 'Token de autenticación no reconocido o inválido en producción.' });
  }

  (req as any).user = { role: 'anonymous', uid: 'anon' } as UserContext;
  next();
}

function requireRole(...roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as UserContext;
    if (!user || user.role === 'anonymous') {
      return res.status(401).json({
        error: 'No autenticado. Se requiere un token de sesión válido.'
      });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado: permisos insuficientes para esta operación.'
      });
    }
    next();
  };
}

// Attach authentication middleware globally to all API routes
app.use(authenticate);

// ==========================================================
// 4. API ROUTES
// ==========================================================

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: IS_PROD ? 'production' : 'development',
    time: new Date().toISOString()
  });
});

// Sanitized Status Endpoint
app.get('/api/status', (req, res) => {
  const isFirestoreAvailable = FirestoreDatabaseService.isAvailable();
  res.json({
    status: isFirestoreAvailable ? 'healthy' : IS_PROD ? 'unavailable' : 'development',
    environment: IS_PROD ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    firestore: {
      isAvailable: isFirestoreAvailable
    },
    persistence: {
      authoritativeSource: IS_PROD ? 'Cloud Firestore' : isFirestoreAvailable ? 'Cloud Firestore' : 'Development In-Memory Store'
    }
  });
});

// Verify Firebase ID Token endpoint
app.post('/api/auth/verify-firebase-token', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'idToken es requerido.' });
  }
  const result = await verifyFirebaseIdToken(idToken);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }
  res.json({
    valid: true,
    user: {
      uid: result.decodedToken?.uid,
      email: result.decodedToken?.email,
      role: result.decodedToken?.admin === true ? 'admin' : result.decodedToken?.role || 'customer'
    }
  });
});

// Development / Testing Login Endpoints (Strictly disabled in production)
app.post('/api/auth/login-admin', rateLimit(5, 60000), (req, res) => {
  if (IS_PROD) {
    return res.status(404).json({
      error: 'Ruta no disponible en producción. Autentíquese exclusivamente mediante Firebase Authentication.'
    });
  }

  const devAdminSecret = process.env.DEV_ADMIN_SECRET || 'dev_admin_local_secret_r3_1';

  const { secretKey } = req.body;
  if (!secretKey || secretKey !== devAdminSecret) {
    return res.status(401).json({ error: 'Credenciales administrativas inválidas.' });
  }

  const token = generateSecureToken();
  const session: DevSession = {
    token,
    uid: 'admin_dev_master',
    name: 'Administrador pyApy (Dev)',
    email: 'admin@pyapy.com.py',
    role: 'admin',
    createdAt: Date.now()
  };

  storageAdapter.saveDevSession?.(session);
  res.json({ token, session });
});

app.post('/api/auth/login-host', rateLimit(10, 60000), (req, res) => {
  if (IS_PROD) {
    return res.status(404).json({
      error: 'Ruta no disponible en producción. Autentíquese exclusivamente mediante Firebase Authentication.'
    });
  }

  const devOwnerSecret = process.env.DEV_OWNER_SECRET || 'dev_owner_local_secret_r3_1';

  const { propertyId, hostSecret, email } = req.body;
  if (!hostSecret || hostSecret !== devOwnerSecret) {
    return res.status(401).json({ error: 'Contraseña de anfitrión incorrecta.' });
  }

  const token = generateSecureToken();
  const session: DevSession = {
    token,
    uid: `owner_${propertyId || 'default'}`,
    name: 'Anfitrión pyApy',
    email: email || 'host@pyapy.com.py',
    role: 'owner',
    ownerPropertyId: propertyId,
    createdAt: Date.now()
  };

  storageAdapter.saveDevSession?.(session);
  res.json({ token, session });
});

app.post('/api/auth/login-customer', rateLimit(15, 60000), (req, res) => {
  if (IS_PROD) {
    return res.status(404).json({
      error: 'Ruta no disponible en producción. Autentíquese exclusivamente mediante Firebase Authentication.'
    });
  }

  const { name, phone, email } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Nombre y teléfono son obligatorios.' });
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 8) {
    return res.status(400).json({ error: 'Número de teléfono inválido.' });
  }

  const token = generateSecureToken();
  const session: DevSession = {
    token,
    uid: `dev_cust_${crypto.randomUUID()}`,
    name: name.trim().slice(0, 60),
    phone: phone.trim(),
    email: (email || '').trim().slice(0, 100),
    role: 'customer',
    createdAt: Date.now()
  };

  storageAdapter.saveDevSession?.(session);
  res.json({ token, session });
});

app.get('/api/auth/session', (req, res) => {
  const user = (req as any).user;
  res.json({ session: user });
});

// Explicitly disable any security-test execution endpoints (Strictly HTTP 404 in all environments)
app.all('/api/security-tests*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado o deshabilitado.' });
});

// DEV RESET DEMO (strictly disabled in production)
app.post('/api/dev/reset-demo', (req, res) => {
  if (IS_PROD) {
    return res.status(404).json({ error: 'No disponible en producción' });
  }
  if ('resetDemoData' in storageAdapter && typeof (storageAdapter as any).resetDemoData === 'function') {
    (storageAdapter as any).resetDemoData();
  }
  res.json({ success: true, message: 'Datos de demo restablecidos en desarrollo' });
});

// PROPERTIES CATALOG
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await storageAdapter.getProperties((req as any).user);
    res.json({ properties });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const property = await storageAdapter.createProperty(req.body, (req as any).user);
    res.status(201).json({ success: true, property });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await storageAdapter.getPropertyById(req.params.id, (req as any).user);
    if (!property) return res.status(404).json({ error: 'Propiedad no encontrada.' });
    res.json({ property });
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN PROPERTY VERIFICATION
app.post('/api/admin/properties/:id/verification', requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updated = await storageAdapter.updatePropertyVerification(
      req.params.id,
      status,
      notes,
      (req as any).user
    );
    res.json({ success: true, property: updated });
  } catch (err) {
    handleError(res, err);
  }
});

// AVAILABILITY CHECK
app.get('/api/properties/:id/availability', async (req, res) => {
  try {
    const { startDate, startTime, endTime, endDate } = req.query;
    if (!startDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'startDate, startTime y endTime son obligatorios.' });
    }
    const result = await storageAdapter.checkAvailability(
      req.params.id,
      String(startDate),
      String(startTime),
      String(endTime),
      endDate ? String(endDate) : undefined
    );
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// SEARCH PROPERTIES (AUTHORITATIVE AVAILABILITY & MATCHING ENGINE)
app.post('/api/search', async (req, res) => {
  try {
    const filters = req.body;
    if (!filters || !filters.startDate) {
      return res.status(400).json({ error: 'Filtros de búsqueda inválidos. startDate es obligatorio.' });
    }
    const results = await storageAdapter.searchProperties(filters, (req as any).user);
    res.json(results);
  } catch (err) {
    handleError(res, err);
  }
});

// SPONSORS
app.get('/api/sponsors', async (req, res) => {
  try {
    const sponsors = await storageAdapter.getSponsors((req as any).user);
    res.json({ sponsors });
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN SPONSORS TOGGLE
app.post('/api/admin/sponsors/:id/toggle', requireRole('admin'), async (req, res) => {
  try {
    const sponsor = await storageAdapter.toggleSponsor(req.params.id, (req as any).user);
    res.json({ success: true, sponsor });
  } catch (err) {
    handleError(res, err);
  }
});

// RESERVATIONS (TRANSACTIONAL, ATOMIC, IDEMPOTENT)
app.post('/api/reservations', rateLimit(60, 60000), async (req, res) => {
  try {
    const {
      propertyId,
      turnId,
      startDate,
      startTime,
      endTime,
      endDate,
      crossesMidnight,
      guestCount,
      clientName,
      clientDoc,
      clientPhone,
      clientEmail,
      specialRequests,
      idempotencyKey
    } = req.body;

    if (!propertyId || !startDate || !startTime || !endTime || !clientName || !clientDoc || !clientPhone) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para completar la reserva.' });
    }

    const result = await storageAdapter.createReservation(
      {
        propertyId,
        turnId,
        startDate,
        startTime,
        endTime,
        endDate,
        crossesMidnight,
        guestCount: Number(guestCount) || 1,
        clientName,
        clientDoc,
        clientPhone,
        clientEmail,
        specialRequests,
        idempotencyKey,
        customerId: (req as any).user?.uid
      },
      (req as any).user
    );

    res.status(result.isIdempotent ? 200 : 201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// SECURE RESERVATION LOOKUP
app.post('/api/reservations/lookup', rateLimit(10, 60000), async (req, res) => {
  try {
    const { locator, verificationValue } = req.body;
    const reservation = await storageAdapter.lookupReservation(
      locator,
      verificationValue,
      (req as any).user
    );
    res.json({ reservation });
  } catch (err) {
    handleError(res, err);
  }
});

// CANCEL RESERVATION
app.post('/api/reservations/:id/cancel', rateLimit(10, 60000), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Debés ingresar un motivo para cancelar la reserva.' });
    }
    const result = await storageAdapter.cancelReservation(
      req.params.id,
      reason.trim(),
      (req as any).user
    );
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// OWNER PORTAL ROUTES
app.get('/api/owner/properties', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const properties = await storageAdapter.getOwnerProperties((req as any).user);
    res.json({ properties });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/owner/reservations', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const targetPropertyId = req.query.propertyId as string | undefined;
    const reservations = await storageAdapter.getOwnerReservations((req as any).user, targetPropertyId);
    res.json({ reservations });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/owner/bookings', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const targetPropertyId = req.query.propertyId as string | undefined;
    const bookings = await storageAdapter.getOwnerBookings((req as any).user, targetPropertyId);
    res.json({ bookings });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/api/owner/bookings', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const booking = await storageAdapter.createOwnerBooking(req.body, (req as any).user);
    res.status(201).json({ success: true, booking });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete('/api/owner/bookings/:id', requireRole('owner', 'admin'), async (req, res) => {
  try {
    await storageAdapter.deleteOwnerBooking(req.params.id, (req as any).user);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/owner/blocks', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const targetPropertyId = req.query.propertyId as string | undefined;
    const blocks = await storageAdapter.getOwnerBlocks((req as any).user, targetPropertyId);
    res.json({ blocks });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/api/owner/blocks', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const block = await storageAdapter.createBlock(req.body, (req as any).user);
    res.status(201).json({ success: true, block });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete('/api/owner/blocks/:id', requireRole('owner', 'admin'), async (req, res) => {
  try {
    await storageAdapter.deleteBlock(req.params.id, (req as any).user);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/owner/export-csv', requireRole('owner', 'admin'), async (req, res) => {
  try {
    const targetPropertyId = req.query.propertyId as string | undefined;
    const csv = await storageAdapter.exportOwnerReservationsCsv((req as any).user, targetPropertyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reservas-pyapy-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN AUDIT LOGS
app.get('/api/admin/audit-logs', requireRole('admin'), async (req, res) => {
  try {
    const logs = await storageAdapter.getAuditLogs((req as any).user);
    res.json({ auditLogs: logs });
  } catch (err) {
    handleError(res, err);
  }
});

// SEARCH INTENTS DEMAND RADAR
app.get('/api/admin/search-intents', requireRole('admin'), async (req, res) => {
  try {
    const intents = await storageAdapter.getSearchIntents((req as any).user);
    res.json({ searchIntents: intents });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/api/search-intents', rateLimit(10, 60000), async (req, res) => {
  try {
    const intent = await storageAdapter.createSearchIntent(req.body, (req as any).user);
    res.status(201).json({ success: true, searchIntent: intent });
  } catch (err) {
    handleError(res, err);
  }
});

// REVIEWS
app.post('/api/reviews', rateLimit(30, 60000), async (req, res) => {
  try {
    const review = await storageAdapter.createReview(req.body, (req as any).user);
    res.status(201).json({ success: true, review });
  } catch (err) {
    handleError(res, err);
  }
});

// Vite Middleware for Development or Static Serving for Production
async function startServer() {
  await initStorage();

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[pyApy Engine] Server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'})`);
  });
}

startServer();
