import { UserRole } from '../types';
import { ApiClient } from './apiClient';
import { firebaseAuth, isFirebaseConfigured } from './firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isLoggedIn: boolean;
  ownerPropertyId?: string; // If role === 'owner'
  token?: string;
  isFirebaseAuth?: boolean;
}

type AuthListener = (session: UserSession) => void;
const listeners = new Set<AuthListener>();

const ANONYMOUS_SESSION: UserSession = {
  id: 'guest_anon',
  name: 'Visitante Invitado',
  email: '',
  role: 'customer',
  isLoggedIn: false
};

class AuthServiceRepository {
  private currentSession: UserSession = { ...ANONYMOUS_SESSION };

  getSession(): UserSession {
    return { ...this.currentSession };
  }

  subscribe(fn: AuthListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }

  private notify() {
    listeners.forEach(fn => fn({ ...this.currentSession }));
  }

  // Real Firebase Client Authentication (When Firebase credentials are provided)
  async loginWithFirebaseAuth(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return {
        success: false,
        error: 'Firebase Auth no está configurado en el cliente (faltan variables VITE_FIREBASE_*).'
      };
    }

    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      const idToken = await cred.user.getIdToken();
      ApiClient.setToken(idToken);

      // Verify token with backend to obtain authoritative role and profile
      const verifyRes = await fetch('/api/auth/verify-firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken })
      });

      if (!verifyRes.ok) {
        const errJson = await verifyRes.json();
        return { success: false, error: errJson.error || 'Fallo de verificación de token en el servidor.' };
      }

      const verifyData = await verifyRes.json();
      this.currentSession = {
        id: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email: cred.user.email || email,
        role: verifyData.user?.role || 'customer',
        isLoggedIn: true,
        token: idToken,
        isFirebaseAuth: true
      };
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de autenticación en Firebase.' };
    }
  }

  // Host Portal Authentication (Server-Authoritative - No hardcoded frontend secret)
  async loginAsHost(email: string, propertyId: string, hostSecret: string): Promise<{ success: boolean; error?: string }> {
    const res = await ApiClient.loginHost(propertyId, hostSecret, email);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data?.session) {
      this.currentSession = {
        id: res.data.session.uid,
        name: res.data.session.name,
        email: res.data.session.email,
        role: 'owner',
        isLoggedIn: true,
        ownerPropertyId: res.data.session.ownerPropertyId || propertyId,
        token: res.data.token
      };
      this.notify();
      return { success: true };
    }
    return { success: false, error: 'Respuesta inválida del servidor.' };
  }

  // Admin Portal Authentication (Server-Authoritative - Strictly verified on backend against ADMIN_SECRET)
  async loginAsAdmin(secretKey: string): Promise<{ success: boolean; error?: string }> {
    const res = await ApiClient.loginAdmin(secretKey);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data?.session) {
      this.currentSession = {
        id: res.data.session.uid,
        name: res.data.session.name,
        email: res.data.session.email,
        role: 'admin',
        isLoggedIn: true,
        token: res.data.token
      };
      this.notify();
      return { success: true };
    }
    return { success: false, error: 'Credenciales administrativas no autorizadas.' };
  }

  // Customer Login (Server-Authoritative Session)
  async loginAsCustomer(name: string, phone: string, email?: string): Promise<{ success: boolean; error?: string }> {
    const res = await ApiClient.loginCustomer(name, phone, email);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data?.session) {
      this.currentSession = {
        id: res.data.session.uid,
        name: res.data.session.name,
        phone: res.data.session.phone || phone,
        email: res.data.session.email || email || '',
        role: 'customer',
        isLoggedIn: true,
        token: res.data.token
      };
      this.notify();
      return { success: true };
    }
    return { success: false, error: 'No se pudo iniciar sesión.' };
  }

  async logout(): Promise<void> {
    if (isFirebaseConfigured && firebaseAuth && this.currentSession.isFirebaseAuth) {
      try {
        await signOut(firebaseAuth);
      } catch {
        // Ignore signout network errors
      }
    }
    ApiClient.logout();
    this.currentSession = { ...ANONYMOUS_SESSION };
    this.notify();
  }
}

export const AuthService = new AuthServiceRepository();
