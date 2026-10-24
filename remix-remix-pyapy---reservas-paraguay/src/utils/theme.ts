import { VisualTheme } from '../types';

export interface ThemeConfig {
  id: VisualTheme;
  name: string;
  subtitle: string;
  guaraniTag: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  badgeBg: string;
  cardBg: string;
  borderSubtle: string;
  headerGradient: string;
  heroGlow: string;
  pillSelected: string;
  previewColor: string;
  description: string;
}

export const THEMES: Record<VisualTheme, ThemeConfig> = {
  sanber: {
    id: 'sanber',
    name: 'Verano Sanber',
    subtitle: 'Lago Ypacaraí & Brisa Estival',
    guaraniTag: 'Ypacaraí Yvytu',
    primary: '#0284c7', // Sky 600
    primaryHover: '#0369a1',
    primaryLight: '#e0f2fe',
    accent: '#f59e0b', // Amber 500
    accentLight: '#fef3c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    cardBg: 'bg-white',
    borderSubtle: 'border-sky-100',
    headerGradient: 'from-sky-700 via-sky-800 to-cyan-900',
    heroGlow: 'from-cyan-500/20 via-sky-500/10 to-amber-500/10',
    pillSelected: 'bg-sky-600 text-white shadow-md shadow-sky-500/25',
    previewColor: '#0ea5e9',
    description: 'Tonos turquesa del lago, cielo azul despejado y acentos soleados de verano.',
  },
  cordillera: {
    id: 'cordillera',
    name: 'Naturaleza Cordillera',
    subtitle: 'Cerros, Bosque & Arroyos',
    guaraniTag: 'Yvyturusy Kaaguy',
    primary: '#059669', // Emerald 600
    primaryHover: '#047857',
    primaryLight: '#d1fae5',
    accent: '#d97706', // Warm wood/amber
    accentLight: '#fef3c7',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardBg: 'bg-white',
    borderSubtle: 'border-emerald-100',
    headerGradient: 'from-emerald-800 via-teal-900 to-stone-900',
    heroGlow: 'from-emerald-500/20 via-teal-500/10 to-amber-500/10',
    pillSelected: 'bg-emerald-700 text-white shadow-md shadow-emerald-600/25',
    previewColor: '#10b981',
    description: 'Verde follaje serrano, aire puro de Altos/Caacupé y tonos de madera cálida.',
  },
  sunset: {
    id: 'sunset',
    name: 'Ñandutí Sunset',
    subtitle: 'Crepúsculo Dorado & Artesanía',
    guaraniTag: 'Kuarahy Reike',
    primary: '#e11d48', // Rose 600
    primaryHover: '#be123c',
    primaryLight: '#ffe4e6',
    accent: '#f97316', // Orange 500
    accentLight: '#ffedd5',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    cardBg: 'bg-white',
    borderSubtle: 'border-rose-100',
    headerGradient: 'from-rose-800 via-pink-900 to-orange-950',
    heroGlow: 'from-rose-500/20 via-orange-500/15 to-purple-500/10',
    pillSelected: 'bg-rose-600 text-white shadow-md shadow-rose-500/25',
    previewColor: '#f43f5e',
    description: 'Atardeceres cálidos con matices coral, naranja mango y encaje tradicional.',
  },
  terere: {
    id: 'terere',
    name: 'Tereré Rupa',
    subtitle: 'Hierbas Frescas & Cuero Repujado',
    guaraniTag: 'Pohã Ro’ysã',
    primary: '#15803d', // Green 700 (Mentha/Yerba)
    primaryHover: '#166534',
    primaryLight: '#dcfce7',
    accent: '#854d0e', // Leather brown
    accentLight: '#fef9c3',
    badgeBg: 'bg-green-100 text-green-800 border-green-300',
    cardBg: 'bg-white',
    borderSubtle: 'border-green-100',
    headerGradient: 'from-green-900 via-emerald-950 to-amber-950',
    heroGlow: 'from-green-500/20 via-lime-500/15 to-yellow-600/10',
    pillSelected: 'bg-green-800 text-white shadow-md shadow-green-700/25',
    previewColor: '#22c55e',
    description: 'Frescura de yuyos refrescantes, guampa artesanal y descanso bajo el tajy.',
  },
  asuncion_chic: {
    id: 'asuncion_chic',
    name: 'Asunción Chic Nocturno',
    subtitle: 'Elegancia Contemporánea & Palmeras',
    guaraniTag: 'Pyhare Vera',
    primary: '#4f46e5', // Indigo 600
    primaryHover: '#4338ca',
    primaryLight: '#e0e7ff',
    accent: '#0d9488', // Teal 600
    accentLight: '#ccfbf1',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    cardBg: 'bg-white',
    borderSubtle: 'border-indigo-100',
    headerGradient: 'from-slate-950 via-indigo-950 to-zinc-900',
    heroGlow: 'from-indigo-500/20 via-teal-500/15 to-cyan-500/10',
    pillSelected: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25',
    previewColor: '#6366f1',
    description: 'Estilo moderno premium, iluminación cálida de piscina nocturna y exclusividad.',
  },
};
