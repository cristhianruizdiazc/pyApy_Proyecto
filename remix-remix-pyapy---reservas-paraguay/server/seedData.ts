import { Property, Reservation, OwnerBooking, Block, SearchIntent, Sponsor } from '../src/types';

export const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-sanber-sol-brisa',
    name: 'Quinta Sanber Sol & Brisa',
    department: 'Cordillera',
    city: 'San Bernardino',
    neighborhood: 'Zona Ciervo Cuá / Anfiteatro',
    approximateReference: 'A 900 metros del Lago Ypacaraí y a 3 minutos del Anfiteatro José Asunción Flores.',
    heroPhoto: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Hermosa casa quinta campestre en San Bernardino con vista al lago. Cuenta con piscina de borde infinito, quincho climatizado con parrilla de acero inoxidable y tatakuá artesanal para asados tradicionales, cancha de piki-vóley y amplio parque arbolado.',
    descriptionGn: 'Kóga neporãva Ypacaraí ysyry rembe\'ýpe. Ijyvytu porã, heta yvyra, ykua guasu, quincho asado apo ha tatakuá mba\'e ry\'irõme g̃uarã.',
    ownerId: 'owner-carlos-benitez',
    hostName: 'Carlos Benítez & Lorena Valenzuela',
    hostPhone: '+595 981 554 220',
    hostEmail: 'sanber.solybrisa@pyapy.com.py',
    isVerified: true,
    verificationStatus: 'verified',
    verificationDate: '2026-01-15',
    subscriptionPlan: 'vip',
    subscriptionStatus: 'active',
    rating: 4.9,
    reviewsCount: 14,
    capacity: 25,
    minCapacity: 4,
    pricePerDay: 1800000,
    pricePerTurn: 1200000,
    checkInTime: '09:00',
    checkOutTime: '19:00',
    allowedTurns: [
      {
        id: 'turn-sb-dia',
        name: 'Turno Diurno (Pasadía)',
        startTime: '09:00',
        endTime: '18:30',
        crossesMidnight: false,
        pricePyg: 1200000,
        description: 'Ideal para asado con pileta y tereré rupa durante el día.'
      },
      {
        id: 'turn-sb-noche',
        name: 'Turno Nocturno (Velada de Verano)',
        startTime: '20:00',
        endTime: '06:00',
        crossesMidnight: true,
        pricePyg: 1400000,
        description: 'Piscina iluminada con fogón y parrillada nocturna.'
      },
      {
        id: 'turn-sb-completo',
        name: 'Día Completo (24hs)',
        startTime: '10:00',
        endTime: '10:00',
        crossesMidnight: true,
        pricePyg: 1800000,
        description: 'Estadía de 24 horas con acceso completo a bungalows y dependencias.'
      }
    ],
    amenities: [
      'Piscina',
      'Quincho con Parrilla',
      'Tatakuá a Leña',
      'Aire Acondicionado',
      'WiFi Starlink',
      'Cancha (Piki / Fútbol)',
      'Pet Friendly',
      'Estacionamiento Amplio'
    ],
    rules: [
      'Prohibido el uso de envases de vidrio dentro del agua de la piscina.',
      'Música a volumen moderado respetando ordenanza municipal de San Bernardino.',
      'Mascotas educadas permitidas en áreas exteriores de césped.'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/quinta_sanber_sol',
      facebook: 'https://facebook.com/QuintaSanberSolYBrisa',
      tiktok: 'https://tiktok.com/@quinta_sanber_sol'
    },
    hasWaitlist: true
  },
  {
    id: 'prop-altos-el-remanso',
    name: 'Quinta El Remanso de los Cerros',
    department: 'Cordillera',
    city: 'Altos',
    neighborhood: 'Ruta Altos-Atyrá Km 4',
    approximateReference: 'Ubicada sobre serranías de Altos, con brisa fresca panorámica y acceso asfaltado.',
    heroPhoto: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'En lo alto de la cordillera con clima fresco todo el año. Quincho rústico con tatakuá de barro para asados tradicionales, piscina de piedra con cascada y mirador para disfrutar del atardecer paraguayo.',
    descriptionGn: 'Yvytu ro\'ysã porã Altos yvateguápe. Ykua ita apytépe ha tatakuá mba\'e he\'ẽva apo hag̃ua.',
    ownerId: 'owner-mario-benitez',
    hostName: 'Don Mario Benítez Bogado',
    hostPhone: '+595 982 771 900',
    hostEmail: 'elremanso.altos@pyapy.com.py',
    isVerified: true,
    verificationStatus: 'verified',
    verificationDate: '2026-02-01',
    subscriptionPlan: 'verificado',
    subscriptionStatus: 'active',
    rating: 4.85,
    reviewsCount: 9,
    capacity: 18,
    minCapacity: 2,
    pricePerDay: 1300000,
    pricePerTurn: 850000,
    checkInTime: '08:30',
    checkOutTime: '18:30',
    allowedTurns: [
      {
        id: 'turn-alt-dia',
        name: 'Turno Diurno',
        startTime: '08:30',
        endTime: '18:30',
        crossesMidnight: false,
        pricePyg: 850000,
        description: 'Asado campestre, pileta de manantial y descanso.'
      },
      {
        id: 'turn-alt-completo',
        name: 'Día Completo (24hs)',
        startTime: '09:00',
        endTime: '09:00',
        crossesMidnight: true,
        pricePyg: 1300000,
        description: 'Día completo con cabaña serrana.'
      }
    ],
    amenities: [
      'Piscina',
      'Quincho con Parrilla',
      'Tatakuá a Leña',
      'WiFi Starlink',
      'Pet Friendly',
      'Estacionamiento Amplio'
    ],
    rules: [
      'No encender fogatas fuera de los sectores habilitados.',
      'Cuidar los árboles frutales y vegetación nativa.'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/elremanso_altos',
      facebook: 'https://facebook.com/ElRemansoAltos'
    },
    hasWaitlist: true
  },
  {
    id: 'prop-aregua-laguna-azul',
    name: 'Complejo & Quinta Laguna Azul',
    department: 'Central',
    city: 'Areguá',
    neighborhood: 'Zona Costa Lago / Kokue Guazú',
    approximateReference: 'A 5 minutos de la iglesia de Areguá y de las alfarerías tradicionales.',
    heroPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Complejo amplio con piscina semiolímpica, salón climatizado cerrado para eventos familiares y cumpleaños, quincho con parrilla gigante y parque infantil con césped.',
    descriptionGn: 'Tenda guasu vy\'arã Areguápe. Ogaguasu tuicháva, ykua hechapyrãva ha yvotyty iporãmbajepéva.',
    ownerId: 'owner-gladys-galeano',
    hostName: 'Lic. Gladys Galeano',
    hostPhone: '+595 972 334 118',
    hostEmail: 'laguna.azul@pyapy.com.py',
    isVerified: true,
    verificationStatus: 'verified',
    verificationDate: '2026-01-20',
    subscriptionPlan: 'vip',
    subscriptionStatus: 'active',
    rating: 4.92,
    reviewsCount: 16,
    capacity: 50,
    minCapacity: 10,
    pricePerDay: 2500000,
    pricePerTurn: 1600000,
    checkInTime: '10:00',
    checkOutTime: '20:00',
    allowedTurns: [
      {
        id: 'turn-are-dia',
        name: 'Turno Diurno',
        startTime: '10:00',
        endTime: '19:00',
        crossesMidnight: false,
        pricePyg: 1600000,
        description: 'Pileta olímpica, salón y quincho para grandes grupos.'
      },
      {
        id: 'turn-are-completo',
        name: 'Día Completo (24hs)',
        startTime: '11:00',
        endTime: '11:00',
        crossesMidnight: true,
        pricePyg: 2500000,
        description: 'Uso integral del predio con salón de eventos.'
      }
    ],
    amenities: [
      'Piscina',
      'Quincho con Parrilla',
      'Tatakuá a Leña',
      'Aire Acondicionado',
      'Cancha (Piki / Fútbol)',
      'Estacionamiento Amplio',
      'Generador Eléctrico'
    ],
    rules: [
      'Se requiere firma de comodato para el uso de equipos de audio.',
      'Capacidad máxima respetada estrictamente.'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/lagunaazul_aregua',
      tiktok: 'https://tiktok.com/@lagunaazul_aregua'
    },
    hasWaitlist: true
  },
  {
    id: 'prop-piribebuy-renda',
    name: 'Quinta & Cabañas Piribebuy Renda',
    department: 'Cordillera',
    city: 'Piribebuy',
    neighborhood: 'Zona Paso Hu / Arroyo Cristalino',
    approximateReference: 'Bajada directa a orillas del Arroyo Piribebuy con aguas transparentes y lecho de piedras.',
    heroPhoto: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Naturaleza viva con acceso directo al arroyo Piribebuy de aguas cristalinas sobre fondo de piedras. Cabañas rústicas de troncos, quincho costero con tatakuá de leña y fogón nocturno para tereré rupa y guitarreadas.',
    descriptionGn: 'Arroyo Piribebuy ysyry sakã porãite. Yvyra apytépe rehasa hag̃ua pyhare ha araka\'eve nderesaráiri.',
    ownerId: 'owner-esteban-rolon',
    hostName: 'Esteban Rolón Agüero',
    hostPhone: '+595 983 404 990',
    hostEmail: 'piribebuy.renda@pyapy.com.py',
    isVerified: true,
    verificationStatus: 'verified',
    verificationDate: '2026-02-10',
    subscriptionPlan: 'activo',
    subscriptionStatus: 'active',
    rating: 4.88,
    reviewsCount: 7,
    capacity: 15,
    minCapacity: 2,
    pricePerDay: 1100000,
    pricePerTurn: 750000,
    checkInTime: '09:00',
    checkOutTime: '18:00',
    allowedTurns: [
      {
        id: 'turn-pir-dia',
        name: 'Turno Diurno Costero',
        startTime: '09:00',
        endTime: '18:00',
        crossesMidnight: false,
        pricePyg: 750000,
        description: 'Quincho, tatakuá y bajada al arroyo durante el día.'
      },
      {
        id: 'turn-pir-noche',
        name: 'Turno Nocturno Fogón',
        startTime: '19:30',
        endTime: '07:00',
        crossesMidnight: true,
        pricePyg: 850000,
        description: 'Fogón bajo las estrellas junto al murmullo del arroyo.'
      }
    ],
    amenities: [
      'Acceso a Arroyo',
      'Piscina',
      'Quincho con Parrilla',
      'Tatakuá a Leña',
      'Pet Friendly',
      'Estacionamiento Amplio'
    ],
    rules: [
      'Prohibido arrojar basura o botellas en el curso de agua.',
      'Cuidado con la fogata en noches de viento.'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/piribebuy_renda_py',
      youtube: 'https://youtube.com/@piribebuyrenda'
    },
    hasWaitlist: true
  },
  {
    id: 'prop-paraguari-cerro-hu',
    name: 'Estancia & Quinta Cerro Hû',
    department: 'Paraguarí',
    city: 'Paraguarí',
    neighborhood: 'Faldas del Cerro Hû',
    approximateReference: 'A 2 km de la Ruta 1 con vista imponente a los cerros históricos de Paraguarí.',
    heroPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Espacio campestre rodeado de serranías y aire puro. Cuenta con piscina rústica, quincho techado con asador criollo a la estaca, cancha de fútbol y senderismo en la falda del cerro.',
    descriptionGn: 'Yvyty Cerro Hû guýpe, py\'aguapy ha vy\'a oñondivepa.',
    ownerId: 'owner-patricia-duarte',
    hostName: 'Patricia Duarte & Familia',
    hostPhone: '+595 981 332 100',
    hostEmail: 'cerrohu.quinta@pyapy.com.py',
    isVerified: false,
    verificationStatus: 'pending_review',
    subscriptionPlan: 'activo',
    subscriptionStatus: 'active',
    rating: 0, // New property: strictly 0 rating, no fake 5.0!
    reviewsCount: 0,
    capacity: 20,
    minCapacity: 4,
    pricePerDay: 950000,
    pricePerTurn: 600000,
    checkInTime: '08:00',
    checkOutTime: '18:00',
    allowedTurns: [
      {
        id: 'turn-ch-dia',
        name: 'Turno Diurno de Campo',
        startTime: '08:00',
        endTime: '18:00',
        crossesMidnight: false,
        pricePyg: 600000,
        description: 'Día de campo con asado y pileta al pie del cerro.'
      }
    ],
    amenities: [
      'Piscina',
      'Quincho con Parrilla',
      'Tatakuá a Leña',
      'Cancha (Piki / Fútbol)',
      'Pet Friendly',
      'Estacionamiento Amplio'
    ],
    rules: [
      'Respetar senderos delimitados.',
      'Apagar brasas del asador antes de retirarse.'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/quinta_cerrohu_py'
    },
    hasWaitlist: false
  }
];

