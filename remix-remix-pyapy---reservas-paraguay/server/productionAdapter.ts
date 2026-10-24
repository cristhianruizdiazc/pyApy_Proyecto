// server/productionAdapter.ts
// PRODUCTION STORAGE ADAPTER
// SOLE AUTHORITATIVE PERSISTENCE IN PRODUCTION: Cloud Firestore
// Strictly forbidden from importing, referencing, or falling back to DevStore or in-memory JSON.

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
import {
  FirestoreDatabaseService,
  ServiceUnavailableError,
  AuthorizationError
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

export class ProductionStorageAdapter implements IStorageAdapter {
  public readonly isProduction = true;

  constructor() {
    // Production adapter does not hold local state or memory fallbacks.
  }

  private ensureFirestore(): void {
    if (!FirestoreDatabaseService.isAvailable()) {
      throw new ServiceUnavailableError(
        'Cloud Firestore es la única fuente de verdad en producción y no está configurado o disponible (503 SERVICE_UNAVAILABLE).'
      );
    }
  }

  async getProperties(user?: UserContext): Promise<Partial<Property>[]> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.getProperties(user);
  }

  async getPropertyById(id: string, user?: UserContext): Promise<Partial<Property> | null> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.getPropertyById(id, user);
  }

  async updatePropertyVerification(
    id: string,
    status: string,
    notes: string,
    user: UserContext
  ): Promise<Property> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.updatePropertyVerification(id, status, notes, user);
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
    this.ensureFirestore();
    return await FirestoreDatabaseService.checkAvailability(
      propertyId,
      startDate,
      startTime,
      endTime,
      endDate
    );
  }

  async createReservation(
    params: CreateReservationParams,
    user?: UserContext
  ): Promise<{
    reservation: Reservation;
    ownerNotificationMessage: string;
    isIdempotent?: boolean;
  }> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createReservationTransactional(params);
  }

  async lookupReservation(
    locator: string,
    verificationValue: string,
    user?: UserContext
  ): Promise<Partial<Reservation>> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.lookupReservation(locator, verificationValue, user);
  }

  async cancelReservation(
    reservationId: string,
    reason: string,
    user: UserContext
  ): Promise<{ success: boolean; reservation: Reservation }> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.cancelReservation(reservationId, reason, user);
  }

  async createProperty(propertyData: Partial<Property>, user?: UserContext): Promise<Property> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createProperty(propertyData, user);
  }

  async getOwnerProperties(user: UserContext): Promise<Partial<Property>[]> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.getOwnerProperties(user);
  }

  async getOwnerReservations(
    user: UserContext,
    targetPropertyId?: string
  ): Promise<Reservation[]> {
    this.ensureFirestore();
    const props = await FirestoreDatabaseService.getOwnerProperties(user);
    let propertyIds = props.map(p => p.id!).filter(Boolean);
    if (targetPropertyId) {
      if (user.role !== 'admin' && !propertyIds.includes(targetPropertyId)) {
        throw new AuthorizationError('No tenés autorización para ver reservas de este alojamiento.');
      }
      propertyIds = [targetPropertyId];
    }
    return await FirestoreDatabaseService.getOwnerReservations(propertyIds, user.role === 'admin');
  }

  async getOwnerBookings(
    user: UserContext,
    targetPropertyId?: string
  ): Promise<OwnerBooking[]> {
    this.ensureFirestore();
    const props = await FirestoreDatabaseService.getOwnerProperties(user);
    let propertyIds = props.map(p => p.id!).filter(Boolean);
    if (targetPropertyId) {
      if (user.role !== 'admin' && !propertyIds.includes(targetPropertyId)) {
        throw new AuthorizationError('No tenés autorización para ver reservas externas de este alojamiento.');
      }
      propertyIds = [targetPropertyId];
    }
    return await FirestoreDatabaseService.getOwnerBookings(propertyIds);
  }

  async createOwnerBooking(
    params: CreateOwnerBookingParams,
    user: UserContext
  ): Promise<OwnerBooking> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createOwnerBooking(params, user);
  }

  async deleteOwnerBooking(id: string, user: UserContext): Promise<boolean> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.deleteOwnerBooking(id, user);
  }

  async getOwnerBlocks(
    user: UserContext,
    targetPropertyId?: string
  ): Promise<Block[]> {
    this.ensureFirestore();
    const props = await FirestoreDatabaseService.getOwnerProperties(user);
    let propertyIds = props.map(p => p.id!).filter(Boolean);
    if (targetPropertyId) {
      if (user.role !== 'admin' && !propertyIds.includes(targetPropertyId)) {
        throw new AuthorizationError('No tenés autorización para ver bloqueos de este alojamiento.');
      }
      propertyIds = [targetPropertyId];
    }
    return await FirestoreDatabaseService.getOwnerBlocks(propertyIds);
  }

  async createBlock(params: CreateBlockParams, user: UserContext): Promise<Block> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createBlock(params, user);
  }

  async deleteBlock(id: string, user: UserContext): Promise<boolean> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.deleteBlock(id, user);
  }

  async exportOwnerReservationsCsv(
    user: UserContext,
    targetPropertyId?: string
  ): Promise<string> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.exportOwnerReservationsCsv(user, targetPropertyId);
  }

  async getAuditLogs(user: UserContext): Promise<AuditLog[]> {
    this.ensureFirestore();
    if (user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: solo administradores pueden ver registros de auditoría.');
    }
    return await FirestoreDatabaseService.getAuditLogs();
  }

  async getSearchIntents(user: UserContext): Promise<SearchIntent[]> {
    this.ensureFirestore();
    if (user.role !== 'admin') {
      throw new AuthorizationError('Acceso denegado: solo administradores pueden consultar intenciones de búsqueda.');
    }
    return await FirestoreDatabaseService.getSearchIntents();
  }

  async createSearchIntent(
    params: CreateSearchIntentParams,
    user?: UserContext
  ): Promise<SearchIntent> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createSearchIntent(params, user);
  }

  async createReview(params: CreateReviewParams, user: UserContext): Promise<Review> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.createReview(params, user);
  }

  async searchProperties(
    filters: SearchFilterState,
    user?: UserContext
  ): Promise<{
    availableMatches: MatchingResult[];
    alternatives: MatchingResult[];
    unavailableMatches: MatchingResult[];
  }> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.searchProperties(filters, user);
  }

  async getSponsors(user?: UserContext): Promise<Sponsor[]> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.getSponsors(user);
  }

  async toggleSponsor(sponsorId: string, user: UserContext): Promise<Sponsor> {
    this.ensureFirestore();
    return await FirestoreDatabaseService.toggleSponsor(sponsorId, user);
  }

  getDevSession(token: string): DevSession | undefined {
    // In production, dev sessions are strictly disabled and return undefined
    return undefined;
  }

  saveDevSession(session: DevSession): void {
    throw new Error('[FATAL_SECURITY_ERROR] Development sessions are strictly forbidden in production.');
  }
}
