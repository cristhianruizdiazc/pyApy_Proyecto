import { LanguageMode } from '../types';

export const DICTIONARY = {
  welcome: {
    es: 'Encontrá tu casa quinta, piscina y quincho ideal en Paraguay',
    gn: 'Ejuhu nde kóga, ykua ha quincho porãite Paraguáipe',
  },
  greeting: {
    es: '¡Hola! ¿A dónde te gustaría escapar este fin de semana?',
    gn: '¡Mba\'éichapa! ¿Moõpa rehosé ko arapahápe?',
  },
  bookNow: {
    es: 'Reservar Ahora',
    gn: 'Emboheko Ko\'ápe',
  },
  verifiedBadge: {
    es: 'Alojamiento Verificado pyApy',
    gn: 'Tenda Mboajepy pyApy rupi',
  },
  verifiedTooltip: {
    es: 'Propiedad inspeccionada y verificada contra estafas por el equipo de pyApy',
    gn: 'Mba\'aporenda oñehesa\'ỹijoma ha ndaipóri mba\'e vai',
  },
  vipBadge: {
    es: 'Quinta VIP Destacada',
    gn: 'Kóga Poravopyre VIP',
  },
  selectPlace: {
    es: 'Seleccionar este lugar',
    gn: 'Eiporavo ko tenda',
  },
  selectedUnits: {
    es: 'Lugares seleccionados',
    gn: 'Tenda poravopyre',
  },
  availabilityMap: {
    es: 'Plano interactivo de disponibilidad',
    gn: 'Tenda ra\'anga ohechaukáva mba\'éichapa oĩ',
  },
  available: {
    es: 'Disponible',
    gn: 'Ikatúva oñemboheko',
  },
  occupied: {
    es: 'Ocupado / Reservado',
    gn: 'Ojejapóma / Ndaipóri',
  },
  warningSoon: {
    es: 'Próxima a liberarse',
    gn: 'Oñemboguepotáma',
  },
  incompatible: {
    es: 'No compatible con filtros',
    gn: 'Ndohupytýi tapicha retakue',
  },
  outOfService: {
    es: 'Fuera de servicio / Mantenimiento',
    gn: 'Oñemyatyrõ hína',
  },
  blocked: {
    es: 'Bloqueado por administración',
    gn: 'Oñembotýma sãmbyhyha rupi',
  },
  groupCombination: {
    es: 'Combinación inteligente para grupos',
    gn: 'Mbojoapy aty guasúpe g̃uarã',
  },
  groupNotice: {
    es: 'Hemos combinado automáticamente espacios conectados físicamente para optimizar tu grupo',
    gn: 'Ñamboheko oñondive ko\'ã tenda reiko porã hag̃ua ne irũnguéra ndive',
  },
  lookupBooking: {
    es: 'Consultar mi reserva',
    gn: 'Ehecha ne kuatia mba\'apopyre',
  },
  locatorCode: {
    es: 'Código Localizador',
    gn: 'Papapy rechauka',
  },
  waitlistTitle: {
    es: 'Unirse a Lista de Espera',
    gn: 'Eñemboja Ha\'arõha Rysýipe',
  },
  thanks: {
    es: '¡Muchas gracias por elegirnos!',
    gn: '¡Aguijeiterei ndéve oreporavo haguére!',
  },
  hostRegistration: {
    es: 'Registro Exclusivo de Propietarios',
    gn: 'Jehaikatu Járape g̃uarã',
  },
  seeYouSoon: {
    es: '¡Que disfrutes tu estadía en Paraguay!',
    gn: '¡Torypápe ehasa porãite Paraguáipe!',
  }
};

export function getTranslation(key: keyof typeof DICTIONARY, mode: LanguageMode): string {
  const item = DICTIONARY[key];
  if (!item) return key;
  if (mode === 'es_gn') {
    return `${item.es} (${item.gn})`;
  }
  return item.es;
}

export function formatGuaranies(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(amount).replace('PYG', '₲');
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