export const SEED_RESERVATIONS: Reservation[] = [
  {
    id: 'res_seed_001',
    locator: 'PY-2026-QK894',
    propertyId: 'prop-sanber-sol-brisa',
    propertyName: 'Quinta Sanber Sol & Brisa',
    ownerId: 'owner-carlos-benitez',
    clientName: 'Raúl Martínez Fleitas',
    clientDoc: '3.421.905',
    clientPhone: '+595 981 445 670',
    clientEmail: 'raul.martinez@gmail.com',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '18:30',
    crossesMidnight: false,
    turnId: 'turn-sb-dia',
    turnName: 'Turno Diurno (Pasadía)',
    bookingType: 'turn_day',
    guestCount: 8,
    totalAmountPyg: 1200000,
    currency: 'PYG',
    origin: 'pyapy', // Generated by pyApy
    reservationStatus: 'confirmed',
    paymentStatus: 'paid',
    specialRequests: 'Llegamos a las 09:30 hs. Solicitamos leña para el tatakuá.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    ownerNotified: true,
    auditTrail: [
      {
        action: 'RESERVA_CREADA_PYAPY',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        actor: 'Cliente: Raúl Martínez Fleitas',
        notes: 'Reserva confirmada mediante pyApy. Origen verificado pyApy.'
      }
    ]
  }
];

