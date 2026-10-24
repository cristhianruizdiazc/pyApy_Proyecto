/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MainSearchHero } from './components/Search/MainSearchHero';
import { SearchResultsSection } from './components/Search/SearchResultsSection';
import { PropertyDetailModal } from './components/Property/PropertyDetailModal';
import { BookingModal } from './components/Booking/BookingModal';
import { LookupReservationModal } from './components/Booking/LookupReservationModal';
import { SearchIntentModal } from './components/Search/SearchIntentModal';
import { OwnerDashboard } from './components/Owner/OwnerDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthModal } from './components/Auth/AuthModal';
import { FloorPlanModal } from './components/FloorPlan/FloorPlanModal';
import {
  ShieldCheck,
  Heart,
  Sparkles,
  Phone,
  HelpCircle,
  FlaskConical,
  X,
  ChevronUp
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { themeConfig, language, handleQuickScenario, isDevTestingOpen, setIsDevTestingOpen } = useApp();
  const [showDevBar, setShowDevBar] = useState(false);

  return (
    <div
      className="min-h-screen text-slate-900 transition-colors duration-500 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col"
      style={{ backgroundColor: themeConfig.bgGradient }}
    >
      {/* Discreet Developer / QA Scenarios Bar */}
      {showDevBar && (
        <div className="bg-slate-950 text-slate-200 px-4 py-2 text-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">Escenarios QA:</span>
            <span className="text-slate-400 text-[11px]">Pruebas de disponibilidad y concurrencia</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleQuickScenario('pareja_escapada')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
            >
              1. Pareja en Altos (2p)
            </button>
            <button
              onClick={() => handleQuickScenario('familia_asado')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
            >
              2. Asado en Sanber (8p)
            </button>
            <button
              onClick={() => handleQuickScenario('grupo_amigos')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
            >
              3. Arroyo en Piribebuy (15p)
            </button>
            <button
              onClick={() => handleQuickScenario('evento_grande')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
            >
              4. Evento en Areguá (35p)
            </button>
            <button
              onClick={() => setShowDevBar(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Multi-Property Search Hero */}
        <MainSearchHero />

        {/* Multi-Property Search Results (Available, Alternatives, Unavailable, Sponsors) */}
        <SearchResultsSection />
      </main>

      {/* Paraguay Quality Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  py
                </div>
                <div>
                  <span className="text-white font-black text-lg">pyApy</span>
                  <span className="text-xs text-slate-500 block -mt-1 font-semibold">
                    Alojamientos en Paraguay
                  </span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Marketplace y buscador multipropiedad de quintas, casas de verano, piscinas y cabañas con disponibilidad en tiempo real y reserva directa sin intermediarios opacos.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Garantía de Auditoría Anti-Estafas</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Destinos Populares en Paraguay
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• San Bernardino & Ciervo Cuá (Cordillera)</li>
                <li>• Altos, Atyrá & Piribebuy (Cordillera)</li>
                <li>• Areguá, Luque & San Antonio (Central)</li>
                <li>• Paraguarí & Cerros Históricos</li>
                <li>• Carmen del Paraná & Encarnación (Itapúa)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Seguridad & Soporte
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• Motor de Bloqueo Atómico Anti-Doble Reserva</li>
                <li>• Código Localizador de Reserva Verificado</li>
                <li>• Sello Oficial para Anfitriones Auditados</li>
                <li>• Notificación Automática de Reserva a Propietarios</li>
                <li>• Atención WhatsApp: +595 981 990 120</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                5 Estilos Visuales Paraguayos
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Elegí tu ambiente preferido: San Bernardino, Cordillera Verde, Ñandutí Sunset, Tereré Rupa y Asunción Chic.
              </p>
              <p className="text-amber-300 font-bold mt-3 text-[11px]">
                🇵🇾 {language === 'es_gn' ? 'Vy\'apavẽ ha tory reheve Paraguay-pe!' : '¡Hecho con orgullo en Paraguay!'}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 pyApy - Alojamientos Temporales en Paraguay. Todos los derechos reservados.</p>
            <div className="flex items-center gap-3">
              {!showDevBar && (
                <button
                  onClick={() => setShowDevBar(true)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] underline cursor-pointer"
                >
                  Barra QA / Escenarios
                </button>
              )}
              <div className="flex items-center gap-1">
                <span>Desarrollado para</span>
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
                <span>el verano paraguayo</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialogs & Modals */}
      <PropertyDetailModal />
      <BookingModal />
      <LookupReservationModal />
      <SearchIntentModal />
      <OwnerDashboard />
      <AdminDashboard />
      <AuthModal />
      <FloorPlanModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
