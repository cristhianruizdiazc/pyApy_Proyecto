import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Users, User, UsersRound, CalendarX, ShieldAlert, RotateCcw } from 'lucide-react';

export const TestingScenariosBar: React.FC = () => {
  const { handleQuickScenario, handleResetDemoData, filters } = useApp();

  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-3 border-b border-slate-800 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-semibold text-amber-300">Escenarios de Prueba Demo:</span>
          <span className="hidden sm:inline text-slate-400">(Criterios de Aceptación pyApy)</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleQuickScenario('2_couples')}
            title="Prueba para 2 personas: Bungalow Romántico"
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              filters.guestCount === 2
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            <span>2 Pers. (Pareja)</span>
          </button>

          <button
            onClick={() => handleQuickScenario('6_family')}
            title="Prueba para 6 personas: Casa Quinta Familiar"
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              filters.guestCount === 6
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>6 Pers. (Familia)</span>
          </button>

          <button
            onClick={() => handleQuickScenario('10_friends')}
            title="Prueba para 10 personas: Combinación Inteligente"
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              filters.guestCount === 10
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <UsersRound className="w-3 h-3" />
            <span>10 Pers. (Combinación)</span>
          </button>

          <button
            onClick={() => handleQuickScenario('15_event')}
            title="Prueba para 15-20 personas: Gran Evento Multizona"
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium ${
              filters.guestCount >= 15
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>15-20 Pers. (Evento)</span>
          </button>

          <button
            onClick={() => handleQuickScenario('sold_out')}
            title="Simular saturación para activar alternativas y Lista de Espera"
            className="px-2.5 py-1 rounded-md bg-rose-900/60 text-rose-200 hover:bg-rose-800 transition-all flex items-center gap-1 font-medium border border-rose-700/50"
          >
            <CalendarX className="w-3 h-3" />
            <span>Sin Cupo (Lista Espera)</span>
          </button>

          <button
            onClick={() => handleQuickScenario('double_booking')}
            title="Testear la prevención de doble reserva atómica"
            className="px-2.5 py-1 rounded-md bg-amber-900/60 text-amber-200 hover:bg-amber-800 transition-all flex items-center gap-1 font-medium border border-amber-700/50"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Test Doble Reserva</span>
          </button>

          <button
            onClick={handleResetDemoData}
            title="Restablecer datos originales de prueba"
            className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1 ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reiniciar Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
