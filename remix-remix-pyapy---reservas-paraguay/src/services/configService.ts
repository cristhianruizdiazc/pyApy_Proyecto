import { SubscriptionPlanConfig, MatchingWeights } from '../types';

export const SUBSCRIPTION_PLANS: Record<'activo' | 'verificado' | 'vip', SubscriptionPlanConfig> = {
  activo: {
    id: 'activo',
    name: 'Plan Activo',
    monthlyFeePyg: 30000,
    badge: 'Activo en pyApy',
    features: [
      'Presencia en buscador multipropiedad pyApy',
      'Calendario unificado (pyApy + reservas propias + bloqueos)',
      'Gestión de disponibilidad y horarios en tiempo real',
      'Notificaciones automáticas de reservas por WhatsApp'
    ]
  },
  verificado: {
    id: 'verificado',
    name: 'Plan Verificado',
    monthlyFeePyg: 50000,
    badge: 'Verificado pyApy',
    features: [
      'Todo lo del Plan Activo',
      'Inspección y auditoría presencial pyApy',
      'Sello de Confianza Anti-Estafas en la ficha y resultados',
      'Métricas de visitas, consultas y reservas generadas',
      'Prioridad intermedia en resultados de búsqueda'
    ]
  },
  vip: {
    id: 'vip',
    name: 'Plan VIP Destacado',
    monthlyFeePyg: 100000,
    badge: 'Quinta VIP Destacada',
    features: [
      'Todo lo del Plan Verificado',
      'Máxima visibilidad en los primeros resultados',
      'Destacado en carrusel de inicio y redes oficiales',
      'Reporte exclusivo de demanda insatisfecha por zona',
      'Soporte prioritario 24/7 para anfitriones'
    ]
  }
};

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  dateAvailability: 0.35,
  zone: 0.20,
  capacity: 0.15,
  budget: 0.15,
  features: 0.15
};

export const ALL_AMENITIES = [
  { id: 'piscina', name: 'Piscina', icon: 'Waves' },
  { id: 'quincho', name: 'Quincho con Parrilla', icon: 'Utensils' },
  { id: 'tatakua', name: 'Tatakuá a Leña', icon: 'Flame' },
  { id: 'aire_acondicionado', name: 'Aire Acondicionado', icon: 'Wind' },
  { id: 'wifi', name: 'WiFi Starlink', icon: 'Wifi' },
  { id: 'cancha', name: 'Cancha (Piki / Fútbol)', icon: 'Trophy' },
  { id: 'mascotas', name: 'Pet Friendly', icon: 'Dog' },
  { id: 'estacionamiento', name: 'Estacionamiento Amplio', icon: 'Car' },
  { id: 'acceso_arroyo', name: 'Acceso a Arroyo', icon: 'Trees' },
  { id: 'generador', name: 'Generador Eléctrico', icon: 'Zap' }
];

export function formatGs(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Gs. 0';
  return `Gs. ${amount.toLocaleString('es-PY')}`;
}

export function parseGs(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}
