// server/devAdapter.ts
// DEVELOPMENT STORAGE ADAPTER
// Strictly intended for local development, rapid prototyping, and adversarial testing.
// NOT TO BE LOADED OR RUN IN PRODUCTION.

import {
  IStorageAdapter,
  UserContext,
  CreateReservationParams,
  CreateOwnerBookingParams,
  CreateBlockParams,
  CreateSearchIntentParams,
  CreateReviewParams,
  DevSession
} from './storageAdapter';
import { getDevStore } from './devStore';
import {
  computeInterval,
  intervalsOverlap,
  generateSecureLocator,
  normalizePhoneForVerification,
  normalizeDocumentForVerification,
  sanitizePublicProperty,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} from './firestoreService';
import {
  Property,
  Reservation,
  OwnerBooking,
  Block,
  SearchIntent,
  Review,
  AuditLog,
  SearchFilterState,
  MatchingResult,
  Sponsor
} from '../src/types';

// In-memory atomic mutex to avoid race conditions in dev tests
let devMutexLock = Promise.resolve();
function withDevLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = devMutexLock.then(fn, fn);
  devMutexLock = next.then(() => {}, () => {});
  return next;
}

export class DevelopmentStorageAdapter implements IStorageAdapter {
  public readonly isProduction = false;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[FATAL_SECURITY_ERROR] DevelopmentStorageAdapter cannot be instantiated in production.'
      );
    }
  }

  async getProperties(user?: UserContext): Promise<Partial<Property>[]> {
    const store = getDevStore();
    if (user && (user.role === 'admin' || user.role === 'owner')) {
      return store.properties;
    }
    return store.properties.map(sanitizePublicProperty);
  }

  async getPropertyById(id: string, user?: UserContext): Promise<Partial<Property> | null> {
    const store = getDevStore();
    const prop = store.properties.find(p => p.id === id);
    if (!prop) return null;
    if (user && (user.role === 'admin' || (user.role === 'owner' && (prop.ownerId === user.uid || user.ownerPropertyId === prop.id)))) {
      return prop;
    }
    return sanitizePublicProperty(prop);
  }

  async createProperty(propertyData: Partial<Property>, user?: UserContext): Promise<Property> {
    const store = getDevStore();
    const id = propertyData.id || `prop-${Date.now()}`;
    const now = new Date().toISOString();

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

    store.properties.unshift(newProperty);

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
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

  async updatePropertyVerification(
    id: string,
    status: string,
    notes: string,
    user: UserContext
  ): Promise<Property> {
    if (user.role !== 'admin') {
      throw new AuthorizationError('Solo administradores pueden verificar alojamientos.');
    }
    const store = getDevStore();
    const prop = store.properties.find(p => p.id === id);
    if (!prop) throw new NotFoundError('Propiedad no encontrada.');

    prop.verificationStatus = status as any;
    prop.isVerified = status === 'verified';
    if (status === 'verified') {
      prop.verificationDate = new Date().toISOString().split('T')[0];
    }
    prop.verificationNotes = notes;

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'ADMIN_VERIFY_PROPERTY',
      actorRole: 'admin',
      actorName: user.name || user.uid,
      propertyId: id,
      propertyName: prop.name,
      details: `Estado: ${status}. Notas: ${notes}`,
      timestamp: new Date().toISOString()
    });

    return prop;
  }

  async checkAvailability(
    propertyId: string,
    startDate: string,
    startTime: string,
    endTime: string,
    endDate?: string
  ): Promise<{
    available: boolean;
    conflicts: {
      reservation: boolean;
      ownerBooking: boolean;
      maintenanceBlock: boolean;
    };
  }> {
    const store = getDevStore();
    const reqInterval = computeInterval(startDate, startTime, endDate, endTime);

    const hasResConflict = store.reservations
      .filter(r => r.propertyId === propertyId && ['confirmed', 'active', 'pending'].includes(r.reservationStatus))
      .some(r => {
        const exist = computeInterval(r.startDate, r.startTime, r.endDate, r.endTime, r.crossesMidnight);
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, exist.startMs, exist.endMs);
      });

    const hasObConflict = store.ownerBookings
      .filter(b => b.propertyId === propertyId)
      .some(b => {
        const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, exist.startMs, exist.endMs);
      });

    const hasBlConflict = store.blocks
      .filter(b => b.propertyId === propertyId)
      .some(b => {
        const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
        return intervalsOverlap(reqInterval.startMs, reqInterval.endMs, exist.startMs, exist.endMs);
      });

    return {
      available: !hasResConflict && !hasObConflict && !hasBlConflict,
      conflicts: {
        reservation: hasResConflict,
        ownerBooking: hasObConflict,
        maintenanceBlock: hasBlConflict
      }
    };
  }

  async createReservation(
    params: CreateReservationParams,
    user?: UserContext
  ): Promise<{
    reservation: Reservation;
    ownerNotificationMessage: string;
    isIdempotent?: boolean;
  }> {
    return await withDevLock(async () => {
      const store = getDevStore();

      // 1. Idempotency check
      if (params.idempotencyKey) {
        const existing = store.reservations.find(r => (r as any).idempotencyKey === params.idempotencyKey);
        if (existing) {
          const ownerNotificationMessage = `🔔 ¡Conseguimos una reserva para vos!\nAlojamiento: ${existing.propertyName}\nFecha: ${existing.startDate} (${existing.startTime} a ${existing.endTime} hs)\nHuéspedes: ${existing.guestCount} personas\nCliente: ${existing.clientName} (${existing.clientPhone})\nTotal: Gs. ${existing.totalAmountPyg.toLocaleString('es-PY')}\n\n"Esta reserva llegó a través de pyApy."`;
          return { reservation: existing, ownerNotificationMessage, isIdempotent: true, idempotentReplay: true };
        }
      }

      const prop = store.properties.find(p => p.id === params.propertyId);
      if (!prop) {
        throw new ValidationError('Alojamiento no encontrado.');
      }

      if (params.guestCount <= 0 || (prop.capacity && params.guestCount > prop.capacity)) {
        throw new ValidationError(`Capacidad máxima excedida (${prop.capacity} personas).`);
      }

      const interval = computeInterval(
        params.startDate,
        params.startTime,
        params.endDate,
        params.endTime,
        params.crossesMidnight
      );

      // Check reservation conflict
      const hasResConflict = store.reservations
        .filter(r => r.propertyId === params.propertyId && ['confirmed', 'active', 'pending'].includes(r.reservationStatus))
        .some(r => {
          const exist = computeInterval(r.startDate, r.startTime, r.endDate, r.endTime, r.crossesMidnight);
          return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
        });
      if (hasResConflict) {
        throw new ConflictError('El alojamiento ya no está disponible para ese horario (conflicto detectado).');
      }

      // Check owner booking conflict
      const hasObConflict = store.ownerBookings
        .filter(b => b.propertyId === params.propertyId)
        .some(b => {
          const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
          return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
        });
      if (hasObConflict) {
        throw new ConflictError('El alojamiento está ocupado por una reserva directa del anfitrión.');
      }

      // Check maintenance block conflict
      const hasBlConflict = store.blocks
        .filter(b => b.propertyId === params.propertyId)
        .some(b => {
          const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
          return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
        });
      if (hasBlConflict) {
        throw new ConflictError('El alojamiento está bloqueado por mantenimiento o limpieza en ese horario.');
      }

      // Authoritative pricing
      let price = prop.pricePerTurn || prop.pricePerDay || 1000000;
      let turnName = 'Turno Estándar';
      if (params.turnId && prop.allowedTurns && prop.allowedTurns.length > 0) {
        const foundTurn = prop.allowedTurns.find(t => t.id === params.turnId);
        if (foundTurn) {
          price = foundTurn.pricePyg;
          turnName = foundTurn.name;
        }
      }

      const locator = generateSecureLocator();
      const now = new Date().toISOString();
      const reservation: Reservation & { idempotencyKey?: string } = {
        id: `res_${Date.now()}_${locator.slice(-4)}`,
        locator,
        propertyId: params.propertyId,
        propertyName: prop.name,
        turnId: params.turnId,
        turnName,
        bookingType: (params.crossesMidnight || (params.turnId && params.turnId.includes('noche'))) ? 'turn_night' : 'turn_day',
        startDate: params.startDate,
        startTime: params.startTime,
        endDate: interval.endDate,
        endTime: params.endTime,
        crossesMidnight: interval.endDate !== params.startDate,
        guestCount: params.guestCount,
        totalAmountPyg: price,
        reservationStatus: 'confirmed',
        paymentStatus: 'pending',
        clientName: params.clientName.trim(),
        clientDoc: params.clientDoc.trim(),
        clientPhone: params.clientPhone.trim(),
        clientEmail: params.clientEmail?.trim(),
        customerId: params.customerId || user?.uid || 'anon',
        ownerId: prop.ownerId || 'host_default',
        specialRequests: params.specialRequests?.trim(),
        origin: 'pyapy',
        createdAt: now,
        updatedAt: now,
        idempotencyKey: params.idempotencyKey,
        auditTrail: [
          {
            action: 'RESERVA_CONFIRMADA',
            timestamp: now,
            actor: `customer: ${params.clientName.trim()}`,
            notes: `Reserva creada con localizador ${locator}. Monto: Gs. ${price}`
          }
        ]
      };

      store.reservations.push(reservation);

      store.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        action: 'RESERVA_CONFIRMADA_DEV',
        timestamp: now,
        actorName: params.clientName.trim(),
        actorRole: 'customer',
        propertyId: params.propertyId,
        propertyName: prop.name,
        locator,
        details: `Reserva ${locator} creada en memoria dev. Monto: Gs. ${price}.`
      });

      const ownerNotificationMessage = `🔔 ¡Conseguimos una reserva para vos!\nAlojamiento: ${prop.name}\nFecha: ${params.startDate} (${params.startTime} a ${params.endTime} hs)\nHuéspedes: ${params.guestCount} personas\nCliente: ${params.clientName.trim()} (${params.clientPhone.trim()})\nTotal: Gs. ${price.toLocaleString('es-PY')}\n\n"Esta reserva llegó a través de pyApy."`;

      return { reservation, ownerNotificationMessage };
    });
  }

  async lookupReservation(
    locator: string,
    verificationValue: string,
    user?: UserContext
  ): Promise<Partial<Reservation>> {
    if (!locator?.trim() || !verificationValue?.trim()) {
      throw new ValidationError('Ingresá el código localizador y tu teléfono o documento para verificar tu identidad.');
    }

    const cleanLoc = locator.trim().toUpperCase();
    const cleanVerif = verificationValue.trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

    const store = getDevStore();
    const found = store.reservations.find(r => r.locator === cleanLoc);
    if (!found) {
      throw new NotFoundError('No se encontró ninguna reserva con este localizador.');
    }

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

    const isOwnerOfRes = Boolean(user && user.role === 'customer' && user.uid === found.customerId);
    const isOwnerOfProp = Boolean(user && user.role === 'owner' && (user.ownerPropertyId === found.propertyId || user.uid === found.ownerId));
    const isAdmin = Boolean(user && user.role === 'admin');

    if (!isAdmin && !isOwnerOfRes && !isOwnerOfProp && !isMatchingVerification) {
      throw new AuthorizationError('El teléfono o documento ingresado no coincide con los datos de esta reserva.');
    }

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

  async cancelReservation(
    reservationId: string,
    reason: string,
    user: UserContext
  ): Promise<{ success: boolean; reservation: Reservation }> {
    if (!user || user.role === 'anonymous') {
      throw new AuthorizationError('Autenticación requerida para cancelar reservas.');
    }

    const store = getDevStore();
    const resData = store.reservations.find(r => r.id === reservationId);
    if (!resData) {
      throw new NotFoundError('Reserva no encontrada.');
    }

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
    resData.reservationStatus = 'cancelled';
    resData.cancellationReason = reason;
    resData.cancelledBy = `${user.role}: ${user.uid}`;
    resData.cancelledAt = now;
    resData.updatedAt = now;
    resData.auditTrail = [
      ...(resData.auditTrail || []),
      {
        action: 'RESERVA_CANCELADA_DEV',
        timestamp: now,
        actor: `${user.role}: ${user.uid}`,
        notes: `Motivo: ${reason}`
      }
    ];

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'RESERVA_CANCELADA',
      propertyId: resData.propertyId,
      propertyName: resData.propertyName,
      locator: resData.locator,
      actorRole: user.role,
      actorName: user.name || user.uid,
      details: `Reserva ${resData.locator} cancelada. Motivo: ${reason}`,
      timestamp: now
    });

    return { success: true, reservation: resData };
  }

  async getOwnerProperties(user: UserContext): Promise<Partial<Property>[]> {
    const store = getDevStore();
    if (user.role === 'admin') return store.properties;
    if (user.role === 'owner') {
      return store.properties.filter(
        p => p.ownerId === user.uid || (user.ownerPropertyId && p.id === user.ownerPropertyId)
      );
    }
    return [];
  }

  async getOwnerReservations(user: UserContext, targetPropertyId?: string): Promise<Reservation[]> {
    const store = getDevStore();
    if (user.role === 'admin') {
      if (targetPropertyId) {
        return store.reservations.filter(r => r.propertyId === targetPropertyId);
      }
      return store.reservations;
    }
    if (user.role === 'owner') {
      const owned = store.properties
        .filter(p => p.ownerId === user.uid || (user.ownerPropertyId && p.id === user.ownerPropertyId))
        .map(p => p.id);
      if (targetPropertyId) {
        if (!owned.includes(targetPropertyId)) {
          throw new AuthorizationError('No tenés autorización para ver reservas de este alojamiento.');
        }
        return store.reservations.filter(r => r.propertyId === targetPropertyId);
      }
      return store.reservations.filter(r => owned.includes(r.propertyId));
    }
    return [];
  }

  async createOwnerBooking(params: CreateOwnerBookingParams, user: UserContext): Promise<OwnerBooking> {
    const store = getDevStore();
    const prop = store.properties.find(p => p.id === params.propertyId);
    if (!prop) throw new ValidationError('Alojamiento no encontrado.');

    if (user.role !== 'admin' && prop.ownerId !== user.uid && user.ownerPropertyId !== params.propertyId) {
      throw new AuthorizationError('No tenés autorización para gestionar este alojamiento.');
    }

    const interval = computeInterval(params.startDate, params.startTime, params.endDate, params.endTime);

    // Overlap checks
    const hasResConflict = store.reservations
      .filter(r => r.propertyId === params.propertyId && ['confirmed', 'active', 'pending'].includes(r.reservationStatus))
      .some(r => {
        const exist = computeInterval(r.startDate, r.startTime, r.endDate, r.endTime, r.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });
    if (hasResConflict) throw new ConflictError('Existe una reserva confirmada en ese rango horario.');

    const hasObConflict = store.ownerBookings
      .filter(b => b.propertyId === params.propertyId)
      .some(b => {
        const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });
    if (hasObConflict) throw new ConflictError('Existe otra reserva de anfitrión registrada en ese rango horario.');

    const hasBlConflict = store.blocks
      .filter(b => b.propertyId === params.propertyId)
      .some(b => {
        const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });
    if (hasBlConflict) throw new ConflictError('El alojamiento se encuentra bloqueado por mantenimiento o limpieza en ese rango horario.');

    const now = new Date().toISOString();
    const bookingTitle = (params.title || (params as any).reason || 'Reserva de anfitrión').trim();
    const newBooking: OwnerBooking = {
      id: `ob_${Date.now()}`,
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
      createdAt: now
    };

    store.ownerBookings.push(newBooking);

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'OWNER_BOOKING_CREATED',
      propertyId: params.propertyId,
      propertyName: prop.name,
      actorRole: 'owner',
      actorUid: user.uid,
      actorName: user.name || user.uid,
      details: `Reserva externa de anfitrión registrada: ${params.title}`,
      timestamp: now
    });

    return newBooking;
  }

  async createBlock(params: CreateBlockParams, user: UserContext): Promise<Block> {
    const store = getDevStore();
    const prop = store.properties.find(p => p.id === params.propertyId);
    if (!prop) throw new ValidationError('Alojamiento no encontrado.');

    if (user.role !== 'admin' && prop.ownerId !== user.uid && user.ownerPropertyId !== params.propertyId) {
      throw new AuthorizationError('No tenés autorización para bloquear fechas en este alojamiento.');
    }

    const interval = computeInterval(params.startDate, params.startTime, params.endDate, params.endTime);

    const hasResConflict = store.reservations
      .filter(r => r.propertyId === params.propertyId && ['confirmed', 'active', 'pending'].includes(r.reservationStatus))
      .some(r => {
        const exist = computeInterval(r.startDate, r.startTime, r.endDate, r.endTime, r.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });
    if (hasResConflict) throw new ConflictError('No podés bloquear un intervalo que ya cuenta con reservas confirmadas de clientes.');

    const hasBlConflict = store.blocks
      .filter(b => b.propertyId === params.propertyId)
      .some(b => {
        const exist = computeInterval(b.startDate, b.startTime, b.endDate, b.endTime, b.crossesMidnight);
        return intervalsOverlap(interval.startMs, interval.endMs, exist.startMs, exist.endMs);
      });
    if (hasBlConflict) throw new ConflictError('El alojamiento ya cuenta con un bloqueo en ese intervalo.');

    const now = new Date().toISOString();
    const newBlock: Block = {
      id: `blk_${Date.now()}`,
      propertyId: params.propertyId,
      ownerId: user.uid,
      type: params.type || 'maintenance',
      reason: params.reason.trim(),
      startDate: params.startDate,
      startTime: params.startTime,
      endDate: interval.endDate,
      endTime: params.endTime,
      crossesMidnight: interval.endDate !== params.startDate,
      createdAt: now
    };

    store.blocks.push(newBlock);

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'BLOCK_CREATED',
      propertyId: params.propertyId,
      propertyName: prop.name,
      actorRole: 'owner',
      actorUid: user.uid,
      actorName: user.name || user.uid,
      details: `Bloqueo de disponibilidad: ${params.reason}`,
      timestamp: now
    });

    return newBlock;
  }

  async getOwnerBookings(user: UserContext, targetPropertyId?: string): Promise<OwnerBooking[]> {
    const store = getDevStore();
    const props = await this.getOwnerProperties(user);
    let propertyIds = props.map(p => p.id!).filter(Boolean);
    if (targetPropertyId) {
      if (user.role !== 'admin' && !propertyIds.includes(targetPropertyId)) {
        throw new AuthorizationError('No tenés autorización para ver reservas externas de este alojamiento.');
      }
      propertyIds = [targetPropertyId];
    }
    return store.ownerBookings.filter(b => propertyIds.includes(b.propertyId));
  }

  async deleteOwnerBooking(id: string, user: UserContext): Promise<boolean> {
    const store = getDevStore();
    const idx = store.ownerBookings.findIndex(b => b.id === id);
    if (idx === -1) throw new NotFoundError('Reserva externa no encontrada.');
    const booking = store.ownerBookings[idx];
    if (user.role !== 'admin' && booking.ownerId !== user.uid && user.ownerPropertyId !== booking.propertyId) {
      throw new AuthorizationError('No tenés autorización para eliminar esta reserva.');
    }
    store.ownerBookings.splice(idx, 1);
    return true;
  }

  async getOwnerBlocks(user: UserContext, targetPropertyId?: string): Promise<Block[]> {
    const store = getDevStore();
    const props = await this.getOwnerProperties(user);
    let propertyIds = props.map(p => p.id!).filter(Boolean);
    if (targetPropertyId) {
      if (user.role !== 'admin' && !propertyIds.includes(targetPropertyId)) {
        throw new AuthorizationError('No tenés autorización para ver bloqueos de este alojamiento.');
      }
      propertyIds = [targetPropertyId];
    }
    return store.blocks.filter(b => propertyIds.includes(b.propertyId));
  }

  async deleteBlock(id: string, user: UserContext): Promise<boolean> {
    const store = getDevStore();
    const idx = store.blocks.findIndex(b => b.id === id);
    if (idx === -1) throw new NotFoundError('Bloqueo no encontrado.');
    const block = store.blocks[idx];
    if (user.role !== 'admin' && block.ownerId !== user.uid && user.ownerPropertyId !== block.propertyId) {
      throw new AuthorizationError('No tenés autorización para eliminar este bloqueo.');
    }
    store.blocks.splice(idx, 1);
    return true;
  }

  async exportOwnerReservationsCsv(user: UserContext, targetPropertyId?: string): Promise<string> {
    const store = getDevStore();
    let propertyIdsToExport: string[] = [];

    if (user.role === 'admin') {
      if (targetPropertyId) {
        propertyIdsToExport = [targetPropertyId];
      } else {
        propertyIdsToExport = store.properties.map(p => p.id);
      }
    } else if (user.role === 'owner') {
      const owned = store.properties
        .filter(p => p.ownerId === user.uid || (user.ownerPropertyId && p.id === user.ownerPropertyId))
        .map(p => p.id);

      if (targetPropertyId) {
        if (!owned.includes(targetPropertyId)) {
          throw new AuthorizationError('No tenés autorización para exportar reservas de este alojamiento.');
        }
        propertyIdsToExport = [targetPropertyId];
      } else {
        propertyIdsToExport = owned;
      }
    } else {
      throw new AuthorizationError('Acceso denegado: solo anfitriones autorizados y administradores pueden exportar reservas.');
    }

    const headers = ['Localizador', 'Alojamiento', 'Cliente', 'Telefono', 'Fecha', 'Horario', 'Huespedes', 'Monto_PYG', 'Estado', 'Origen'];
    const reservations = store.reservations.filter(r => propertyIdsToExport.includes(r.propertyId));

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

  async getAuditLogs(user: UserContext): Promise<AuditLog[]> {
    if (user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: solo administradores pueden ver registros de auditoría.');
    }
    return getDevStore().auditLogs.slice(0, 100);
  }

  async getSearchIntents(user: UserContext): Promise<SearchIntent[]> {
    if (user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: solo administradores pueden consultar intenciones de búsqueda.');
    }
    return getDevStore().searchIntents.slice(0, 100);
  }

  async createSearchIntent(params: CreateSearchIntentParams, user?: UserContext): Promise<SearchIntent> {
    if (!params.contactPhone?.trim()) {
      throw new ValidationError('Número de WhatsApp es obligatorio.');
    }
    const cleanPhone = params.contactPhone.replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 8) {
      throw new ValidationError('Número de WhatsApp inválido.');
    }

    const store = getDevStore();
    const intent: SearchIntent = {
      id: `intent_${Date.now()}`,
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

    store.searchIntents.unshift(intent);
    return intent;
  }

  async createReview(params: CreateReviewParams, user: UserContext): Promise<Review> {
    return await withDevLock(async () => {
      // 1. User authenticated
      if (!user || user.role === 'anonymous' || !user.uid) {
        throw new AuthorizationError('Se requiere iniciar sesión para calificar un alojamiento.');
      }

      if (!params.reservationId || !params.rating) {
        throw new ValidationError('reservationId y rating son obligatorios.');
      }

      const store = getDevStore();

      // 2. Reservation exists
      const reservation = store.reservations.find(r => r.id === params.reservationId);
      if (!reservation) {
        throw new NotFoundError('No se encontró la reserva indicada.');
      }

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

      // 5. Check duplicate review (1 reservation = max 1 review)
      const existing = store.reviews.find(
        r => r.id === `rev_${params.reservationId}` || r.reservationId === params.reservationId
      );
      if (existing) {
        throw new ConflictError('Ya existe una reseña registrada para esta reserva.');
      }

      const numRating = Math.max(1, Math.min(5, Math.round(params.rating)));
      const review: Review = {
        id: `rev_${params.reservationId}`,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        authorName: user.name || reservation.clientName,
        rating: numRating,
        comment: (params.comment || '').slice(0, 500),
        date: new Date().toISOString().split('T')[0]
      };

      store.reviews.unshift(review);

      // Recalculate property rating
      const prop = store.properties.find(p => p.id === reservation.propertyId);
      if (prop) {
        const propReviews = store.reviews.filter(r => r.propertyId === reservation.propertyId);
        const avg = propReviews.reduce((acc, r) => acc + r.rating, 0) / propReviews.length;
        prop.rating = Math.round(avg * 10) / 10;
        prop.reviewsCount = propReviews.length;
      }

      return review;
    });
  }

  async searchProperties(
    filters: SearchFilterState,
    _user?: UserContext
  ): Promise<{
    availableMatches: MatchingResult[];
    alternatives: MatchingResult[];
    unavailableMatches: MatchingResult[];
  }> {
    const store = getDevStore();
    const evaluated: MatchingResult[] = [];

    for (const prop of store.properties) {
      // 1. Authoritative availability check using real reservations, bookings, and blocks
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
        score += 35; // 35% date availability
        matchReasons.push('Disponible para la fecha y horario');
      }

      // 2. Zone check (20%)
      const deptMatch = !filters.department || prop.department.toLowerCase() === filters.department.toLowerCase();
      const cityMatch = !filters.city || filters.city === 'Todas las ciudades' || prop.city.toLowerCase() === filters.city.toLowerCase();

      if (deptMatch && cityMatch) {
        score += 20;
        matchReasons.push(`Ubicada en ${prop.city}`);
      } else if (deptMatch) {
        score += 12;
        alternativeReason = `En el mismo departamento (${prop.department}), ciudad ${prop.city}`;
      }

      // 3. Capacity check (15%)
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

      // 4. Budget check (15%)
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

      // 5. Features / Amenities (15%)
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

  async getSponsors(user?: UserContext): Promise<Sponsor[]> {
    const store = getDevStore();
    if (user && user.role === 'admin') {
      return [...store.sponsors];
    }
    return store.sponsors.filter(s => s.isActive);
  }

  async toggleSponsor(sponsorId: string, user: UserContext): Promise<Sponsor> {
    if (!user || user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: se requieren permisos de administrador para gestionar sponsors.');
    }
    const store = getDevStore();
    const sp = store.sponsors.find(s => s.id === sponsorId);
    if (!sp) {
      throw new NotFoundError('Sponsor no encontrado.');
    }
    sp.isActive = !sp.isActive;

    store.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'SPONSOR_TOGGLED',
      actorRole: 'admin',
      actorName: user.name || user.email,
      details: `Sponsor "${sp.title}" cambiado a estado ${sp.isActive ? 'ACTIVO' : 'INACTIVO'}.`,
      timestamp: new Date().toISOString()
    });

    return { ...sp };
  }

  getDevSession(token: string): DevSession | undefined {
    return getDevStore().sessions.get(token);
  }

  saveDevSession(session: DevSession): void {
    getDevStore().sessions.set(session.token, session);
  }

  resetDemoData(): void {
    getDevStore().resetDemoData();
  }
}
