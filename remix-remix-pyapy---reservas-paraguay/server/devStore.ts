// server/devStore.ts
// STRICTLY DEVELOPMENT / LOCAL TEST ONLY IN-MEMORY STORE
// CRITICAL SECURITY ASSERTION: This module is strictly prohibited from running in production.

import {
  SEED_PROPERTIES,
  SEED_RESERVATIONS,
  SEED_OWNER_BOOKINGS,
  SEED_BLOCKS,
  SEED_SEARCH_INTENTS,
  SEED_SPONSORS
} from './seedData';
import {
  Reservation,
  Property,
  OwnerBooking,
  Block,
  SearchIntent,
  Review,
  AuditLog,
  Sponsor
} from '../src/types';
import { DevSession } from './storageAdapter';

export class DevStore {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[FATAL_SECURITY_ERROR] server/devStore.ts cannot be instantiated or used in production. Cloud Firestore is the sole authoritative database.'
      );
    }
  }

  public properties: Property[] = JSON.parse(JSON.stringify(SEED_PROPERTIES));
  public reservations: (Reservation & { auditTrail?: any[] })[] = JSON.parse(JSON.stringify(SEED_RESERVATIONS));
  public ownerBookings: OwnerBooking[] = JSON.parse(JSON.stringify(SEED_OWNER_BOOKINGS));
  public blocks: Block[] = JSON.parse(JSON.stringify(SEED_BLOCKS));
  public searchIntents: SearchIntent[] = JSON.parse(JSON.stringify(SEED_SEARCH_INTENTS));
  public sponsors: Sponsor[] = JSON.parse(JSON.stringify(SEED_SPONSORS));
  public reviews: Review[] = [];
  public auditLogs: AuditLog[] = [
    {
      id: 'aud_dev_init',
      action: 'SERVER_BOOTSTRAP',
      actorRole: 'admin',
      actorName: 'pyApy Dev Store Engine',
      details: 'DevStore inicializado para pruebas locales exclusivamente.',
      timestamp: new Date().toISOString()
    }
  ];
  public sessions: Map<string, DevSession> = new Map();

  // Reset demo data helper
  public resetDemoData() {
    this.properties = JSON.parse(JSON.stringify(SEED_PROPERTIES));
    this.reservations = JSON.parse(JSON.stringify(SEED_RESERVATIONS));
    this.ownerBookings = JSON.parse(JSON.stringify(SEED_OWNER_BOOKINGS));
    this.blocks = JSON.parse(JSON.stringify(SEED_BLOCKS));
    this.searchIntents = JSON.parse(JSON.stringify(SEED_SEARCH_INTENTS));
    this.sponsors = JSON.parse(JSON.stringify(SEED_SPONSORS));
    this.reviews = [];
    this.auditLogs = [
      {
        id: `aud_${Date.now()}`,
        action: 'RESET_DEMO_DATA',
        actorRole: 'admin',
        actorName: 'pyApy Dev Engine',
        details: 'Datos de desarrollo restablecidos.',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

let devStoreInstance: DevStore | null = null;

export function getDevStore(): DevStore {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL_SECURITY_ERROR] DevStore access is strictly prohibited in production environments.'
    );
  }
  if (!devStoreInstance) {
    devStoreInstance = new DevStore();
  }
  return devStoreInstance;
}