export const SEED_OWNER_BOOKINGS: OwnerBooking[] = [
  {
    id: 'ob_seed_001',
    propertyId: 'prop-altos-el-remanso',
    ownerId: 'owner-mario-benitez',
    title: 'Cumpleaños de 15 Privado (Reserva Directa del Anfitrión)',
    guestName: 'Familia González Cabral',
    guestCount: 16,
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:30',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '18:30',
    crossesMidnight: false,
    notes: 'Reserva particular coordinada en persona con Don Mario.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

export const SEED_BLOCKS: Block[] = [
  {
    id: 'blk_seed_001',
    propertyId: 'prop-aregua-laguna-azul',
    ownerId: 'owner-gladys-galeano',
    type: 'maintenance',
    reason: 'Pintura y cambio de filtros de la piscina semiolímpica.',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '19:00',
    crossesMidnight: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const SEED_SEARCH_INTENTS: SearchIntent[] = [
  {
    id: 'si_seed_001',
    date: '2026-09-19',
    guestCount: 5,
    department: 'Cordillera',
    city: 'Piribebuy',
    maxBudget: 1000000,
    requestedFeatures: ['Piscina', 'Quincho con Parrilla'],
    contactPhone: '+595 981 998 877',
    contactEmail: 'escapada.piribebuy@gmail.com',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'active'
  }
];

export const SEED_SPONSORS: Sponsor[] = [
  {
    id: 'spons-asado',
    title: '🍖 "Asado Don Ramón" - Parrillada & Tatakuá a Domicilio',
    category: 'gastronomia',
    desc: 'Costillar premium, asado a la estaca, sopa paraguaya artesanal y mandioca caliente directo en tu quinta reservada.',
    ctaText: 'Pedir Menú por WhatsApp',
    badge: 'Gastronomía para Quintas',
    contactPhone: '+595 981 990 120',
    isActive: true
  },
  {
    id: 'spons-terere',
    title: '🌿 Yerba Mate "Kurupí" & Termos Forrados en Cuero',
    category: 'bebidas',
    desc: 'Kit de tereré con hielo y pohã ñana fresco (menta\'i, mburucuyá, santa lucía) para tu estadía de verano.',
    ctaText: 'Ver Puntos de Venta',
    badge: 'Tereré Rupa Oficial',
    contactPhone: '+595 971 445 800',
    isActive: true
  },
  {
    id: 'spons-inflables',
    title: '🏰 "Diversión Sanber" - Alquiler de Inflables & Sonido',
    category: 'actividades',
    desc: 'Toboganes acuáticos gigantes para piscinas, camas elásticas, gazebos y sonido profesional para quintas.',
    ctaText: 'Consultar Fechas Disponibles',
    badge: 'Entrega en Cordillera & Central',
    contactPhone: '+595 983 221 440',
    isActive: true
  }
];
