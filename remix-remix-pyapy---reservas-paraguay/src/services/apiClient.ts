// Client-side API client communicating with authoritative backend
import { SearchFilterState, MatchingResult, Sponsor } from '../types';

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

class ApiClientService {
  private token: string | null = null;

  setToken(t: string | null) {
    this.token = t;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          return { error: json.error || 'La disponibilidad cambió. Esa fecha/horario ya no está disponible.' };
        }
        if (res.status === 422) {
          return { error: json.error || 'Los datos enviados no son válidos.' };
        }
        if (res.status === 401) {
          return { error: json.error || 'Tu sesión expiró. Volvé a iniciar sesión.' };
        }
        if (res.status === 403) {
          return { error: json.error || 'No tenés permisos para realizar esta acción.' };
        }
        if (res.status === 500) {
          return { error: json.error || 'Ocurrió un error en el servidor. Intentá nuevamente.' };
        }
        if (res.status === 503) {
          return { error: json.error || 'El servicio no está disponible temporalmente. Intentá nuevamente en unos minutos.' };
        }
        return { error: json.error || `Error ${res.status}: Operación rechazada por el servidor.` };
      }
      return { data: json };
    } catch (err: any) {
      return { error: err.message || 'Error de conexión con el servidor autoritativo.' };
    }
  }

  // Properties
  async getProperties() {
    return this.request<{ properties: any[] }>('/api/properties');
  }

  async getPropertyById(id: string) {
    return this.request<{ property: any }>(`/api/properties/${id}`);
  }

  async createProperty(propertyData: any) {
    return this.request<{ success: boolean; property: any }>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  }

  async checkAvailability(propertyId: string, params: { startDate: string; startTime: string; endTime: string; endDate?: string }) {
    const q = new URLSearchParams({
      startDate: params.startDate,
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.endDate ? { endDate: params.endDate } : {})
    });
    return this.request<{ available: boolean; conflicts: { reservation: boolean; ownerBooking: boolean; maintenanceBlock: boolean } }>(
      `/api/properties/${propertyId}/availability?${q.toString()}`
    );
  }

  // Auth
  async loginAdmin(secretKey: string) {
    const res = await this.request<{ token: string; session: any }>('/api/auth/login-admin', {
      method: 'POST',
      body: JSON.stringify({ secretKey })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async loginHost(propertyId: string, hostSecret: string, email?: string) {
    const res = await this.request<{ token: string; session: any }>('/api/auth/login-host', {
      method: 'POST',
      body: JSON.stringify({ propertyId, hostSecret, email })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async loginCustomer(name: string, phone: string, email?: string) {
    const res = await this.request<{ token: string; session: any }>('/api/auth/login-customer', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  logout() {
    this.token = null;
  }

  // Reservation
  async createReservation(params: any) {
    return this.request<{ success: boolean; reservation: any; ownerNotificationMessage: string }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async lookupReservation(locator: string, verificationValue: string) {
    return this.request<{ reservation: any }>('/api/reservations/lookup', {
      method: 'POST',
      body: JSON.stringify({ locator, verificationValue })
    });
  }

  async cancelReservation(id: string, reason: string, verificationValue?: string) {
    return this.request<{ success: boolean; updatedReservation: any }>(`/api/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, verificationValue })
    });
  }

  // Owner Operations
  async getOwnerProperties() {
    return this.request<{ properties: any[] }>('/api/owner/properties');
  }

  async getOwnerReservations(propertyId?: string) {
    const url = propertyId ? `/api/owner/reservations?propertyId=${encodeURIComponent(propertyId)}` : '/api/owner/reservations';
    return this.request<{ reservations: any[] }>(url);
  }

  async getOwnerBookings(propertyId?: string) {
    const url = propertyId ? `/api/owner/bookings?propertyId=${encodeURIComponent(propertyId)}` : '/api/owner/bookings';
    return this.request<{ bookings: any[] }>(url);
  }

  async createOwnerBooking(params: any) {
    return this.request<{ success: boolean; booking: any }>('/api/owner/bookings', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async deleteOwnerBooking(id: string) {
    return this.request<{ success: boolean }>(`/api/owner/bookings/${id}`, {
      method: 'DELETE'
    });
  }

  async getOwnerBlocks(propertyId?: string) {
    const url = propertyId ? `/api/owner/blocks?propertyId=${encodeURIComponent(propertyId)}` : '/api/owner/blocks';
    return this.request<{ blocks: any[] }>(url);
  }

  async createBlock(params: any) {
    return this.request<{ success: boolean; block: any }>('/api/owner/blocks', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async deleteBlock(id: string) {
    return this.request<{ success: boolean }>(`/api/owner/blocks/${id}`, {
      method: 'DELETE'
    });
  }

  async downloadOwnerCsv(propertyId?: string): Promise<Blob | { error: string }> {
    const url = propertyId ? `/api/owner/export-csv?propertyId=${encodeURIComponent(propertyId)}` : '/api/owner/export-csv';
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return { error: `Error ${res.status}: No se pudo descargar el CSV.` };
      }
      return await res.blob();
    } catch (err: any) {
      return { error: err.message || 'Error al descargar el archivo CSV.' };
    }
  }

  // Admin Operations
  async getAuditLogs() {
    return this.request<{ auditLogs: any[] }>('/api/admin/audit-logs');
  }

  async getSearchIntents() {
    return this.request<{ searchIntents: any[] }>('/api/admin/search-intents');
  }

  async updateVerification(propertyId: string, status: string, notes?: string) {
    return this.request<{ success: boolean; property: any }>(`/api/admin/properties/${propertyId}/verification`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
  }

  // Reviews
  async createReview(params: any) {
    return this.request<{ success: boolean; review: any }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Demand
  async createSearchIntent(params: any) {
    return this.request<{ success: boolean; intent: any }>('/api/search-intents', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Search with Authoritative Availability & Server-Side Matching
  async searchProperties(filters: SearchFilterState) {
    return this.request<{
      availableMatches: MatchingResult[];
      alternatives: MatchingResult[];
      unavailableMatches: MatchingResult[];
    }>('/api/search', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }

  // Sponsors
  async getSponsors() {
    return this.request<{ sponsors: Sponsor[] }>('/api/sponsors');
  }

  async toggleSponsor(sponsorId: string) {
    return this.request<{ success: boolean; sponsor: Sponsor }>(`/api/admin/sponsors/${sponsorId}/toggle`, {
      method: 'POST'
    });
  }

  // Dev Demo Reset
  async resetDevDemoData() {
    return this.request<{ success: boolean; message: string }>('/api/dev/reset-demo', {
      method: 'POST'
    });
  }
}

export const ApiClient = new ApiClientService();
