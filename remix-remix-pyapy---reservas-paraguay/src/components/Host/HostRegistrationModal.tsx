import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { PARAGUAY_DEPARTMENTS } from '../../data/paraguayGeography';
import {
  X,
  Building2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { Property } from '../../types';

export const HostRegistrationModal: React.FC = () => {
  const { isHostRegModalOpen, setIsHostRegModalOpen, reloadProperties, setActivePropertyId } = useApp();

  const [propName, setPropName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerCi, setOwnerCi] = useState('');
  const [ownerHomeAddress, setOwnerHomeAddress] = useState('');
  const [department, setDepartment] = useState('Cordillera');
  const [city, setCity] = useState('San Bernardino');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('+595 ');
  const [phoneSecondary, setPhoneSecondary] = useState('+595 ');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isHostRegModalOpen) return null;

  const currentDept = PARAGUAY_DEPARTMENTS.find(d => d.name === department) || PARAGUAY_DEPARTMENTS[0];

  const handleDeptChange = (deptName: string) => {
    setDepartment(deptName);
    const d = PARAGUAY_DEPARTMENTS.find(dept => dept.name === deptName);
    if (d && d.cities.length > 0) {
      setCity(d.cities[0]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!propName || !ownerName || !ownerCi || !phonePrimary || !email || !termsAccepted) {
      setErrorMessage('Por favor completá todos los datos obligatorios y aceptá las condiciones.');
      return;
    }

    const newPropertyId = `prop-custom-${Date.now()}`;
    const newProperty: Property = {
      id: newPropertyId,
      name: propName,
      department,
      city,
      neighborhood: neighborhood || 'Zona Residencial',
      address: address || `${city}, ${department}`,
      hostName: ownerName,
      ownerCi,
      ownerAddress: ownerHomeAddress || 'Asunción, Paraguay',
      hostPhone: phonePrimary,
      hostPhoneSecondary: phoneSecondary,
      hostEmail: email,
      isVerified: false, // Authoritative rule: new host starts unverified, pending admin review
      verificationStatus: 'pending',
      verificationDate: undefined,
      verificationNotes: 'Pendiente de auditoría y verificación documental por el equipo de pyApy',
      isVip: false, // VIP status is never granted automatically
      heroPhoto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
      ],
      description: description || `Hermosa casa quinta y complejo vacacional ubicado en ${city}, ${department}. Totalmente equipado con piscina, quincho con tatakuá y comodidades completas.`,
      rules: [
        'Cuidado estricto de las instalaciones y zonas de piscina',
        'Música a volumen moderado a partir de las 00:00 hs',
        'No tirar colillas ni vidrios al agua'
      ],
      amenities: ['Piscina', 'Quincho con Parrilla', 'Tatakuá tradicional', 'WiFi Fibra', 'Estacionamiento privado', 'Seguridad'],
      rating: 0,
      reviewsCount: 0,
      checkInTime: '10:00',
      checkOutTime: '19:00',
      lat: -25.311,
      lng: -57.296,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(city)}+Paraguay`,
      hasWaitlist: true,
      allowedTurns: [
        {
          id: `t-${newPropertyId}-diurno`,
          name: 'Turno Diurno',
          startTime: '09:00',
          endTime: '18:30',
          pricePyg: 900000,
          description: 'Disfrute pleno del predio durante el día.'
        },
        {
          id: `t-${newPropertyId}-dia-completo`,
          name: 'Día Completo (con noche)',
          startTime: '10:00',
          endTime: '08:00',
          crossesMidnight: true,
          pricePyg: 1500000,
          description: 'Estadía de 22 horas con descanso nocturno.'
        }
      ],
      pricePerDay: 1500000,
      pricePerTurn: 900000,
      units: [
        {
          id: `u-${newPropertyId}-casa`,
          propertyId: newPropertyId,
          unitNumber: '1',
          name: 'Casa Principal con Quincho',
          zoneType: 'casa_principal',
          shape: 'rectangle',
          x: 60,
          y: 80,
          width: 320,
          height: 200,
          capacity: 10,
          status: 'available',
          pricePerDay: 1500000,
          pricePerTurn: 900000,
          cleaningBufferMinutes: 60,
          features: ['3 Dormitorios climatizados', 'Parrilla de acero inox', 'Cocina equipada'],
          description: 'Espacio principal amplio con todas las comodidades de verano.',
          photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
          combinableWith: [`u-${newPropertyId}-piscina`]
        },
        {
          id: `u-${newPropertyId}-piscina`,
          propertyId: newPropertyId,
          unitNumber: '2',
          name: 'Piscina & Solárium',
          zoneType: 'piscina',
          shape: 'pool',
          x: 430,
          y: 90,
          width: 300,
          height: 180,
          capacity: 15,
          status: 'available',
          pricePerDay: 800000,
          pricePerTurn: 500000,
          cleaningBufferMinutes: 30,
          features: ['Agua tratada e iluminación LED', 'Reposeras', 'Duchas exteriores'],
          description: 'Piscina cristalina con solárium atérmico.',
          photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
          combinableWith: [`u-${newPropertyId}-casa`]
        }
      ]
    };

    setIsSubmitting(true);
    try {
      const res = await ApiClient.createProperty(newProperty);
      if (res.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
        return;
      }
      await reloadProperties();
      setActivePropertyId(newPropertyId);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al persistir la propiedad en el servidor autoritativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsHostRegModalOpen(false);
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Link Exclusivo para Alojamientos
              </span>
              <h3 className="text-base font-black tracking-tight">
                Registrar Quinta / Complejo en pyApy
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Protocolo de Verificación y Control Anti-Fraude</strong>
                  <p className="text-emerald-800 mt-0.5">
                    Las publicaciones son validadas por pyApy para resguardar de estafas a los huéspedes paraguayos y extranjeros.
                  </p>
                </div>
              </div>

              {/* Step A: Owner Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  1. Datos del Propietario / Responsable
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Nombre y Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Ing. Carlos Ferreira"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Cédula de Identidad (C.I.) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 3.456.789"
                      value={ownerCi}
                      onChange={(e) => setOwnerCi(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Teléfono Principal (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={phonePrimary}
                      onChange={(e) => setPhonePrimary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Teléfono Secundario / Recepción</label>
                    <input
                      type="tel"
                      value={phoneSecondary}
                      onChange={(e) => setPhoneSecondary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Correo Electrónico Oficial *</label>
                    <input
                      type="email"
                      required
                      placeholder="contacto@miquinta.com.py"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Step B: Property Location */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  2. Datos y Ubicación de la Casa Quinta
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Nombre Comercial de la Quinta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Quinta Bella Vista del Lago"
                      value={propName}
                      onChange={(e) => setPropName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Departamento (Paraguay) *</label>
                    <select
                      value={department}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    >
                      {PARAGUAY_DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">Ciudad *</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    >
                      {currentDept.cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Barrio / Dirección Exacta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bo. Cristóbal Colón, a 300m del Lago"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Descripción y Atractivos</label>
                    <textarea
                      rows={2}
                      placeholder="Contá qué comodidades tiene (tatakuá, piscina infinita, cancha de vóley, sombra de lapacho)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-amber-950">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-amber-600 mt-0.5"
                />
                <span className="text-xs font-semibold leading-relaxed">
                  Declaro ser legítimo propietario o administrador autorizado, y acepto el protocolo de inspección y garantías de no duplicación de reservas de pyApy.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando en servidor autoritativo...' : 'Registrar Alojamiento & Generar Panel Privado'}</span>
              </button>
            </form>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                ¡Alojamiento Registrado con Éxito!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                La propiedad <strong>{propName}</strong> ha sido cargada al catálogo activo con su plano base interactivo. Podés editar sus sectores en cualquier momento desde el Editor de Planos.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Ir a Ver mi Quinta en el Mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
