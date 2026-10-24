export type VisualTheme = 'sanber' | 'cordillera' | 'sunset' | 'terere' | 'asuncion_chic';

export type UserRole = 'customer' | 'owner' | 'admin' | 'host' | 'anonymous';

export type LanguageMode = 'es' | 'es_gn';

export type VerificationStatus = 'submitted' | 'pending' | 'pending_review' | 'under_review' | 'verified' | 'rejected';

export type SubscriptionPlanId = 'activo' | 'verificado' | 'vip';

export type BookingType = 'turn_day' | 'turn_night' | 'full_day' | 'custom';

export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'not_applicable' | 'paid_full' | 'paid_deposit';

export type UnitStatus = 'available' | 'occupied' | 'warning' | 'out_of_service' | 'blocked' | 'selected' | 'incompatible';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface PropertyTurn {
  id: string;
  name: string;
  startTime: string; // HH:mm e.g. "08:00" or "20:00"
  endTime: string;   // HH:mm e.g. "18:00" or "06:00"
  crossesMidnight?: boolean;
  pricePyg: number;
  description?: string;
}

export interface PropertySocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export interface FloorPlanUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  name: string;
  nameGn?: string;
  zoneType: string;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  minCapacity?: number;
  pricePerDay: number;
  pricePerTurn?: number;
  status: UnitStatus;
  releaseTime?: string;
  nextReservation?: string;
  cleaningBufferMinutes: number;
  description: string;
  features: string[];
  photos: string[];
  combinableWith?: string[];
  isAccessible?: boolean;
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  department: string;
  city: string;
  neighborhood: string;
  address?: string;
  approximateReference?: string; // Public reference without exposing exact coordinates or street address prematurely
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  heroPhoto: string;
  gallery: string[];
  description: string;
  descriptionGn?: string;
  ownerId?: string;
  ownerCi?: string;
  ownerAddress?: string;
  hostName: string;
  hostPhone: string;
  hostPhoneSecondary?: string;
  hostEmail: string;
  isVerified: boolean;
  isVip?: boolean;
  verificationStatus?: VerificationStatus;
  verificationDate?: string;
  verificationNotes?: string;
  subscriptionPlan?: SubscriptionPlanId;
  subscriptionStatus?: 'active' | 'past_due' | 'cancelled';
  rating: number; // 0 if new, no fake ratings!
  reviewsCount?: number;
  capacity?: number;
  minCapacity?: number;
  pricePerDay?: number; // Gs.
  pricePerTurn?: number; // Gs.
  checkInTime?: string;
  checkOutTime?: string;
  allowedTurns?: PropertyTurn[];
  amenities: string[];
  rules: string[];
  socialLinks?: PropertySocialLinks;
  units?: FloorPlanUnit[];
  hasWaitlist?: boolean;
}

export interface Reservation {
  id: string;
  locator: string; // e.g. "PY-2026-QK894"
  propertyId: string;
  propertyName: string;
  ownerId?: string;
  customerId?: string;
  clientName: string;
  clientDoc: string; // CI or Passport
  clientPhone: string; // WhatsApp
  clientEmail: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  crossesMidnight?: boolean;
  turnId?: string;
  turnName?: string;
  unitIds?: string[];
  unitNames?: string[];
  bookingType: BookingType;
  guestCount: number;
  totalAmountPyg: number;
  currency?: 'PYG';
  origin?: 'pyapy'; // Always 'pyapy' to prove pyApy value
  reservationStatus?: ReservationStatus;
  status?: any;
  paymentStatus: PaymentStatus;
  paymentNotes?: string;
  specialRequests?: string;
  allergies?: string;
  accessibilityRequired?: boolean;
  createdByUserRole?: string;
  authorName?: string;
  totalAmountUsd?: number;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  ownerNotified?: boolean;
  auditTrail: {
    action: string;
    timestamp: string;
    actor: string;
    notes?: string;
  }[];
}

export interface OwnerBooking {
  id: string;
  propertyId: string;
  ownerId: string;
  title: string;
  guestName?: string;
  guestCount: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  crossesMidnight: boolean;
  notes?: string;
  createdAt: string;
}

export interface Block {
  id: string;
  propertyId: string;
  ownerId: string;
  type: 'maintenance' | 'personal_use' | 'unavailable' | 'other';
  reason: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  crossesMidnight: boolean;
  createdAt: string;
}

export interface SearchIntent {
  id: string;
  date?: string;
  endDate?: string;
  turnType?: BookingType;
  guestCount?: number;
  department?: string;
  city?: string;
  maxBudget?: number;
  requestedFeatures: string[];
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
  status: 'active' | 'notified';
}

export interface Review {
  id: string;
  propertyId: string;
  reservationId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface Sponsor {
  id: string;
  title: string;
  category: 'gastronomia' | 'bebidas' | 'supermercado' | 'transporte' | 'combustible' | 'actividades';
  desc: string;
  ctaText: string;
  badge: string;
  contactPhone?: string;
  targetUrl?: string;
  isActive: boolean;
}

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  monthlyFeePyg: number;
  badge: string;
  features: string[];
}

export interface MatchingWeights {
  dateAvailability: number; // Default 35%
  zone: number;             // Default 20%
  capacity: number;         // Default 15%
  budget: number;           // Default 15%
  features: number;         // Default 15%
}

export interface SearchFilterState {
  department: string;
  city: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  bookingType: BookingType;
  guestCount: number;
  maxBudget?: number;
  selectedAmenities: string[];
}

export interface MatchingResult {
  property: Property;
  score: number;
  isAvailable: boolean;
  unavailabilityReason?: string;
  matchReasons: string[];
  alternativeReason?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  propertyId?: string;
  propertyName?: string;
  locator?: string;
  actorRole: UserRole;
  actorUid?: string;
  actorName: string;
  details: string;
  timestamp: string;
  ipSimulated?: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'search' | 'search_no_match' | 'property_view' | 'favorite' | 'inquiry' | 'booking_started' | 'booking_confirmed' | 'booking_cancelled' | 'social_link_clicked';
  details: Record<string, any>;
  timestamp: string;
}

export interface WaitlistEntry {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  desiredDate: string;
  desiredTime: string;
  guestCount: number;
  preferredZone?: string;
  createdAt: string;
  status: 'waiting' | 'contacted' | 'resolved' | 'expired';
  notes?: string;
}

export interface GroupCombinationOption {
  id: string;
  name: string;
  unitIds: string[];
  totalCapacity: number;
  totalPricePerDay: number;
  totalPricePerTurn: number;
  description: string;
}
