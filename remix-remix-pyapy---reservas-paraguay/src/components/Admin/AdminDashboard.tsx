import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { formatGs, SUBSCRIPTION_PLANS } from '../../services/configService';
import { VerificationStatus, SubscriptionPlanId, Reservation, SearchIntent, AuditLog, Sponsor } from '../../types';
import {
  X,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Tag,
  Flame,
  Phone,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminDashboardOpen,
    setIsAdminDashboardOpen,
    properties,
    sponsors,
    handleResetDemoData,
    reloadProperties,
    userName
  } = useApp();

  const [activeTab, setActiveTab] = useState<'properties' | 'reservations' | 'demand' | 'plans' | 'sponsors' | 'audit'>('properties');
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');

  const [adminReservations, setAdminReservations] = useState<Reservation[]>([]);
  const [adminSearchIntents, setAdminSearchIntents] = useState<SearchIntent[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>([]);
  const [adminSponsors, setAdminSponsors] = useState<Sponsor[]>([]);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  useEffect(() => {
    if (!isAdminDashboardOpen) return;

    let isMounted = true;
    const fetchAdminData = async () => {
      setIsLoadingTab(true);
      try {
        if (activeTab === 'reservations') {
          const res = await ApiClient.getOwnerReservations();
          if (res.data?.reservations && isMounted) {
            setAdminReservations(res.data.reservations);
          }
        } else if (activeTab === 'demand') {
          const res = await ApiClient.getSearchIntents();
          if (res.data?.searchIntents && isMounted) {
            setAdminSearchIntents(res.data.searchIntents);
          }
        } else if (activeTab === 'audit') {
          const res = await ApiClient.getAuditLogs();
          if (res.data?.auditLogs && isMounted) {
            setAdminAuditLogs(res.data.auditLogs);
          }
        } else if (activeTab === 'sponsors') {
          const res = await ApiClient.getSponsors();
          if (res.data?.sponsors && isMounted) {
            setAdminSponsors(res.data.sponsors);
          }
        }
      } catch (err) {
        console.error('Error cargando datos del panel admin:', err);
      } finally {
        if (isMounted) setIsLoadingTab(false);
      }
    };

    fetchAdminData();
    return () => {
      isMounted = false;
    };
  }, [isAdminDashboardOpen, activeTab]);

  const handleToggleSponsor = async (sponsorId: string) => {
    try {
      const res = await ApiClient.toggleSponsor(sponsorId);
      if (res.data?.sponsor) {
        setAdminSponsors(prev =>
          prev.map(s => (s.id === sponsorId ? res.data!.sponsor : s))
        );
      }
    } catch (err) {
      console.error('Error alternando sponsor:', err);
    }
  };

  if (!isAdminDashboardOpen) return null;

  const handleVerificationChange = async (propId: string, status: VerificationStatus) => {
    try {
      const res = await ApiClient.updateVerification(propId, status, 'Verificación administrativa pyApy');
      if (res.error) {
        alert(res.error);
        return;
      }
      await reloadProperties();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar verificación');
    }
  };

  const handlePlanChange = async (propId: string, plan: SubscriptionPlanId) => {
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      try {
        const res = await ApiClient.createProperty({ ...prop, subscriptionPlan: plan });
        if (res.error) {
          alert(res.error);
          return;
        }
        await reloadProperties();
      } catch (err: any) {
        alert(err.message || 'Error al actualizar plan');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Portal de Administración pyApy</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verificaciones Anti-Estafas • Radar de Demanda • Gestión de Alojamientos en Paraguay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('¿Restaurar los datos de demostración al estado original?')) {
                  handleResetDemoData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              title="Restaurar datos iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Demo</span>
            </button>
            <button
              onClick={() => setIsAdminDashboardOpen(false)}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'properties' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Alojamientos & Verificación ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reservations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Reservas Oficiales ({adminReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('demand')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'demand' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Demanda Insatisfecha ({adminSearchIntents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plans' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Planes de Monetización
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sponsors' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sponsors Locales ({sponsors.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoría ({adminAuditLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. PROPERTIES & VERIFICATION */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-slate-900 mb-0.5">
                    Independencia Estricta de Verificación Anti-Estafas
                  </h4>
                  <p className="leading-relaxed">
                    En pyApy, la verificación de una quinta (sello verde de confianza) es un proceso de auditoría física o documental riguroso. Un anfitrión <strong>NO puede comprar la verificación</strong> simplemente pagando un plan; debe ser inspeccionado y aprobado por el equipo de pyApy.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {properties.map(p => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{p.name}</h4>
                        <span className="text-xs text-slate-500 font-bold">
                          ({p.city}, {p.department})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.verificationStatus === 'pending_review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {p.verificationStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Anfitrión: <strong>{p.hostName}</strong> • Tel: {p.hostPhone} • Plan:{' '}
                        <strong className="uppercase">{p.subscriptionPlan}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ref: {p.approximateReference}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.verificationStatus !== 'verified' ? (
                        <button
                          onClick={() => handleVerificationChange(p.id, 'verified')}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprobar Verificación Oficial</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerificationChange(p.id, 'pending_review')}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Poner en Revisión</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Listado Maestro de Reservas de Paraguay
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Todas con origen certificado 'pyapy'
                </span>
              </div>

              {isLoadingTab ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando reservas autoritativas...</div>
              ) : adminReservations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">No hay reservas registradas en el sistema.</div>
              ) : (
                <div className="space-y-3">
                  {adminReservations.map(r => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {r.locator}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            {r.reservationStatus}
                          </span>
                        </div>
                        <span className="text-base font-black text-slate-900">
                          {formatGs(r.totalAmountPyg)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                        <div>
                          <span className="font-bold block text-slate-900">{r.propertyName}</span>
                          <span>Fecha: {r.startDate} ({r.startTime} a {r.endTime} hs)</span>
                        </div>
                        <div>
                          <span>Cliente: <strong>{r.clientName}</strong></span>
                          <span className="block">Doc: {r.clientDoc} • Tel: {r.clientPhone}</span>
                        </div>
                        <div>
                          <span>Huéspedes: <strong>{r.guestCount}</strong></span>
                          <span className="block text-emerald-700 font-bold">Origen: {r.origin}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. DEMANDA INSATISFECHA (SEARCH INTENTS) */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-1">
                <h4 className="font-black text-sm mb-1 text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Radar Comercial de Demanda Insatisfecha</span>
                </h4>
                <p className="leading-relaxed">
                  Cada vez que un cliente busca una fecha y no encuentra disponibilidad, o presiona "Avísame cuando aparezca una opción", queda registrado acá. Esta información permite a pyApy captar nuevos anfitriones en las zonas más solicitadas.
                </p>
              </div>

              {isLoadingTab ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando radar de demanda...</div>
              ) : adminSearchIntents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">No hay registros de demanda insatisfecha.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminSearchIntents.map(si => (
                    <div
                      key={si.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-indigo-700">
                          Zona solicitada: {si.city || si.department}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(si.createdAt).toLocaleDateString('es-PY')}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-700">
                        <p>Fecha deseada: <strong>{si.date || 'Flexible'}</strong></p>
                        <p>Huéspedes: <strong>{si.guestCount} personas</strong></p>
                        {si.maxBudget && <p>Presupuesto máx: <strong>{formatGs(si.maxBudget)}</strong></p>}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{si.contactPhone}</span>
                          </span>
                          {si.contactPhone && (
                            <a
                              href={`https://wa.me/${si.contactPhone.replace(/[^0-9]/g, '')}?text=Hola,%20nos%20comunicamos%20desde%20pyApy%20sobre%20tu%20búsqueda%20de%20quinta%20en%20${si.department}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                            >
                              Contactar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. PLANS & MONETIZATION */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]).map(planKey => {
                  const plan = SUBSCRIPTION_PLANS[planKey];
                  return (
                    <div
                      key={plan.id}
                      className="p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                          {plan.badge}
                        </span>
                        <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900">
                            {formatGs(plan.monthlyFeePyg)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ mes</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modify property plan */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-black text-sm text-slate-900">Asignar Plan a Alojamiento</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedPropId}
                    onChange={e => setSelectedPropId(e.target.value)}
                    className="p-2 bg-white rounded-xl border border-slate-200 font-bold"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Actualmente: {p.subscriptionPlan})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlanChange(selectedPropId, 'activo')}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer"
                    >
                      Plan Activo (Gs. 30.000)
                    </button>
                    <button
                      onClick={() => handlePlanChange(selectedPropId, 'verificado')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                    >
                      Plan Verificado (Gs. 50.000)
                    </button>
                    <button
                      onClick={() => handlePlanChange(selectedPropId, 'vip')}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer"
                    >
                      Plan VIP (Gs. 100.000)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SPONSORS */}
          {activeTab === 'sponsors' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {(adminSponsors.length > 0 ? adminSponsors : sponsors).map(sp => (
                  <div
                    key={sp.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">{sp.title}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {sp.badge}
                        </span>
                      </div>
                      <p className="text-slate-600">{sp.desc}</p>
                      <p className="text-slate-400">Contacto: {sp.contactPhone}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSponsor(sp.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        sp.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {sp.isActive ? 'Activo en Web' : 'Inactivo'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              {isLoadingTab ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando registro de auditoría...</div>
              ) : adminAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">No hay eventos registrados en la auditoría.</div>
              ) : (
                adminAuditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 font-mono text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700 text-[9px] uppercase">
                          {log.actorRole}: {log.actorName}
                        </span>
                      </div>
                      <p className="text-slate-600 font-sans">{log.details}</p>
                    </div>
                    <span className="text-slate-400 text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('es-PY')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
