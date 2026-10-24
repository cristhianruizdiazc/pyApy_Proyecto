// server/storageAdapter.ts
// ARCHITECTURAL BOUNDARY: Interface definition for Storage Adapters.
// Enforces strict decoupling between Production (Cloud Firestore) and Development.

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

export interface UserContext {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'admin' | 'anonymous';
  ownerPropertyId?: string;
  firebaseAuth?: boolean;
}

export interface CreateReservationParams {
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
}

export interface CreateOwnerBookingParams {
  propertyId: string;
  title: string;
  guestName?: string;
  guestCount?: number;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime: string;
  notes?: string;
}

export interface CreateBlockParams {
  propertyId: string;
  type: 'maintenance' | 'personal_use' | 'unavailable' | 'other';
  reason: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime: string;
}

export interface CreateSearchIntentParams {
  date?: string;
  guestCount?: number;
  department?: string;
  city?: string;
  maxBudget?: number;
  requestedFeatures?: string[];
  contactPhone: string;
  contactEmail?: string;
}

export interface CreateReviewParams {
  reservationId: string;
  rating: number;
  comment?: string;
}

export interface DevSession {
  token: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'owner' | 'admin';
  ownerPropertyId?: string;
  createdAt: number;
}

export interface IStorageAdapter {
  readonly isProduction: boolean;
  getProperties(user?: UserContext): Promise<Partial<Property>[]>;
  getPropertyById(id: string, user?: UserContext): Promise<Partial<Property> | null>;
  updatePropertyVerification(id: string, status: string, notes: string, user: UserContext): Promise<Property>;
  checkAvailability(
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
  }>;
  createReservation(
    params: CreateReservationParams,
    user?: UserContext
  ): Promise<{
    reservation: Reservation;
    ownerNotificationMessage: string;
    isIdempotent?: boolean;
    idempotentReplay?: boolean;
  }>;
  lookupReservation(locator: string, verificationValue: string, user?: UserContext): Promise<Partial<Reservation>>;
  cancelReservation(reservationId: string, reason: string, user: UserContext): Promise<{ success: boolean; reservation: Reservation }>;
  createProperty(propertyData: Partial<Property>, user?: UserContext): Promise<Property>;
  getOwnerProperties(user: UserContext): Promise<Partial<Property>[]>;
  getOwnerReservations(user: UserContext, targetPropertyId?: string): Promise<Reservation[]>;
  getOwnerBookings(user: UserContext, targetPropertyId?: string): Promise<OwnerBooking[]>;
  createOwnerBooking(params: CreateOwnerBookingParams, user: UserContext): Promise<OwnerBooking>;
  deleteOwnerBooking(id: string, user: UserContext): Promise<boolean>;
  getOwnerBlocks(user: UserContext, targetPropertyId?: string): Promise<Block[]>;
  createBlock(params: CreateBlockParams, user: UserContext): Promise<Block>;
  deleteBlock(id: string, user: UserContext): Promise<boolean>;
  exportOwnerReservationsCsv(user: UserContext, targetPropertyId?: string): Promise<string>;
  getAuditLogs(user: UserContext): Promise<AuditLog[]>;
  getSearchIntents(user: UserContext): Promise<SearchIntent[]>;
  createSearchIntent(params: CreateSearchIntentParams, user?: UserContext): Promise<SearchIntent>;
  createReview(params: CreateReviewParams, user: UserContext): Promise<Review>;
  searchProperties(
    filters: SearchFilterState,
    user?: UserContext
  ): Promise<{
    availableMatches: MatchingResult[];
    alternatives: MatchingResult[];
    unavailableMatches: MatchingResult[];
  }>;
  getSponsors(user?: UserContext): Promise<Sponsor[]>;
  toggleSponsor(sponsorId: string, user: UserContext): Promise<Sponsor>;
  getDevSession?(token: string): DevSession | undefined;
  saveDevSession?(session: DevSession): void;
}
