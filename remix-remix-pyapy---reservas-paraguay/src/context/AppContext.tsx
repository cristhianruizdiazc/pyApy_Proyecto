import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  VisualTheme,
  UserRole,
  LanguageMode,
  Property,
  Sponsor,
  SearchFilterState,
  MatchingResult,
  FloorPlanUnit,
  GroupCombinationOption
} from '../types';
import { AuthService, UserSession } from '../services/authService';
import { ApiClient } from '../services/apiClient';
import { THEMES, ThemeConfig } from '../utils/theme';

interface AppContextType {
  // Theme & Language
  theme: VisualTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: VisualTheme) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;

  // Authentication & Roles
  userSession: UserSession;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  logout: () => void;
  openAuthModal: (initialMode?: 'customer' | 'host' | 'admin') => void;

  // Authoritative Marketplace Data from API / Firestore
  properties: Property[];
  sponsors: Sponsor[];

  // Search & Filtering
  filters: SearchFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  updateFilter: <K extends keyof SearchFilterState>(key: K, value: SearchFilterState[K]) => void;
  toggleAmenityFilter: (amenityName: string) => void;

  // Authoritative Matching Results (Multi-Property) from API / Firestore
  availableMatches: MatchingResult[];
  alternatives: MatchingResult[];
  unavailableMatches: MatchingResult[];

  // Favorites
  favorites: string[];
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;

  // Active Property Detail & Modals
  selectedPropertyForDetail: Property | null;
  setSelectedPropertyForDetail: (property: Property | null) => void;
  selectedPropertyForBooking: Property | null;
  setSelectedPropertyForBooking: (property: Property | null) => void;

  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  isLookupModalOpen: boolean;
  setIsLookupModalOpen: (open: boolean) => void;
  isSearchIntentModalOpen: boolean;
  setIsSearchIntentModalOpen: (open: boolean) => void;
  isOwnerDashboardOpen: boolean;
  setIsOwnerDashboardOpen: (open: boolean) => void;
  isAdminDashboardOpen: boolean;
  setIsAdminDashboardOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'customer' | 'host' | 'admin';
  setAuthModalMode: (mode: 'customer' | 'host' | 'admin') => void;
  isNewPropertyModalOpen: boolean;
  setIsNewPropertyModalOpen: (open: boolean) => void;
  isDevTestingOpen: boolean;
  setIsDevTestingOpen: (open: boolean) => void;
  isFloorPlanModalOpen: boolean;
  setIsFloorPlanModalOpen: (open: boolean) => void;

  // Active Property for Host / Reception (defaults to owner's property or first)
  activeProperty: Property;
  setActivePropertyId: (id: string) => void;

  // Secondary floor plan selection compatibility
  selectedUnitIds: string[];
  setSelectedUnitIds: (ids: string[]) => void;
  toggleUnitSelection: (unitId: string) => void;
  selectedUnits: FloorPlanUnit[];
  groupCombinations: GroupCombinationOption[];

  // Actions & Hydration
  handleResetDemoData: () => Promise<void>;
  handleQuickScenario: (scenario: string) => void;
  reloadProperties: () => Promise<void>;
  reloadSponsors: () => Promise<void>;
  isLoading: boolean;
  isSearching: boolean;
  loadError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<VisualTheme>('sanber');
  const [language, setLanguage] = useState<LanguageMode>('es_gn');

  // User session
  const [userSession, setUserSession] = useState<UserSession>(() => AuthService.getSession());

  useEffect(() => {
    return AuthService.subscribe(sess => setUserSession(sess));
  }, []);

  // Multi-property search filters
  const [filters, setFilters] = useState<SearchFilterState>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      department: 'Cordillera',
      city: 'Todas las ciudades',
      startDate: today,
      startTime: '09:00',
      endDate: today,
      endTime: '18:30',
      bookingType: 'turn_day',
      guestCount: 6,
      maxBudget: undefined,
      selectedAmenities: ['Piscina', 'Quincho con Parrilla']
    };
  });

  // State hydrated exclusively from Backend API / Firestore (authoritative)
  const [properties, setProperties] = useState<Property[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Authoritative Matching Results computed server-side
  const [availableMatches, setAvailableMatches] = useState<MatchingResult[]>([]);
  const [alternatives, setAlternatives] = useState<MatchingResult[]>([]);
  const [unavailableMatches, setUnavailableMatches] = useState<MatchingResult[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active property selection for Host/Admin dashboard
  const [activePropertyId, setActivePropertyId] = useState<string>('');

  // Modals state
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [selectedPropertyForBooking, setSelectedPropertyForBooking] = useState<Property | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isSearchIntentModalOpen, setIsSearchIntentModalOpen] = useState(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'customer' | 'host' | 'admin'>('customer');
  const [isNewPropertyModalOpen, setIsNewPropertyModalOpen] = useState(false);
  const [isDevTestingOpen, setIsDevTestingOpen] = useState(false);
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);

  // Secondary floor plan selection
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Hydrate catalog and sponsors from authoritative Backend API
  const reloadProperties = useCallback(async () => {
    try {
      const res = await ApiClient.getProperties();
      if (res.data?.properties) {
        setProperties(res.data.properties);
        if (res.data.properties.length > 0) {
          setActivePropertyId(prev => prev || res.data!.properties[0].id);
        }
      }
    } catch (err) {
      console.error('Error recargando propiedades desde API:', err);
    }
  }, []);

  const reloadSponsors = useCallback(async () => {
    try {
      const res = await ApiClient.getSponsors();
      if (res.data?.sponsors) {
        setSponsors(res.data.sponsors);
      }
    } catch (err) {
      console.error('Error recargando sponsors desde API:', err);
    }
  }, []);

  // Initial load from authoritative Backend API / Cloud Firestore
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      ApiClient.getProperties(),
      ApiClient.getSponsors(),
      ApiClient.searchProperties(filters)
    ])
      .then(([propsRes, sponsorsRes, searchRes]) => {
        if (!isMounted) return;

        if (propsRes.data?.properties) {
          setProperties(propsRes.data.properties);
          if (propsRes.data.properties.length > 0) {
            setActivePropertyId(prev => prev || propsRes.data!.properties[0].id);
          }
        } else if (propsRes.error) {
          setLoadError(propsRes.error);
        }

        if (sponsorsRes.data?.sponsors) {
          setSponsors(sponsorsRes.data.sponsors);
        }

        if (searchRes.data) {
          setAvailableMatches(searchRes.data.availableMatches || []);
          setAlternatives(searchRes.data.alternatives || []);
          setUnavailableMatches(searchRes.data.unavailableMatches || []);
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error al inicializar datos desde Backend API:', err);
        setLoadError(err.message || 'Error de conexión con el backend autoritativo');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced authoritative search when filters change
  useEffect(() => {
    let isCancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.searchProperties(filters);
        if (!isCancelled && res.data) {
          setAvailableMatches(res.data.availableMatches || []);
          setAlternatives(res.data.alternatives || []);
          setUnavailableMatches(res.data.unavailableMatches || []);
        }
      } catch (err) {
        console.error('Error en búsqueda autoritativa de propiedades:', err);
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  const activeProperty = useMemo(() => {
    if (userSession.role === 'owner' && userSession.ownerPropertyId) {
      const owned = properties.find(p => p.id === userSession.ownerPropertyId);
      if (owned) return owned;
    }
    return properties.find(p => p.id === activePropertyId) || properties[0] || ({} as Property);
  }, [properties, activePropertyId, userSession]);

  const themeConfig = useMemo(() => THEMES[theme] || THEMES.sanber, [theme]);

  const updateFilter = <K extends keyof SearchFilterState>(key: K, value: SearchFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenityFilter = (amenityName: string) => {
    setFilters(prev => {
      const exists = prev.selectedAmenities.includes(amenityName);
      return {
        ...prev,
        selectedAmenities: exists
          ? prev.selectedAmenities.filter(a => a !== amenityName)
          : [...prev.selectedAmenities, amenityName]
      };
    });
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev =>
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    );
  };

  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId);
  };

  const openAuthModal = (mode: 'customer' | 'host' | 'admin' = 'customer') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const logout = () => {
    AuthService.logout();
    setIsOwnerDashboardOpen(false);
    setIsAdminDashboardOpen(false);
  };

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const selectedUnits = useMemo(() => {
    if (!activeProperty?.units) return [];
    return activeProperty.units.filter(u => selectedUnitIds.includes(u.id));
  }, [activeProperty, selectedUnitIds]);

  const groupCombinations = useMemo(() => {
    if (!activeProperty?.units || activeProperty.units.length === 0) return [];
    return [
      {
        id: 'combo_all',
        name: 'Predio Completo Exclusivo',
        unitIds: activeProperty.units.map(u => u.id),
        totalCapacity: activeProperty.capacity,
        totalPricePerDay: activeProperty.pricePerDay,
        totalPricePerTurn: activeProperty.pricePerTurn,
        description: 'Acceso privado e ilimitado a todas las dependencias del alojamiento.'
      }
    ];
  }, [activeProperty]);

  const handleResetDemoData = async () => {
    try {
      await ApiClient.resetDevDemoData();
    } catch (err) {
      console.error('Error al solicitar reset demo:', err);
    }
    await reloadProperties();
    await reloadSponsors();
    try {
      const res = await ApiClient.searchProperties(filters);
      if (res.data) {
        setAvailableMatches(res.data.availableMatches || []);
        setAlternatives(res.data.alternatives || []);
        setUnavailableMatches(res.data.unavailableMatches || []);
      }
    } catch {}
    setSelectedUnitIds([]);
  };

  const handleQuickScenario = (scenario: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (scenario === 'pareja_escapada') {
      setFilters(prev => ({
        ...prev,
        department: 'Cordillera',
        city: 'Altos',
        guestCount: 2,
        bookingType: 'turn_day',
        startDate: today,
        endDate: today
      }));
    } else if (scenario === 'familia_asado') {
      setFilters(prev => ({
        ...prev,
        department: 'Cordillera',
        city: 'San Bernardino',
        guestCount: 8,
        bookingType: 'turn_day',
        startDate: today,
        endDate: today
      }));
    } else if (scenario === 'grupo_amigos') {
      setFilters(prev => ({
        ...prev,
        department: 'Cordillera',
        city: 'Piribebuy',
        guestCount: 15,
        bookingType: 'turn_day',
        startDate: today,
        endDate: today
      }));
    } else if (scenario === 'evento_grande') {
      setFilters(prev => ({
        ...prev,
        department: 'Central',
        city: 'Areguá',
        guestCount: 35,
        bookingType: 'turn_day',
        startDate: today,
        endDate: today
      }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme,
        language,
        setLanguage,
        userSession,
        userRole: userSession.role,
        userName: userSession.name,
        userEmail: userSession.email,
        isLoggedIn: userSession.isLoggedIn,
        logout,
        openAuthModal,
        properties,
        sponsors,
        filters,
        setFilters,
        updateFilter,
        toggleAmenityFilter,
        availableMatches,
        alternatives,
        unavailableMatches,
        favorites,
        toggleFavorite,
        isFavorite,
        selectedPropertyForDetail,
        setSelectedPropertyForDetail,
        selectedPropertyForBooking,
        setSelectedPropertyForBooking,
        isBookingModalOpen,
        setIsBookingModalOpen,
        isLookupModalOpen,
        setIsLookupModalOpen,
        isSearchIntentModalOpen,
        setIsSearchIntentModalOpen,
        isOwnerDashboardOpen,
        setIsOwnerDashboardOpen,
        isAdminDashboardOpen,
        setIsAdminDashboardOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isNewPropertyModalOpen,
        setIsNewPropertyModalOpen,
        isDevTestingOpen,
        setIsDevTestingOpen,
        isFloorPlanModalOpen,
        setIsFloorPlanModalOpen,
        activeProperty,
        setActivePropertyId,
        selectedUnitIds,
        setSelectedUnitIds,
        toggleUnitSelection,
        selectedUnits,
        groupCombinations,
        handleResetDemoData,
        handleQuickScenario,
        reloadProperties,
        reloadSponsors,
        isLoading,
        isSearching,
        loadError
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
