// server/firestoreService.ts
// SERVER-SIDE ONLY: Cloud Firestore Authoritative Database Service & Transactional Operations
import crypto from 'crypto';
import { getFirebaseAdmin } from './firebaseAdmin';
import {
  Reservation,
  Property,
  OwnerBooking,
  Block,
  AuditLog,
  SearchIntent,
  Review,
  SearchFilterState,
  MatchingResult,
  Sponsor
} from '../src/types';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export function generateSecureLocator(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `PY-2026-${code}`;
}

/**
 * Normaliza números de teléfono paraguayos a un formato canónico de dígitos.
 * Remueve caracteres no numéricos y elimina prefijos estándar internacionales (+595) o locales (0).
 * Ejemplo: '+595 981 123 456' -> '981123456', '0981 123456' -> '981123456', '981123456' -> '981123456'.
 */
export function normalizePhoneForVerification(raw?: string | null): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('595')) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Normaliza documentos de identidad (CI / RUC / Pasaporte).
 * Remueve puntuaciones, guiones, espacios y convierte a minúsculas.
 * Ejemplo: '4.567.890-B' -> '4567890b'.
 */
export function normalizeDocumentForVerification(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
}

function sanitizeInput(str?: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export interface UserContext {
  uid: string;
  role: 'customer' | 'owner' | 'admin' | 'anonymous';
  name?: string;
  email?: string;
  ownerPropertyId?: string;
  firebaseAuth?: boolean;
}

// Sanitization: Strips all sensitive PII from property objects for public exposure
export function sanitizePublicProperty(prop: any): Partial<Property> {
  const {
    ownerCi,
    ownerAddress,
    hostPhone,
    hostPhoneSecondary,
    hostEmail,
    address,
    lat,
    lng,
    googleMapsUrl,
    internalNotes,
    verificationNotes,
    ...publicData
  } = prop;
  return publicData;
}

// Helper to compute exact ISO millisecond timestamps for date/time ranges (including overnight & midnight crossing)
export function computeInterval(
  startDate: string,
  startTime: string,
  endDate?: string,
  endTime?: string,
  crossesMidnight?: boolean
): { startMs: number; endMs: number; startDate: string; endDate: string } {
  let finalEndDate = endDate || startDate;
  const isOvernight = crossesMidnight || (endTime && startTime && endTime <= startTime);
  if (!endDate && isOvernight) {
    const nextDate = new Date(new Date(`${startDate}T00:00:00Z`).getTime() + 86400000);
    finalEndDate = nextDate.toISOString().split('T')[0];
  }
  const finalEndTime = endTime || '23:59';
  const startMs = new Date(`${startDate}T${startTime}:00Z`).getTime();
  const endMs = new Date(`${finalEndDate}T${finalEndTime}:00Z`).getTime();
  return { startMs, endMs, startDate, endDate: finalEndDate };
}

// Check if two time intervals overlap: [A_start, A_end] and [B_start, B_end]
export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export class FirestoreDatabaseService {
  public static getDb() {
    const admin = getFirebaseAdmin();
    if (!admin.isConfigured || !admin.firestore) {
      throw new ServiceUnavailableError(
        'Cloud Firestore no está configurado en el entorno de servidor (503 SERVICE_UNAVAILABLE).'
      );
    }
    return admin.firestore;
  }

  // Check if Cloud Firestore is active
  static isAvailable(): boolean {
    const admin = getFirebaseAdmin();
    return Boolean(admin.isConfigured && admin.firestore);
  }

  // PROPERTIES CATALOG
  static async getProperties(user?: UserContext): Promise<Partial<Property>[]> {
    const db = this.getDb();
    const snapshot = await db.collection('properties').get();
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

    if (user?.role === 'admin') {
      return properties;
    }

    // Owners see full private data of their own property, but sanitized data for other properties
    if (user?.role === 'owner') {
      return properties.map(p => {
        if (p.ownerId === user.uid || p.id === user.ownerPropertyId) {
          return p;
        }
        return sanitizePublicProperty(p);
      });
    }

    // Public / Customers only receive sanitized data without PII
    return properties.map(sanitizePublicProperty);
  }

  static async getPropertyById(propertyId: string, user?: UserContext): Promise<Partial<Property> | null> {
    const db = this.getDb();
    const doc = await db.collection('properties').doc(propertyId).get();
    if (!doc.exists) return null;
    const property = { id: doc.id, ...doc.data() } as Property;

    if (user?.role === 'admin') {
      return property;
    }
    if (user?.role === 'owner' && (property.ownerId === user.uid || property.id === user.ownerPropertyId)) {
      return property;
    }

    return sanitizePublicProperty(property);
  }

  // CREATE PROPERTY (Host Onboarding / Registration)
  static async createProperty(propertyData: Partial<Property>, user?: UserContext): Promise<Property> {
    const db = this.getDb();
    const id = propertyData.id || `prop-${Date.now()}`;
    const now = new Date().toISOString();

    // Authoritative defaults: verification and VIP MUST NOT be auto-assigned
    const newProperty: Property = {
      ...propertyData,
      id,
      ownerId: user?.uid || propertyData.ownerId || `owner_${Date.now()}`,
      isVerified: false,
      verificationStatus: 'pending',
      verificationDate: undefined,
      verificationNotes: 'Pendiente de auditoría y verificación documental por el equipo de pyApy',
      isVip: false,
      subscriptionPlan: undefined,
      rating: 0,
      reviewsCount: 0,
      createdAt: now
    } as Property;

    await db.collection('properties').doc(id).set(newProperty);
    await db.collection('propertiesPublic').doc(id).set(sanitizePublicProperty(newProperty));

    await db.collection('auditLogs').add({
      action: 'PROPIEDAD_REGISTRADA',
      actorRole: user?.role || 'owner',
      actorName: user?.email || user?.name || newProperty.hostName,
      propertyId: id,
      propertyName: newProperty.name,
      details: `Nueva propiedad "${newProperty.name}" registrada en ${newProperty.city}, ${newProperty.department}. Estado inicial: pendiente de verificación.`,
      timestamp: now
    });

    return newProperty;
  }

  // GET OWNER PROPERTIES (Owner or Admin only)
  static async getOwnerProperties(user: UserContext): Promise<Partial<Property>[]> {
    if (user.role !== 'owner' && user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: se requieren permisos de anfitrión o administrador.');
    }
    const all = await this.getProperties(user);
    if (user.role === 'admin') return all;
    return all.filter(p => p.ownerId === user.uid || (user.ownerPropertyId && p.id === user.ownerPropertyId));
  }

  // UPDATE PROPERTY VERIFICATION (Admin only)
  static async updatePropertyVerification(
    propertyId: string,
    status: string,
    notes: string | undefined,
    adminUser: UserContext
  ): Promise<Property> {
    if (adminUser.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: solo administradores pueden modificar el estado de verificación.');
    }

    const db = this.getDb();
    const propRef = db.collection('properties').doc(propertyId);
    const pubRef = db.collection('propertiesPublic').doc(propertyId);

    const doc = await propRef.get();
    if (!doc.exists) {
      throw new ValidationError('Alojamiento no encontrado.');
    }

    const isVerified = status === 'verified';
    const verificationDate = isVerified ? new Date().toISOString().split('T')[0] : null;

    const updates: any = {
      verificationStatus: status,
      isVerified,
      updatedAt: new Date().toISOString()
    };
    if (verificationDate) updates.verificationDate = verificationDate;
    if (notes) updates.verificationNotes = notes;

    await propRef.update(updates);

    // Sync public projection
    const updatedDoc = await propRef.get();
    const updatedProperty = { id: updatedDoc.id, ...updatedDoc.data() } as Property;
    await pubRef.set(sanitizePublicProperty(updatedProperty), { merge: true });

    // Append to audit trail
    await db.collection('auditLogs').add({
      action: 'VERIFICACION_STATUS_CHANGED',
      propertyId,
      propertyName: updatedProperty.name,
      actorRole: 'admin',
      actorName: adminUser.name || 'Admin pyApy',
      details: `Verificación cambiada a ${status}. Nota: ${notes || 'Revisión oficial pyApy.'}`,
      timestamp: new Date().toISOString()
    });

    return updatedProperty;
  }

  // CHECK AVAILABILITY
  static async checkAvailability(
    propertyId: string,
    startDate: string,
    startTime: string,
    endTime: string,
    endDate?: string
  ): Promise<{ available: boolean; conflicts: { reservation: boolean; ownerBooking: boolean; maintenanceBlock: boolean } }> {
    const db = this.getDb();
    const reqInterval = computeInterval(startDate, startTime, endDate, endTime);

    // Query active reservations
    const resSnap = await db
      .collection('reservations')
      .where('propertyId', '==', propertyId)
      .where('reservationStatus', 'in', ['confirmed', 'active', 'pending'])
      .get();

    const hasReservationConflict = resSnap.docs.some(doc => {
      const data = doc.data() as Reservation;
      const existInterval = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
      return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
    });

    // Query owner direct bookings
    const obSnap = await db
      .collection('ownerBookings')
      .where('propertyId', '==', propertyId)
      .get();

    const hasOwnerBookingConflict = obSnap.docs.some(doc => {
      const data = doc.data() as OwnerBooking;
      const existInterval = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
      return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
    });

    // Query maintenance blocks
    const blSnap = await db
      .collection('blocks')
      .where('propertyId', '==', propertyId)
      .get();

    const hasBlockConflict = blSnap.docs.some(doc => {
      const data = doc.data() as Block;
      const existInterval = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
      return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
    });

    return {
      available: !hasReservationConflict && !hasOwnerBookingConflict && !hasBlockConflict,
      conflicts: {
        reservation: hasReservationConflict,
        ownerBooking: hasOwnerBookingConflict,
        maintenanceBlock: hasBlockConflict
      }
    };
  }

  // ATOMIC RESERVATION CREATION USING FIRESTORE TRANSACTION & ATOMIC IDEMPOTENCY LOCK
  static async createReservationTransactional(params: {
    propertyId: string;
    turnId?: string;
    startDate: string;
    startTime: string;
    endTime: string;
    endDate?: string;
    crossesMidnight?: boolean;
    guestCount: number;
    clientName: string;
    clientDoc: string;
    clientPhone: string;
    clientEmail?: string;
    specialRequests?: string;
    customerId?: string;
    idempotencyKey?: string;
  }): Promise<{ reservation: Reservation; ownerNotificationMessage: string; isIdempotent?: boolean }> {
    const db = this.getDb();

    // Calculate requested time interval (supporting overnight bookings)
    const reqInterval = computeInterval(
      params.startDate,
      params.startTime,
      params.endDate,
      params.endTime,
      params.crossesMidnight
    );

    return await db.runTransaction(async (transaction) => {
      // 1. ATOMIC IDEMPOTENCY CHECK INSIDE TRANSACTION (Zero race condition)
      let idemRef: any = null;
      if (params.idempotencyKey) {
        idemRef = db.collection('idempotencyKeys').doc(params.idempotencyKey);
        const idemDoc: any = await transaction.get(idemRef);
        if (idemDoc.exists) {
          const existingData = idemDoc.data();
          const existing = existingData.reservation as Reservation;
          const ownerNotificationMessage = `🔔 ¡Conseguimos una reserva para vos!
Alojamiento: ${existing.propertyName}
Fecha: ${existing.startDate} (${existing.startTime} a ${existing.endTime} hs)
Huéspedes: ${existing.guestCount} personas
Cliente: ${existing.clientName} (${existing.clientPhone})
Total: Gs. ${existing.totalAmountPyg.toLocaleString('es-PY')}

"Esta reserva llegó a través de pyApy."`;
          return { reservation: existing, ownerNotificationMessage, isIdempotent: true };
        }
      }

      // 2. Read property document inside transaction
      const propRef = db.collection('properties').doc(params.propertyId);
      const propDoc = await transaction.get(propRef);

      if (!propDoc.exists) {
        throw new ValidationError('Alojamiento no encontrado.');
      }

      const propData = propDoc.data() as Property;

      // 3. Validate capacity
      if (params.guestCount <= 0 || (propData.capacity && params.guestCount > propData.capacity)) {
        throw new ValidationError(
          `Cantidad de huéspedes inválida. Capacidad máxima de ${propData.name}: ${propData.capacity} personas.`
        );
      }

      // 4. Recalculate price strictly server-side
      let authoritativePrice = propData.pricePerTurn || propData.pricePerDay || 1000000;
      let turnName = 'Turno Estándar';
      if (params.turnId && propData.allowedTurns && propData.allowedTurns.length > 0) {
        const foundTurn = propData.allowedTurns.find(t => t.id === params.turnId);
        if (foundTurn) {
          authoritativePrice = foundTurn.pricePyg;
          turnName = foundTurn.name;
        }
      }

      // 5. Query candidate conflicting reservations for this property
      const resQuery = db
        .collection('reservations')
        .where('propertyId', '==', params.propertyId)
        .where('reservationStatus', 'in', ['confirmed', 'active', 'pending']);
      const resSnapshot = await transaction.get(resQuery);

      const conflictsRes = resSnapshot.docs.filter(doc => {
        const data = doc.data() as Reservation;
        const existInterval = computeInterval(
          data.startDate,
          data.startTime,
          data.endDate,
          data.endTime,
          data.crossesMidnight
        );
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
      });

      if (conflictsRes.length > 0) {
        throw new ConflictError(
          'El alojamiento ya no está disponible para ese horario (conflicto detectado en Cloud Firestore).'
        );
      }

      // 6. Query candidate owner bookings
      const obQuery = db
        .collection('ownerBookings')
        .where('propertyId', '==', params.propertyId);
      const obSnapshot = await transaction.get(obQuery);

      const conflictsOb = obSnapshot.docs.filter(doc => {
        const data = doc.data() as OwnerBooking;
        const existInterval = computeInterval(
          data.startDate,
          data.startTime,
          data.endDate,
          data.endTime,
          data.crossesMidnight
        );
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
      });

      if (conflictsOb.length > 0) {
        throw new ConflictError('El alojamiento está ocupado por una reserva directa del anfitrión.');
      }

      // 7. Query candidate maintenance blocks
      const blQuery = db
        .collection('blocks')
        .where('propertyId', '==', params.propertyId);
      const blSnapshot = await transaction.get(blQuery);

      const conflictsBl = blSnapshot.docs.filter(doc => {
        const data = doc.data() as Block;
        const existInterval = computeInterval(
          data.startDate,
          data.startTime,
          data.endDate,
          data.endTime,
          data.crossesMidnight
        );
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, existInterval.startMs, existInterval.endMs);
      });

      if (conflictsBl.length > 0) {
        throw new ConflictError('El alojamiento está bloqueado por mantenimiento o limpieza en ese horario.');
      }

      // 8. Generate cryptographically secure locator
      const locator = generateSecureLocator();
      const newResRef = db.collection('reservations').doc();

      const reservation: Reservation & { idempotencyKey?: string } = {
        id: newResRef.id,
        locator,
        propertyId: params.propertyId,
        propertyName: propData.name,
        ownerId: propData.ownerId,
        customerId: params.customerId || `guest_${crypto.randomUUID()}`,
        clientName: sanitizeInput(params.clientName),
        clientDoc: sanitizeInput(params.clientDoc),
        clientPhone: sanitizeInput(params.clientPhone),
        clientEmail: sanitizeInput(params.clientEmail),
        startDate: params.startDate,
        startTime: params.startTime,
        endDate: reqInterval.endDate,
        endTime: params.endTime,
        crossesMidnight: params.crossesMidnight || reqInterval.endDate !== params.startDate,
        turnId: params.turnId,
        turnName,
        bookingType: reqInterval.endDate !== params.startDate ? 'turn_night' : 'turn_day',
        guestCount: params.guestCount,
        totalAmountPyg: authoritativePrice, // STRICTLY SERVER ENFORCED
        currency: 'PYG',
        origin: 'pyapy', // STRICTLY IMMUTABLE SERVER VALUE
        reservationStatus: 'confirmed',
        paymentStatus: 'pending',
        specialRequests: sanitizeInput(params.specialRequests).substring(0, 300),
        idempotencyKey: params.idempotencyKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerNotified: true,
        auditTrail: [
          {
            action: 'RESERVA_CREADA_FIRESTORE_TRANSACTION',
            timestamp: new Date().toISOString(),
            actor: `Cliente: ${params.clientName.trim()}`,
            notes: `Reserva creada atómicamente en Cloud Firestore con localizador ${locator}. Monto: Gs. ${authoritativePrice}. Origen certificado: pyapy.`
          }
        ]
      };

      transaction.set(newResRef, reservation);

      // Store atomic idempotency record
      if (idemRef) {
        transaction.set(idemRef, {
          key: params.idempotencyKey,
          reservationId: newResRef.id,
          reservation,
          createdAt: new Date().toISOString()
        });
      }

      // Audit log in separate collection
      const auditRef = db.collection('auditLogs').doc();
      const auditLog: AuditLog = {
        id: auditRef.id,
        action: 'RESERVA_CONFIRMADA_ATOMIC',
        timestamp: new Date().toISOString(),
        actorName: params.clientName.trim(),
        actorRole: 'customer',
        propertyId: params.propertyId,
        propertyName: propData.name,
        locator,
        details: `Reserva ${locator} creada en Firestore Transaction. Monto: Gs. ${authoritativePrice}. Origen: pyapy.`
      };
      transaction.set(auditRef, auditLog);

      const ownerNotificationMessage = `🔔 ¡Conseguimos una reserva para vos!
Alojamiento: ${propData.name}
Fecha: ${params.startDate} (${params.startTime} a ${params.endTime} hs)
Huéspedes: ${params.guestCount} personas
Cliente: ${params.clientName.trim()} (${params.clientPhone.trim()})
Total: Gs. ${authoritativePrice.toLocaleString('es-PY')}

"Esta reserva llegó a través de pyApy."`;

      return { reservation, ownerNotificationMessage };
    });
  }

  // CANCEL RESERVATION TRANSACTIONAL WITH STRICT IDENTITY VALIDATION
  static async cancelReservation(
    reservationId: string,
    reason: string,
    user: UserContext
  ): Promise<{ success: boolean; reservation: Reservation }> {
    if (!user || user.role === 'anonymous') {
      throw new AuthorizationError('Autenticación requerida para cancelar reservas.');
    }

    const db = this.getDb();
    const resRef = db.collection('reservations').doc(reservationId);

    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(resRef);
      if (!doc.exists) {
        throw new ValidationError('Reserva no encontrada.');
      }

      const resData = doc.data() as Reservation;

      // Ownership authorization check
      const isAdmin = user.role === 'admin';
      const isOwner = user.role === 'owner' && (user.ownerPropertyId === resData.propertyId || user.uid === resData.ownerId);
      const isCustomer = user.role === 'customer' && user.uid === resData.customerId;

      if (!isAdmin && !isOwner && !isCustomer) {
        throw new AuthorizationError('No tenés autorización para cancelar esta reserva.');
      }

      if (resData.reservationStatus === 'cancelled') {
        throw new ValidationError('La reserva ya se encuentra cancelada.');
      }

      const now = new Date().toISOString();
      const updatedAuditTrail = [
        ...(resData.auditTrail || []),
        {
          action: 'RESERVA_CANCELADA_FIRESTORE',
          timestamp: now,
          actor: `${user.role}: ${user.uid}`,
          notes: `Motivo: ${reason}`
        }
      ];

      transaction.update(resRef, {
        reservationStatus: 'cancelled',
        cancellationReason: reason,
        cancelledBy: `${user.role}: ${user.uid}`,
        cancelledAt: now,
        updatedAt: now,
        auditTrail: updatedAuditTrail
      });

      const auditRef = db.collection('auditLogs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        action: 'RESERVA_CANCELADA',
        propertyId: resData.propertyId,
        propertyName: resData.propertyName,
        locator: resData.locator,
        actorRole: user.role,
        actorName: user.name || user.uid,
        details: `Reserva ${resData.locator} cancelada. Motivo: ${reason}`,
        timestamp: now
      });

      const updatedReservation: Reservation = {
        ...resData,
        reservationStatus: 'cancelled',
        cancellationReason: reason,
        cancelledBy: `${user.role}: ${user.uid}`,
        cancelledAt: now,
        updatedAt: now,
        auditTrail: updatedAuditTrail
      };

      return { success: true, reservation: updatedReservation };
    });
  }

  // OWNER BOOKING CREATION WITH OWNERSHIP CHECK & ATOMIC CONCURRENCY
  static async createOwnerBooking(
    params: {
      propertyId: string;
      title: string;
      guestName?: string;
      guestCount?: number;
      startDate: string;
      startTime: string;
      endDate?: string;
      endTime: string;
      notes?: string;
    },
    user: UserContext
  ): Promise<OwnerBooking> {
    const db = this.getDb();

    return await db.runTransaction(async (transaction) => {
      const propRef = db.collection('properties').doc(params.propertyId);
      const propDoc = await transaction.get(propRef);
      if (!propDoc.exists) {
        throw new ValidationError('Alojamiento no encontrado.');
      }
      const prop = propDoc.data() as Property;

      // Strict ownership verification: cannot manage someone else's property
      if (user.role !== 'admin' && prop.ownerId !== user.uid && user.ownerPropertyId !== params.propertyId) {
        throw new AuthorizationError('No tenés autorización para gestionar este alojamiento.');
      }

      const interval = computeInterval(params.startDate, params.startTime, params.endDate, params.endTime);

      // 1. Overlap conflict check with reservations
      const resQuery = db
        .collection('reservations')
        .where('propertyId', '==', params.propertyId)
        .where('reservationStatus', 'in', ['confirmed', 'active', 'pending']);
      const resSnap = await transaction.get(resQuery);

      const hasResConflict = resSnap.docs.some(doc => {
        const data = doc.data() as Reservation;
        const exist = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });

      if (hasResConflict) {
        throw new ConflictError('Existe una reserva confirmada en ese rango horario.');
      }

      // 2. Overlap conflict check with other owner bookings
      const obQuery = db.collection('ownerBookings').where('propertyId', '==', params.propertyId);
      const obSnap = await transaction.get(obQuery);
      const hasObConflict = obSnap.docs.some(doc => {
        const data = doc.data() as OwnerBooking;
        const exist = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });

      if (hasObConflict) {
        throw new ConflictError('Existe otra reserva de anfitrión registrada en ese rango horario.');
      }

      // 3. Overlap conflict check with blocks
      const blQuery = db.collection('blocks').where('propertyId', '==', params.propertyId);
      const blSnap = await transaction.get(blQuery);
      const hasBlConflict = blSnap.docs.some(doc => {
        const data = doc.data() as Block;
        const exist = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });

      if (hasBlConflict) {
        throw new ConflictError('El alojamiento se encuentra bloqueado por mantenimiento o limpieza en ese rango horario.');
      }

      const newBookingRef = db.collection('ownerBookings').doc();
      const bookingTitle = (params.title || (params as any).reason || 'Reserva de anfitrión').trim();
      const newBooking: OwnerBooking = {
        id: newBookingRef.id,
        propertyId: params.propertyId,
        ownerId: user.uid,
        title: bookingTitle,
        guestName: (params.guestName || '').trim(),
        guestCount: params.guestCount || 1,
        startDate: params.startDate,
        startTime: params.startTime,
        endDate: interval.endDate,
        endTime: params.endTime,
        crossesMidnight: interval.endDate !== params.startDate,
        notes: (params.notes || '').trim(),
        createdAt: new Date().toISOString()
      };

      transaction.set(newBookingRef, newBooking);

      const auditRef = db.collection('auditLogs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        action: 'OWNER_BOOKING_CREATED',
        propertyId: params.propertyId,
        propertyName: prop.name,
        actorRole: 'owner',
        actorUid: user.uid,
        actorName: user.name || user.uid,
        details: `Reserva externa de anfitrión registrada: ${params.title}`,
        timestamp: new Date().toISOString()
      });

      return newBooking;
    });
  }

  // MAINTENANCE BLOCK CREATION WITH OWNERSHIP CHECK & ATOMIC CONCURRENCY
  static async createBlock(
    params: {
      propertyId: string;
      type: 'maintenance' | 'personal_use' | 'unavailable' | 'other';
      reason: string;
      startDate: string;
      startTime: string;
      endDate?: string;
      endTime: string;
    },
    user: UserContext
  ): Promise<Block> {
    const db = this.getDb();

    return await db.runTransaction(async (transaction) => {
      const propRef = db.collection('properties').doc(params.propertyId);
      const propDoc = await transaction.get(propRef);
      if (!propDoc.exists) {
        throw new ValidationError('Alojamiento no encontrado.');
      }
      const prop = propDoc.data() as Property;

      if (user.role !== 'admin' && prop.ownerId !== user.uid && user.ownerPropertyId !== params.propertyId) {
        throw new AuthorizationError('No tenés autorización para bloquear fechas en este alojamiento.');
      }

      const interval = computeInterval(params.startDate, params.startTime, params.endDate, params.endTime);

      // 1. Cannot block if there are existing confirmed reservations
      const resQuery = db
        .collection('reservations')
        .where('propertyId', '==', params.propertyId)
        .where('reservationStatus', 'in', ['confirmed', 'active', 'pending']);
      const resSnap = await transaction.get(resQuery);

      const hasResConflict = resSnap.docs.some(doc => {
        const data = doc.data() as Reservation;
        const exist = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });

      if (hasResConflict) {
        throw new ConflictError('No podés bloquear un intervalo que ya cuenta con reservas confirmadas de clientes.');
      }

      // 2. Check overlap with other blocks
      const blQuery = db.collection('blocks').where('propertyId', '==', params.propertyId);
      const blSnap = await transaction.get(blQuery);
      const hasBlConflict = blSnap.docs.some(doc => {
        const data = doc.data() as Block;
        const exist = computeInterval(data.startDate, data.startTime, data.endDate, data.endTime, data.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });

      if (hasBlConflict) {
        throw new ConflictError('El alojamiento ya cuenta con un bloqueo en ese intervalo.');
      }

      const newBlockRef = db.collection('blocks').doc();
      const newBlock: Block = {
        id: newBlockRef.id,
        propertyId: params.propertyId,
        ownerId: user.uid,
        type: params.type || 'maintenance',
        reason: params.reason.trim(),
        startDate: params.startDate,
        startTime: params.startTime,
        endDate: interval.endDate,
        endTime: params.endTime,
        crossesMidnight: interval.endDate !== params.startDate,
        createdAt: new Date().toISOString()
      };

      transaction.set(newBlockRef, newBlock);

      const auditRef = db.collection('auditLogs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        action: 'BLOCK_CREATED',
        propertyId: params.propertyId,
        propertyName: prop.name,
        actorRole: 'owner',
        actorUid: user.uid,
        actorName: user.name || user.uid,
        details: `Bloqueo de disponibilidad: ${params.reason}`,
        timestamp: new Date().toISOString()
      });

      return newBlock;
    });
  }

  // GET OWNER BOOKINGS
  static async getOwnerBookings(propertyIds: string[]): Promise<OwnerBooking[]> {
    const db = this.getDb();
    if (propertyIds.length === 0) return [];
    const snapshot = await db.collection('ownerBookings')
      .where('propertyId', 'in', propertyIds.slice(0, 10))
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OwnerBooking));
  }

  // DELETE OWNER BOOKING
  static async deleteOwnerBooking(id: string, user: UserContext): Promise<boolean> {
    const db = this.getDb();
    const docRef = db.collection('ownerBookings').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new NotFoundError('Reserva externa no encontrada.');
    const data = doc.data() as OwnerBooking;
    if (user.role !== 'admin' && data.ownerId !== user.uid && user.ownerPropertyId !== data.propertyId) {
      throw new AuthorizationError('No tenés autorización para eliminar esta reserva.');
    }
    await docRef.delete();
    return true;
  }

  // GET OWNER BLOCKS
  static async getOwnerBlocks(propertyIds: string[]): Promise<Block[]> {
    const db = this.getDb();
    if (propertyIds.length === 0) return [];
    const snapshot = await db.collection('blocks')
      .where('propertyId', 'in', propertyIds.slice(0, 10))
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Block));
  }

  // DELETE BLOCK
  static async deleteBlock(id: string, user: UserContext): Promise<boolean> {
    const db = this.getDb();
    const docRef = db.collection('blocks').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new NotFoundError('Bloqueo no encontrado.');
    const data = doc.data() as Block;
    if (user.role !== 'admin' && data.ownerId !== user.uid && user.ownerPropertyId !== data.propertyId) {
      throw new AuthorizationError('No tenés autorización para eliminar este bloqueo.');
    }
    await docRef.delete();
    return true;
  }

  // REVIEWS: STRICT ENFORCEMENT OF 6 CONDITIONS (Server-authoritative, Fully Atomic Transaction)
  static async createReview(
    params: {
      reservationId: string;
      rating: number;
      comment?: string;
    },
    user: UserContext
  ): Promise<Review> {
    // 1. User authenticated
    if (!user || user.role === 'anonymous' || !user.uid) {
      throw new AuthorizationError('Se requiere iniciar sesión para calificar un alojamiento.');
    }

    if (!params.reservationId || !params.rating) {
      throw new ValidationError('reservationId y rating son obligatorios.');
    }

    const numRating = Math.max(1, Math.min(5, Math.round(params.rating)));
    const cleanComment = sanitizeInput(params.comment || '').slice(0, 500);
    const db = this.getDb();

    const reservationRef = db.collection('reservations').doc(params.reservationId);
    const reviewRef = db.collection('reviews').doc(params.reservationId);

    return await db.runTransaction(async (transaction) => {
      // 2. Reservation exists
      const resDoc = await transaction.get(reservationRef);
      if (!resDoc.exists) {
        throw new NotFoundError('No se encontró la reserva indicada.');
      }
      const reservation = resDoc.data() as Reservation;

      // 3. reservation.customerId == authenticated UID (or admin)
      if (reservation.customerId !== user.uid && user.role !== 'admin') {
        throw new AuthorizationError('No podés dejar una opinión sobre la reserva de otro usuario.');
      }

      // 4. reservation.reservationStatus == completed or past stay
      const todayStr = new Date().toISOString().split('T')[0];
      const isStayFinished = reservation.reservationStatus === 'completed' ||
        (reservation.reservationStatus === 'confirmed' && reservation.endDate < todayStr);

      if (!isStayFinished) {
        if (reservation.reservationStatus === 'cancelled') {
          throw new AuthorizationError('No se pueden dejar opiniones para reservas canceladas.');
        }
        throw new AuthorizationError('Solo se pueden dejar opiniones para estadías finalizadas (completed).');
      }

      // 5. Check duplicate review atomically (1 reservation = max 1 review)
      const existingReviewDoc = await transaction.get(reviewRef);
      if (existingReviewDoc.exists) {
        throw new ConflictError('Ya existe una reseña registrada para esta reserva.');
      }

      // Read property document inside transaction
      const propRef = db.collection('properties').doc(reservation.propertyId);
      const propDoc = await transaction.get(propRef);

      const review: Review = {
        id: params.reservationId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        authorName: user.name || reservation.clientName,
        rating: numRating,
        comment: cleanComment,
        date: new Date().toISOString().split('T')[0]
      };

      // 6. Create review inside transaction
      transaction.set(reviewRef, review);

      // 7. Update property rating and reviewsCount atomically
      if (propDoc.exists) {
        const prop = propDoc.data() as Property;
        const currentCount = prop.reviewsCount || 0;
        const currentRating = prop.rating || 0;
        const newCount = currentCount + 1;
        const newRating = Math.round(((currentRating * currentCount + numRating) / newCount) * 10) / 10;
        transaction.update(propRef, {
          rating: newRating,
          reviewsCount: newCount
        });
      }

      return review;
    });
  }

  // SEARCH INTENTS (Rate limited, anti-spam, server-authoritative)
  static async createSearchIntent(
    params: {
      date?: string;
      guestCount?: number;
      department?: string;
      city?: string;
      maxBudget?: number;
      requestedFeatures?: string[];
      contactPhone: string;
      contactEmail?: string;
    },
    user?: UserContext
  ): Promise<SearchIntent> {
    if (!params.contactPhone?.trim()) {
      throw new ValidationError('Número de WhatsApp es obligatorio.');
    }

    const cleanPhone = params.contactPhone.replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 8) {
      throw new ValidationError('Número de WhatsApp inválido.');
    }

    const db = this.getDb();
    const ref = db.collection('searchIntents').doc();
    const intent: SearchIntent = {
      id: ref.id,
      date: params.date,
      guestCount: Math.min(100, Math.max(1, params.guestCount || 2)),
      department: params.department?.slice(0, 50),
      city: params.city?.slice(0, 50),
      maxBudget: params.maxBudget && params.maxBudget > 0 ? params.maxBudget : undefined,
      requestedFeatures: Array.isArray(params.requestedFeatures) ? params.requestedFeatures.slice(0, 10) : [],
      contactPhone: cleanPhone,
      contactEmail: params.contactEmail?.slice(0, 100),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await ref.set({
      ...intent,
      userId: user?.uid || 'anon'
    });

    return intent;
  }

  // OWNER RESERVATIONS
  static async getOwnerReservations(propertyIds: string[], isAdmin: boolean): Promise<Reservation[]> {
    const db = this.getDb();
    if (isAdmin) {
      const snap = await db.collection('reservations').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reservation));
    }

    if (propertyIds.length === 0) return [];

    // Firestore allows 'in' queries up to 30 items
    const snap = await db
      .collection('reservations')
      .where('propertyId', 'in', propertyIds.slice(0, 30))
      .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reservation));
  }

  // AUDIT LOGS (Admin only)
  static async getAuditLogs(): Promise<AuditLog[]> {
    const db = this.getDb();
    const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  }

  // SEARCH INTENTS DEMAND (Admin only)
  static async getSearchIntents(): Promise<SearchIntent[]> {
    const db = this.getDb();
    const snap = await db.collection('searchIntents').orderBy('createdAt', 'desc').limit(100).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SearchIntent));
  }

  // SECURE RESERVATION LOOKUP (Firestore Authoritative)
  static async lookupReservation(
    locator: string,
    verificationValue: string,
    user?: UserContext
  ): Promise<Partial<Reservation>> {
    if (!locator?.trim() || !verificationValue?.trim()) {
      throw new ValidationError('Ingresá el código localizador y tu teléfono o documento para verificar tu identidad.');
    }

    const cleanLoc = locator.trim().toUpperCase();
    const cleanVerif = verificationValue.trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

    const db = this.getDb();
    const snapshot = await db
      .collection('reservations')
      .where('locator', '==', cleanLoc)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('No se encontró ninguna reserva con este localizador.');
    }

    const doc = snapshot.docs[0];
    const found = { id: doc.id, ...doc.data() } as Reservation;

    const storedPhoneNorm = normalizePhoneForVerification(found.clientPhone);
    const providedPhoneNorm = normalizePhoneForVerification(verificationValue);

    const storedDocNorm = normalizeDocumentForVerification(found.clientDoc);
    const providedDocNorm = normalizeDocumentForVerification(verificationValue);

    // Exact matching after normalization (Strict requirement: NO includes, startsWith, endsWith, substring)
    const phoneMatches = Boolean(
      storedPhoneNorm &&
      providedPhoneNorm &&
      storedPhoneNorm.length >= 7 &&
      providedPhoneNorm === storedPhoneNorm
    );

    const docMatches = Boolean(
      storedDocNorm &&
      providedDocNorm &&
      storedDocNorm.length >= 4 &&
      providedDocNorm === storedDocNorm
    );

    const isMatchingVerification = phoneMatches || docMatches;

    // Verify authorized user
    const isOwnerOfRes = Boolean(user && user.role === 'customer' && user.uid === found.customerId);
    const isOwnerOfProp = Boolean(user && user.role === 'owner' && (user.ownerPropertyId === found.propertyId || user.uid === found.ownerId));
    const isAdmin = Boolean(user && user.role === 'admin');

    if (!isAdmin && !isOwnerOfRes && !isOwnerOfProp && !isMatchingVerification) {
      throw new AuthorizationError('El teléfono o documento ingresado no coincide con los datos de esta reserva.');
    }

    // Return sanitized projection for customer verification view
    return {
      id: found.id,
      locator: found.locator,
      propertyId: found.propertyId,
      propertyName: found.propertyName,
      startDate: found.startDate,
      startTime: found.startTime,
      endDate: found.endDate,
      endTime: found.endTime,
      turnName: found.turnName,
      guestCount: found.guestCount,
      totalAmountPyg: found.totalAmountPyg,
      reservationStatus: found.reservationStatus,
      clientName: found.clientName,
      clientPhone: (found.clientPhone || '').replace(/(\+\d{3}\s?\d{3})\d{3}(\d{3})/, '$1***$2'),
      clientDoc: found.clientDoc && found.clientDoc.length > 4 ? `${found.clientDoc.slice(0, 2)}***${found.clientDoc.slice(-2)}` : '***',
      createdAt: found.createdAt,
      cancelledAt: found.cancelledAt,
      specialRequests: found.specialRequests
    };
  }

  // AUTHORIZED CSV EXPORT (Firestore Authoritative, Scoped strictly by Owner / Admin Role)
  static async exportOwnerReservationsCsv(user: UserContext, targetPropertyId?: string): Promise<string> {
    const db = this.getDb();
    let propertyIdsToExport: string[] = [];

    if (user.role === 'admin') {
      if (targetPropertyId) {
        propertyIdsToExport = [targetPropertyId];
      } else {
        const allProps = await db.collection('properties').get();
        propertyIdsToExport = allProps.docs.map(d => d.id);
      }
    } else if (user.role === 'owner') {
      const ownedProps = await db.collection('properties').where('ownerId', '==', user.uid).get();
      const ownedIds = ownedProps.docs.map(d => d.id);
      if (user.ownerPropertyId && !ownedIds.includes(user.ownerPropertyId)) {
        ownedIds.push(user.ownerPropertyId);
      }

      if (targetPropertyId) {
        if (!ownedIds.includes(targetPropertyId)) {
          throw new AuthorizationError('No tenés autorización para exportar reservas de este alojamiento.');
        }
        propertyIdsToExport = [targetPropertyId];
      } else {
        propertyIdsToExport = ownedIds;
      }
    } else {
      throw new AuthorizationError('Acceso denegado: solo anfitriones autorizados y administradores pueden exportar reservas.');
    }

    const headers = ['Localizador', 'Alojamiento', 'Cliente', 'Telefono', 'Fecha', 'Horario', 'Huespedes', 'Monto_PYG', 'Estado', 'Origen'];
    if (propertyIdsToExport.length === 0) {
      return headers.join(',') + '\n';
    }

    const reservations: Reservation[] = [];
    const chunkSize = 10;
    for (let i = 0; i < propertyIdsToExport.length; i += chunkSize) {
      const chunk = propertyIdsToExport.slice(i, i + chunkSize);
      const snap = await db.collection('reservations').where('propertyId', 'in', chunk).get();
      for (const doc of snap.docs) {
        reservations.push({ id: doc.id, ...doc.data() } as Reservation);
      }
    }

    const rows = reservations.map(r => [
      r.locator,
      `"${(r.propertyName || '').replace(/"/g, '""')}"`,
      `"${(r.clientName || '').replace(/"/g, '""')}"`,
      r.clientPhone,
      r.startDate,
      `${r.startTime}-${r.endTime}`,
      r.guestCount,
      r.totalAmountPyg,
      r.reservationStatus,
      r.origin || 'pyapy'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // SEARCH PROPERTIES WITH AUTHORITATIVE AVAILABILITY CHECK
  static async searchProperties(
    filters: SearchFilterState,
    _user?: any
  ): Promise<{
    availableMatches: MatchingResult[];
    alternatives: MatchingResult[];
    unavailableMatches: MatchingResult[];
  }> {
    const db = this.getDb();
    const snap = await db.collection('properties').get();
    const evaluated: MatchingResult[] = [];

    for (const doc of snap.docs) {
      const prop = { id: doc.id, ...doc.data() } as Property;

      // Authoritative availability check querying Firestore reservations, bookings, and blocks
      const avail = await this.checkAvailability(
        prop.id,
        filters.startDate,
        filters.startTime,
        filters.endTime,
        filters.endDate
      );

      let score = 0;
      const matchReasons: string[] = [];
      let alternativeReason: string | undefined;
      let unavailabilityReason: string | undefined;

      if (!avail.available) {
        if (avail.conflicts.reservation) {
          unavailabilityReason = 'No disponible: cuenta con una reserva confirmada para este horario';
        } else if (avail.conflicts.ownerBooking) {
          unavailabilityReason = 'No disponible: ocupada por reserva directa del anfitrión';
        } else if (avail.conflicts.maintenanceBlock) {
          unavailabilityReason = 'No disponible: bloqueada por mantenimiento o uso privado';
        } else {
          unavailabilityReason = 'No disponible para las fechas y turnos seleccionados';
        }
      } else {
        score += 35;
        matchReasons.push('Disponible para la fecha y horario');
      }

      // Zone check (20%)
      const deptMatch = !filters.department || prop.department?.toLowerCase() === filters.department.toLowerCase();
      const cityMatch = !filters.city || filters.city === 'Todas las ciudades' || prop.city?.toLowerCase() === filters.city.toLowerCase();

      if (deptMatch && cityMatch) {
        score += 20;
        matchReasons.push(`Ubicada en ${prop.city}`);
      } else if (deptMatch) {
        score += 12;
        alternativeReason = `En el mismo departamento (${prop.department}), ciudad ${prop.city}`;
      }

      // Capacity check (15%)
      const guestCount = filters.guestCount || 1;
      if (prop.capacity >= guestCount) {
        const ratio = guestCount / prop.capacity;
        if (ratio >= 0.5) {
          score += 15;
          matchReasons.push(`Capacidad ideal (${prop.capacity} personas)`);
        } else {
          score += 12;
          alternativeReason = `Capacidad amplia para ${prop.capacity} personas`;
        }
      } else {
        const diff = guestCount - prop.capacity;
        if (diff <= 3) {
          score += 6;
          alternativeReason = `Capacidad para ${prop.capacity} personas (un poco menor)`;
        }
      }

      // Budget check (15%)
      const priceToCheck = filters.bookingType === 'full_day' ? prop.pricePerDay : prop.pricePerTurn;
      if (!filters.maxBudget || filters.maxBudget <= 0) {
        score += 15;
      } else if (priceToCheck <= filters.maxBudget) {
        score += 15;
        matchReasons.push('Dentro de tu presupuesto');
      } else {
        const over = (priceToCheck - filters.maxBudget) / filters.maxBudget;
        if (over <= 0.25) {
          score += 7.5;
          alternativeReason = 'Ligeramente por encima de tu presupuesto';
        }
      }

      // Features / Amenities (15%)
      if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
        const propAmenitiesLower = (prop.amenities || []).map(a => a.toLowerCase());
        let matchesCount = 0;
        for (const req of filters.selectedAmenities) {
          if (propAmenitiesLower.some(a => a.includes(req.toLowerCase()))) {
            matchesCount++;
          }
        }
        const ratio = matchesCount / filters.selectedAmenities.length;
        score += 15 * ratio;
        if (ratio > 0.6) {
          matchReasons.push('Cuenta con los servicios solicitados');
        }
      } else {
        score += 15;
      }

      // Plan / Verified bonus
      if (prop.subscriptionPlan === 'vip' || prop.isVip) score += 4;
      if (prop.isVerified) score += 3;

      evaluated.push({
        property: prop,
        score: Math.round(score),
        isAvailable: avail.available,
        unavailabilityReason,
        matchReasons,
        alternativeReason
      });
    }

    const availableMatches: MatchingResult[] = [];
    const alternatives: MatchingResult[] = [];
    const unavailableMatches: MatchingResult[] = [];

    for (const item of evaluated) {
      if (item.isAvailable) {
        if (item.score >= 70) {
          availableMatches.push(item);
        } else {
          alternatives.push(item);
        }
      } else {
        unavailableMatches.push(item);
      }
    }

    availableMatches.sort((a, b) => b.score - a.score);
    alternatives.sort((a, b) => b.score - a.score);
    unavailableMatches.sort((a, b) => b.score - a.score);

    return { availableMatches, alternatives, unavailableMatches };
  }

  // SPONSORS
  static async getSponsors(user?: any): Promise<Sponsor[]> {
    const db = this.getDb();
    const snap = await db.collection('sponsors').get();
    if (snap.empty) {
      return [];
    }
    const sponsors = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sponsor));
    if (user && user.role === 'admin') return sponsors;
    return sponsors.filter(s => s.isActive);
  }

  static async toggleSponsor(sponsorId: string, user: any): Promise<Sponsor> {
    if (!user || user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: se requieren permisos de administrador para gestionar sponsors.');
    }
    const db = this.getDb();
    const ref = db.collection('sponsors').doc(sponsorId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundError('Sponsor no encontrado.');
    }
    const current = snap.data() as Sponsor;
    const updatedStatus = !current.isActive;
    await ref.update({ isActive: updatedStatus });

    await db.collection('auditLogs').add({
      action: 'SPONSOR_TOGGLED',
      actorRole: 'admin',
      actorName: user.name || user.email,
      details: `Sponsor "${current.title}" cambiado a estado ${updatedStatus ? 'ACTIVO' : 'INACTIVO'}.`,
      timestamp: new Date().toISOString()
    });

    return { ...current, id: snap.id, isActive: updatedStatus };
  }

  // SEED INITIAL PROPERTIES TO FIRESTORE & PROPERTIES_PUBLIC PROJECTION
  static async seedIfEmpty(seedProperties: Property[]) {
    const db = this.getDb();
    const snapshot = await db.collection('properties').limit(1).get();
    if (snapshot.empty) {
      console.log('[Firestore] Seeding initial properties to Cloud Firestore and propertiesPublic...');
      const batch = db.batch();
      for (const p of seedProperties) {
        const ref = db.collection('properties').doc(p.id);
        const pubRef = db.collection('propertiesPublic').doc(p.id);
        batch.set(ref, p);
        batch.set(pubRef, sanitizePublicProperty(p));
      }
      await batch.commit();
      console.log(`[Firestore] Seeded ${seedProperties.length} properties securely.`);
    }
  }
}
