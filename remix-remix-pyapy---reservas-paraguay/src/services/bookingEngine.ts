// src/services/bookingEngine.ts
// PURE UTILITY & CLIENT HELPERS: All mutations are strictly server-authoritative via ApiClient
import { Reservation } from '../types';

export class BookingEngine {
  /**
   * Generates a random alphanumeric locator for client-side optimistic UI preview.
   * Final authoritative locator is assigned by the server.
   */
  static generateLocator(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const array = new Uint8Array(6);
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(array);
    }
    for (let i = 0; i < 6; i++) {
      code += chars[array[i] % chars.length];
    }
    return `PY-2026-${code}`;
  }

  /**
   * Generates formatted notification text conforming to official pyApy standard
   */
  static formatOwnerNotification(
    propertyName: string,
    startDate: string,
    startTime: string,
    endTime: string,
    guestCount: number,
    clientName: string,
    clientPhone: string,
    totalAmountPyg: number
  ): string {
    return `🔔 ¡Conseguimos una reserva para vos!
Alojamiento: ${propertyName}
Fecha: ${startDate} (${startTime} a ${endTime} hs)
Huéspedes: ${guestCount} personas
Cliente: ${clientName} (${clientPhone})
Total: Gs. ${totalAmountPyg.toLocaleString('es-PY')}

"Esta reserva llegó a través de pyApy."`;
  }

  /**
   * Formats WhatsApp redirect URL safely
   */
  static getWhatsAppDirectUrl(hostPhone: string, message: string): string {
    const cleanPhone = hostPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
}
