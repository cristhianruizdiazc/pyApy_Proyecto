import React from 'react';
import { useApp } from '../context/AppContext';
import { VisualTheme, LanguageMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  Heart,
  Search,
  Building2,
  ShieldCheck,
  LogOut,
  Palette,
  Globe,
  Sparkles,
  Check
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    userRole,
    userName,
    isLoggedIn,
    logout,
    openAuthModal,
    setIsLookupModalOpen,
    setIsOwnerDashboardOpen,
    setIsAdminDashboardOpen,
    favorites,
    themeConfig
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: themeConfig.primary }}
          >
            py
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">
                pyApy
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 font-black">
                🇵🇾 PY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide hidden sm:block">
              Alojamientos Temporales en Paraguay
            </p>
          </div>
        </div>

        {/* Center/Right Nav Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Palette Selector */}
          <div className="relative group">
            <button
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Paletas de color inspiradas en Paraguay"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">{THEMES[theme]?.name || 'Paleta'}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block animate-in fade-in zoom-in-95 z-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Paletas Paraguay
              </span>
              {(Object.keys(THEMES) as VisualTheme[]).map(tKey => (
                <button
                  key={tKey}
                  onClick={() => setTheme(tKey)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    theme === tKey ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-2xs"
                      style={{ backgroundColor: THEMES[tKey].primary }}
                    />
                    <span>{THEMES[tKey].name}</span>
                  </div>
                  {theme === tKey && <Check className="w-3 h-3 text-amber-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Language Toggle (Español / Guaraní) */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'es_gn' : 'es')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              language === 'es_gn'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Alternar modo Guaraní / Bilingüe"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'es_gn' ? 'Guaraní ON' : 'ES'}</span>
          </button>

          {/* Favoritos Count */}
          <div className="relative">
            <button
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Quintas Favoritas"
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </div>

          {/* Consultar Reserva (Lookup by Locator) */}
          <button
            onClick={() => setIsLookupModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Consultar Reserva</span>
          </button>

          {/* User Session / Portals */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthModal('host')}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Soy Anfitrión</span>
              </button>
              <button
                onClick={() => openAuthModal('admin')}
                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Acceso Administración pyApy"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Admin</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {userRole === 'owner' && (
                <button
                  onClick={() => setIsOwnerDashboardOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Mi Panel Anfitrión</span>
                </button>
              )}

              {userRole === 'admin' && (
                <button
                  onClick={() => setIsAdminDashboardOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panel Super Admin</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-2.5 rounded-xl text-xs">
                <span className="font-bold text-slate-800 max-w-[100px] truncate hidden md:inline">
                  {userName}
                </span>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
