import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { formatGs, SUBSCRIPTION_PLANS } from '../../services/configService';
import { OwnerBooking, Block, Reservation, Property } from '../../types';
import {
  X,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldCheck,
  Crown,
  Download,
  Users,
  Banknote,
  Sparkles,
  Phone,
  FileSpreadsheet
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const {
    isOwnerDashboardOpen,
    setIsOwnerDashboardOpen,
    properties,
    activeProperty,
    setActivePropertyId,
    userSession,
    userName
  } = useApp();

  const [activeTab, setActiveTab] = useState<'calendar' | 'new_booking' | 'new_block' | 'metrics'>('calendar');

  // Authoritative state fetched directly from backend
  const [propReservations, setPropReservations] = useState<Reservation[]>([]);
  const [propOwnerBookings, setPropOwnerBookings] = useState<OwnerBooking[]>([]);
  const [propBlocks, setPropBlocks] = useState<Block[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionError, setActionError] = useState('');

  // New Owner Booking form
  const [obTitle, setObTitle] = useState('');
  const [obGuestName, setObGuestName] = useState('');
  const [obGuests, setObGuests] = useState(8);
  const [obDate, setObDate] = useState(new Date().toISOString().split('T')[0]);
  const [obStartTime, setObStartTime] = useState('09:00');
  const [obEndTime, setObEndTime] = useState('18:30');
  const [obNotes, setObNotes] = useState('');

  // New Block form
  const [blkType, setBlkType] = useState<'maintenance' | 'personal_use' | 'unavailable' | 'other'>('maintenance');
  const [blkReason, setBlkReason] = useState('Limpieza profunda y cambio de agua de la piscina');
  const [blkDate, setBlkDate] = useState(new Date().toISOString().split('T')[0]);
  const [blkStartTime, setBlkStartTime] = useState('08:00');
  const [blkEndTime, setBlkEndTime] = useState('18:00');

  const loadOwnerData = useCallback(async () => {
    if (!activeProperty?.id) return;
    setIsLoadingData(true);
    setActionError('');
    try {
      const [resRes, obRes, blkRes] = await Promise.all([
        ApiClient.getOwnerReservations(activeProperty.id),
        ApiClient.getOwnerBookings(activeProperty.id),
        ApiClient.getOwnerBlocks(activeProperty.id)
      ]);
      if (resRes.data?.reservations) setPropReservations(resRes.data.reservations);
      if (obRes.data?.bookings) setPropOwnerBookings(obRes.data.bookings);
      if (blkRes.data?.blocks) setPropBlocks(blkRes.data.blocks);
    } catch (err: any) {
      console.error('Error cargando datos de anfitrión:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [activeProperty?.id]);

  useEffect(() => {
    if (isOwnerDashboardOpen && activeProperty?.id) {
      loadOwnerData();
    }
  }, [isOwnerDashboardOpen, activeProperty?.id, loadOwnerData]);

  if (!isOwnerDashboardOpen) return null;

  // Isolation: Host can only see and switch between their own properties
  const allowedProperties = userSession.role === 'admin'
    ? properties
    : properties.filter(p => p.ownerId === userSession.id || p.id === userSession.ownerPropertyId);

  // Metrics
  const pyapyBookings = propReservations.filter(r => r.origin === 'pyapy' && r.reservationStatus !== 'cancelled');
  const totalEarnedPyapy = pyapyBookings.reduce((sum, r) => sum + r.totalAmountPyg, 0);

  const handleCreateOwnerBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obTitle.trim()) return;
    setActionError('');

    // Call server endpoint with token authorization
    const apiRes = await ApiClient.createOwnerBooking({
      propertyId: activeProperty.id,
      title: obTitle.trim(),
      guestName: obGuestName.trim() || undefined,
      guestCount: obGuests,
      startDate: obDate,
      startTime: obStartTime,
      endDate: obDate,
      endTime: obEndTime,
      notes: obNotes.trim() || undefined
    });

    if (apiRes.error) {
      setActionError(apiRes.error);
      return;
    }

    setObTitle('');
    setObGuestName('');
    setObNotes('');
    await loadOwnerData();
    setActiveTab('calendar');
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blkReason.trim()) return;
    setActionError('');

    const apiRes = await ApiClient.createBlock({
      propertyId: activeProperty.id,
      type: blkType,
      reason: blkReason.trim(),
      startDate: blkDate,
      startTime: blkStartTime,
      endDate: blkDate,
      endTime: blkEndTime
    });

    if (apiRes.error) {
      setActionError(apiRes.error);
      return;
    }

    await loadOwnerData();
    setActiveTab('calendar');
  };

  const handleDeleteBooking = async (id: string) => {
    setActionError('');
    const res = await ApiClient.deleteOwnerBooking(id);
    if (res.error) {
      setActionError(res.error);
      return;
    }
    await loadOwnerData();
  };

  const handleDeleteBlock = async (id: string) => {
    setActionError('');
    const res = await ApiClient.deleteBlock(id);
    if (res.error) {
      setActionError(res.error);
      return;
    }
    await loadOwnerData();
  };

  const handleExportCsv = async () => {
    setActionError('');
    const blobOrError = await ApiClient.downloadOwnerCsv(activeProperty.id);
    if ('error' in blobOrError) {
      setActionError(blobOrError.error);
      return;
    }
    const url = URL.createObjectURL(blobOrError);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reservas_${activeProperty.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{activeProperty.name}</h2>
                {activeProperty.isVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    Verificado pyApy
                  </span>
                )}
                {activeProperty.subscriptionPlan === 'vip' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    Plan VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Panel Privado del Anfitrión • Calendario Unificado de Disponibilidad
              </p>
            </div>
          </div>

          {/* Property selector (if host owns or manages multiple) */}
          <div className="flex items-center gap-2">
            <select
              value={activeProperty.id}
              onChange={e => setActivePropertyId(e.target.value)}
              className="bg-slate-800 text-xs font-bold text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-hidden cursor-pointer"
            >
              {allowedProperties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsOwnerDashboardOpen(false)}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Nav tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Calendario Unificado ({propReservations.length + propOwnerBookings.length + propBlocks.length})
            </button>
            <button
              onClick={() => setActiveTab('new_booking')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'new_booking' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar Reserva Propia</span>
            </button>
            <button
              onClick={() => setActiveTab('new_block')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'new_block' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bloquear por Mantenimiento</span>
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'metrics' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Métricas pyApy
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                onClick={() => setActionError('')}
                className="text-rose-600 hover:text-rose-900 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}
          {isLoadingData && (
            <div className="p-3 text-center text-xs text-slate-500 font-medium animate-pulse">
              Sincronizando datos con el servidor...
            </div>
          )}

          {/* TAB 1: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Color legend */}
              <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Código de Colores Oficial:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                  <span className="font-bold text-slate-800">Verde: Reserva pyApy (Conseguida por pyApy)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shadow-xs" />
                  <span className="font-bold text-slate-800">Azul: Reserva Externa / Propia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-900 shadow-xs" />
                  <span className="font-bold text-slate-800">Negro: Bloqueo de Mantenimiento</span>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-3">
                {/* 1. pyApy Reservations (Green) */}
                {propReservations.map(res => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-500 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase">
                          Generada por pyApy
                        </span>
                        <span className="font-mono text-xs font-black text-slate-900">
                          {res.locator}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({res.turnName || 'Turno'})
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900">
                        {res.clientName} • <span className="font-normal text-slate-600">{res.clientPhone}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {res.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {res.startTime} a {res.endTime} hs
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          {res.guestCount} personas
                        </span>
                      </div>
                      {res.specialRequests && (
                        <p className="text-xs text-emerald-900 bg-emerald-100/70 p-1.5 rounded-lg">
                          Nota: {res.specialRequests}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-base font-black text-slate-900">
                        {formatGs(res.totalAmountPyg)}
                      </span>
                      <div className="flex gap-1">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          res.reservationStatus === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.reservationStatus === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {res.reservationStatus === 'confirmed'
                            ? 'Confirmada'
                            : res.reservationStatus === 'active'
                            ? 'En Estadía'
                            : res.reservationStatus === 'completed'
                            ? 'Completada'
                            : res.reservationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 2. Owner Bookings (Blue) */}
                {propOwnerBookings.map(ob => (
                  <div
                    key={ob.id}
                    className="p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-500 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                          Reserva Propia / Externa
                        </span>
                        <span className="text-xs font-bold text-slate-900">{ob.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {ob.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {ob.startTime} a {ob.endTime} hs
                        </span>
                        <span>{ob.guestCount} huéspedes</span>
                      </div>
                      {ob.notes && <p className="text-xs text-blue-800">{ob.notes}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteBooking(ob.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Liberar fecha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* 3. Maintenance Blocks (Black) */}
                {propBlocks.map(blk => (
                  <div
                    key={blk.id}
                    className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-amber-300 text-[10px] font-black uppercase">
                          Bloqueo: {blk.type}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{blk.reason}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Fecha: {blk.startDate}</span>
                        <span>Horario: {blk.startTime} a {blk.endTime} hs</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(blk.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Levantar bloqueo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {propReservations.length === 0 && propOwnerBookings.length === 0 && propBlocks.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
                    No hay eventos ni reservas registradas en este momento para esta propiedad.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NEW OWNER BOOKING */}
          {activeTab === 'new_booking' && (
            <form onSubmit={handleCreateOwnerBooking} className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
                <h4 className="font-black text-sm mb-1">Cargar Reserva Directa o Externa</h4>
                <p className="text-xs leading-relaxed">
                  Cargá acá las reservas que recibas por tu cuenta (por recomendación, amigos o directo). pyApy bloqueará automáticamente el horario en el buscador para evitar que te hagan una doble reserva.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título / Identificador de la Reserva *</label>
                <input
                  type="text"
                  required
                  value={obTitle}
                  onChange={e => setObTitle(e.target.value)}
                  placeholder="Ej. Cumpleaños de Sofía / Alquiler Familia Benítez"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Contacto</label>
                  <input
                    type="text"
                    value={obGuestName}
                    onChange={e => setObGuestName(e.target.value)}
                    placeholder="Ej. Sofía Benítez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Huéspedes</label>
                  <input
                    type="number"
                    min={1}
                    value={obGuests}
                    onChange={e => setObGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={obDate}
                    onChange={e => setObDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={obStartTime}
                    onChange={e => setObStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={obEndTime}
                    onChange={e => setObEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={obNotes}
                  onChange={e => setObNotes(e.target.value)}
                  placeholder="Seña recibida por transferencia bancaria..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
              >
                Bloquear este Horario como Reserva Propia
              </button>
            </form>
          )}

          {/* TAB 3: NEW BLOCK */}
          {activeTab === 'new_block' && (
            <form onSubmit={handleCreateBlock} className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-white rounded-2xl">
                <h4 className="font-black text-sm mb-1 text-amber-300">Bloqueo de Mantenimiento o Uso Familiar</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Utilizá esta opción cuando necesites cerrar el predio para reparaciones, limpieza de piscina, fumigación o descanso privado.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo del Bloqueo *</label>
                <select
                  value={blkType}
                  onChange={e => setBlkType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold mb-2 cursor-pointer"
                >
                  <option value="maintenance">🛠️ Mantenimiento preventivo o reparaciones</option>
                  <option value="personal_use">🏡 Uso personal / familiar del propietario</option>
                  <option value="unavailable">🚫 Fuera de servicio temporal</option>
                  <option value="other">📌 Otro motivo</option>
                </select>
                <input
                  type="text"
                  required
                  value={blkReason}
                  onChange={e => setBlkReason(e.target.value)}
                  placeholder="Ej. Pintura de bordes y cambio de filtro de agua"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={blkDate}
                    onChange={e => setBlkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={blkStartTime}
                    onChange={e => setBlkStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={blkEndTime}
                    onChange={e => setBlkEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold cursor-pointer transition-colors shadow-sm"
              >
                Confirmar Bloqueo de Horario
              </button>
            </form>
          )}

          {/* TAB 4: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Reservas pyApy Generadas
                  </span>
                  <p className="text-3xl font-black text-emerald-950">{pyapyBookings.length}</p>
                  <p className="text-[11px] text-emerald-800 font-medium">Clientes confirmados</p>
                </div>
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                    Facturación Directa Generada
                  </span>
                  <p className="text-2xl font-black text-indigo-950">{formatGs(totalEarnedPyapy)}</p>
                  <p className="text-[11px] text-indigo-800 font-medium">100% para el anfitrión</p>
                </div>
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Suscripción Actual
                  </span>
                  <p className="text-xl font-black text-amber-950 uppercase">
                    {SUBSCRIPTION_PLANS[activeProperty.subscriptionPlan]?.name || 'Activo'}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Cuota: {formatGs(SUBSCRIPTION_PLANS[activeProperty.subscriptionPlan]?.monthlyFeePyg || 30000)} / mes
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-black text-slate-900">
                  Beneficios de tu Suscripción pyApy
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {SUBSCRIPTION_PLANS[activeProperty.subscriptionPlan]?.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
