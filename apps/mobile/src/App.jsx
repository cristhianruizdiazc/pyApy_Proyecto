import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { WebView } from "react-native-webview";
import { createClient } from "@pyapy/contracts/client";
import { localInterval, money } from "@pyapy/contracts";
import { synchronize } from "@pyapy/contracts/offline";
const BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4100/api/v1";
const origin = new URL(BASE).origin;
const imageUrl = (p) =>
  p.images?.[0]?.url ? `${origin}${p.images[0].url}` : null;
const cacheKey = (id) => `pyapy.private.${id}`;
const emptyState = () => ({ bookings: [], favorites: [], queue: [] });
function Button({ title, icon, onPress, disabled, secondary = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.5 }]}
    >
      {icon && (
        <Feather
          name={icon}
          size={17}
          color={secondary ? "#194b3b" : "white"}
        />
      )}
      <Text style={[s.buttonText, secondary && { color: "#194b3b" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function Field({ label, value, onChangeText, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8a9387"
        {...props}
      />
    </View>
  );
}
function Property({ p, onSelect, onFavorite, favorite }) {
  return (
    <View style={s.property}>
      <Pressable
        onPress={() => onSelect(p)}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${p.name}`}
      >
        {imageUrl(p) ? (
          <Image source={{ uri: imageUrl(p) }} style={s.photo} />
        ) : (
          <View style={[s.photo, s.placeholder]}>
            <Feather name="image" size={30} color="#73806a" />
          </View>
        )}
        <View style={s.propertyBody}>
          <Text style={s.meta}>
            {p.kind} · {p.capacity} personas{p.isDemo ? " · Demo" : ""}
          </Text>
          <Text style={s.propertyName}>{p.name}</Text>
          <Text style={s.muted}>{p.city}</Text>
          <Text style={s.price}>
            Gs. {money(p.pricePerHour)} <Text style={s.muted}>/ hora</Text>
          </Text>
        </View>
      </Pressable>
      {onFavorite && (
        <Pressable
          style={s.favorite}
          onPress={() => onFavorite(p)}
          accessibilityLabel={favorite ? "Quitar favorito" : "Guardar favorito"}
        >
          <Feather
            name="heart"
            size={20}
            color={favorite ? "#bc513e" : "#194b3b"}
          />
        </Pressable>
      )}
    </View>
  );
}
function MapView({ items, onSelect }) {
  const points = items.map((p) => [Number(p.latitude), Number(p.longitude)]);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const m=L.map('map').setView([-25.32,-57.35],10);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap'}).addTo(m);const points=${JSON.stringify(points)};points.forEach((p,i)=>L.circleMarker(p,{color:'#194b3b',fillOpacity:.8}).addTo(m).on('click',()=>window.ReactNativeWebView.postMessage(String(i))));if(points.length)m.fitBounds(points,{padding:[25,25],maxZoom:12});</script></body></html>`;
  return (
    <WebView
      style={{ height: 340, marginVertical: 16 }}
      originWhitelist={["about:blank", "https://*"]}
      source={{ html }}
      onMessage={(e) => {
        const index = Number(e.nativeEvent.data);
        if (Number.isInteger(index) && items[index]) onSelect(items[index]);
      }}
    />
  );
}
function AppContent() {
  const token = useRef(null),
    activeUser = useRef(null),
    syncTask = useRef(null);
  const [user, setUser] = useState(null),
    [online, setOnline] = useState(true),
    [boot, setBoot] = useState(true),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState("explore"),
    [message, setMessage] = useState("");
  const [items, setItems] = useState([]),
    [catalog, setCatalog] = useState(null),
    [privateState, setPrivateState] = useState(emptyState),
    [ownerItems, setOwnerItems] = useState([]),
    [ownerBookings, setOwnerBookings] = useState([]),
    [selected, setSelected] = useState(null),
    [map, setMap] = useState(false);
  const [city, setCity] = useState(""),
    [guests, setGuests] = useState("2"),
    [date, setDate] = useState(""),
    [start, setStart] = useState("09:00"),
    [end, setEnd] = useState("17:00"),
    [budget, setBudget] = useState("");
  const [authOpen, setAuthOpen] = useState(false),
    [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [quote, setQuote] = useState(null),
    [bookingKey, setBookingKey] = useState(() => Crypto.randomUUID()),
    [kind, setKind] = useState("owner");
  const stateRef = useRef(privateState);
  stateRef.current = privateState;
  const api = useRef(
    createClient({
      baseUrl: BASE,
      getToken: () => token.current,
      clientType: "mobile",
    }),
  ).current;
  const persist = useCallback(async (next, id = activeUser.current) => {
    if (!id || id !== activeUser.current) return;
    await AsyncStorage.setItem(cacheKey(id), JSON.stringify(next));
    if (id === activeUser.current) {
      stateRef.current = next;
      setPrivateState(next);
    }
  }, []);
  const refreshPrivate = useCallback(async () => {
    const id = activeUser.current;
    if (!id || !token.current) return;
    const [bookings, favorites] = await Promise.all([
      api("/reservations"),
      api("/favorites"),
    ]);
    if (id === activeUser.current)
      await persist(
        {
          ...stateRef.current,
          bookings: bookings.items,
          favorites: favorites.items,
        },
        id,
      );
  }, [api, persist]);
  const loadCatalog = useCallback(async () => {
    const [data, meta] = await Promise.all([
      api("/properties"),
      api("/catalog"),
    ]);
    setItems(data.items);
    setCatalog(meta);
    await AsyncStorage.setItem(
      "pyapy.catalog",
      JSON.stringify({ items: data.items, catalog: meta }),
    );
  }, [api]);
  const sync = useCallback(async () => {
    if (syncTask.current || !activeUser.current) return;
    const id = activeUser.current;
    syncTask.current = (async () => {
      await synchronize(
        stateRef.current.queue,
        async (item) => {
          if (activeUser.current !== id) throw new Error("Sesion cambiada.");
          return api(item.path, {
            method: item.method,
            body: item.body,
            key: item.key,
          });
        },
        (next) => persist({ ...stateRef.current, queue: next }, id),
      );
      await refreshPrivate();
    })();
    try {
      await syncTask.current;
    } catch (error) {
      setMessage(
        error.status === 401
          ? "Tu sesion expiro. Ingresa de nuevo."
          : error.message,
      );
    } finally {
      syncTask.current = null;
    }
  }, [api, persist, refreshPrivate]);
  useEffect(() => {
    let alive = true;
    async function init() {
      try {
        const [storedToken, storedUser, cache] = await Promise.all([
          SecureStore.getItemAsync("pyapy.token"),
          SecureStore.getItemAsync("pyapy.user"),
          AsyncStorage.getItem("pyapy.catalog"),
        ]);
        if (!alive) return;
        token.current = storedToken;
        if (storedUser) {
          const u = JSON.parse(storedUser);
          activeUser.current = u.id;
          setUser(u);
          const state = await AsyncStorage.getItem(cacheKey(u.id));
          if (state) {
            stateRef.current = JSON.parse(state);
            setPrivateState(stateRef.current);
          }
        }
        if (cache) {
          const c = JSON.parse(cache);
          setItems(c.items);
          setCatalog(c.catalog);
        }
        const net = await NetInfo.fetch();
        setOnline(Boolean(net.isConnected));
        if (net.isConnected) {
          await loadCatalog();
          if (storedToken) {
            const session = await api("/auth/session");
            if (session.user) {
              setUser(session.user);
              await refreshPrivate();
            } else setMessage("Tu sesion expiro. Ingresa de nuevo.");
          }
        }
      } catch {
        if (alive)
          setMessage("Mostrando la informacion guardada en este dispositivo.");
      } finally {
        if (alive) setBoot(false);
      }
    }
    init();
    const unsubscribe = NetInfo.addEventListener((state) =>
      setOnline(Boolean(state.isConnected)),
    );
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [api, loadCatalog, refreshPrivate]);
  useEffect(() => {
    if (!boot && online && user) sync();
  }, [online, boot, user, sync]);
  async function action(work) {
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function login() {
    await action(async () => {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: { email, password, ...(register ? { name } : {}) },
      });
      token.current = result.token;
      activeUser.current = result.user.id;
      await SecureStore.setItemAsync("pyapy.token", result.token);
      await SecureStore.setItemAsync("pyapy.user", JSON.stringify(result.user));
      const stored = await AsyncStorage.getItem(cacheKey(result.user.id));
      stateRef.current = stored ? JSON.parse(stored) : emptyState();
      setPrivateState(stateRef.current);
      setUser(result.user);
      setPassword("");
      setAuthOpen(false);
      await refreshPrivate();
    });
  }
  async function logout() {
    const id = activeUser.current;
    activeUser.current = null;
    if (syncTask.current) await syncTask.current.catch(() => {});
    if (online)
      await api("/auth/logout", { method: "POST", body: {} }).catch(() => {});
    token.current = null;
    await SecureStore.deleteItemAsync("pyapy.token");
    await SecureStore.deleteItemAsync("pyapy.user");
    if (id) await AsyncStorage.removeItem(cacheKey(id));
    setUser(null);
    stateRef.current = emptyState();
    setPrivateState(stateRef.current);
    setOwnerItems([]);
    setOwnerBookings([]);
    setTab("explore");
  }
  async function search() {
    await action(async () => {
      if (!online) {
        setMessage("Sin conexion: los resultados son del catalogo guardado.");
        return;
      }
      const q = new URLSearchParams({ guests });
      if (city) q.set("city", city);
      if (budget) q.set("budget", budget);
      if (date) {
        const interval = localInterval(date, start, end);
        q.set("startsAt", interval.startsAt);
        q.set("endsAt", interval.endsAt);
      }
      const result = await api(`/properties?${q}`);
      setItems(result.items.length ? result.items : result.alternatives);
      if (!result.items.length)
        setMessage(
          "No hay coincidencias exactas. Estas son otras opciones disponibles.",
        );
    });
  }
  async function favorite(p) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    await action(async () => {
      const exists = stateRef.current.favorites.some((x) => x.id === p.id);
      const entry = {
        key: Crypto.randomUUID(),
        status: "pending",
        path: `/favorites/${p.id}`,
        method: exists ? "DELETE" : "PUT",
        createdAt: new Date().toISOString(),
        label: p.name,
      };
      if (online) {
        await api(entry.path, { method: entry.method });
        await refreshPrivate();
      } else {
        await persist({
          ...stateRef.current,
          queue: [...stateRef.current.queue, entry],
        });
        setMessage("Cambio guardado como pendiente de sincronizacion.");
      }
    });
  }
  function bookingInput() {
    return {
      propertyId: selected.id,
      guests: Number(guests),
      ...localInterval(date, start, end),
    };
  }
  async function getQuote() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    await action(async () => {
      const body = bookingInput();
      if (!online) {
        await persist({
          ...stateRef.current,
          queue: [
            ...stateRef.current.queue,
            {
              key: bookingKey,
              status: "pending",
              path: "/reservations",
              method: "POST",
              body,
              label: selected.name,
              createdAt: new Date().toISOString(),
            },
          ].filter((v, i, a) => a.findIndex((x) => x.key === v.key) === i),
        });
        setSelected(null);
        setMessage(
          "Solicitud pendiente. Se confirmara solo despues de validar disponibilidad al reconectar.",
        );
        return;
      }
      const q = await api("/reservations/quote", { method: "POST", body });
      setQuote({ ...q, body });
    });
  }
  async function confirm() {
    await action(async () => {
      const result = await api("/reservations", {
        method: "POST",
        body: quote.body,
        key: bookingKey,
      });
      setMessage(`Reserva confirmada: ${result.reservation.locator}`);
      setSelected(null);
      setQuote(null);
      await refreshPrivate();
      setTab("bookings");
    });
  }
  async function openProperty(p) {
    setSelected(p);
    setQuote(null);
    setBookingKey(Crypto.randomUUID());
    if (online)
      try {
        setSelected(await api(`/properties/${p.id}`));
      } catch (error) {
        setMessage(error.message);
      }
  }
  async function loadOwner() {
    const [properties, bookings] = await Promise.all([
      api("/owner/properties"),
      api("/owner/reservations"),
    ]);
    setOwnerItems(properties.items);
    setOwnerBookings(bookings.items);
  }
  async function chooseTab(value) {
    setTab(value);
    setSelected(null);
    setMessage("");
    if (value === "owner" && online && user?.role !== "client")
      await action(loadOwner);
  }
  const list = tab === "favorites" ? privateState.favorites : items;
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Pressable onPress={() => chooseTab("explore")}>
          <Text style={s.brand}>
            pyApy<Text style={{ color: "#bc513e" }}>.</Text>
          </Text>
        </Pressable>
        <Text style={s.connection}>{online ? "En linea" : "Sin conexion"}</Text>
        <Pressable
          accessibilityLabel="Mi cuenta"
          onPress={() => (user ? chooseTab("account") : setAuthOpen(true))}
        >
          <Feather name="user" size={23} color="#194b3b" />
        </Pressable>
      </View>
      {message ? (
        <View style={s.notice}>
          <Text style={s.noticeText}>{message}</Text>
          <Pressable
            accessibilityLabel="Cerrar aviso"
            onPress={() => setMessage("")}
          >
            <Feather name="x" size={17} color="#194b3b" />
          </Pressable>
        </View>
      ) : null}
      {boot ? (
        <ActivityIndicator size="large" style={{ margin: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={busy}
              onRefresh={() =>
                action(async () => {
                  if (online) {
                    await loadCatalog();
                    await refreshPrivate();
                    await sync();
                  }
                })
              }
            />
          }
        >
          {selected ? (
            <>
              <Button
                title="Volver"
                icon="arrow-left"
                secondary
                onPress={() => setSelected(null)}
              />
              {imageUrl(selected) && (
                <Image
                  source={{ uri: imageUrl(selected) }}
                  style={[s.photo, { marginTop: 20 }]}
                />
              )}
              <Text style={s.heading}>{selected.name}</Text>
              <Text style={s.muted}>
                {selected.city} · Hasta {selected.capacity} personas
              </Text>
              <Text style={s.body}>{selected.description}</Text>
              <Text style={s.price}>
                Gs. {money(selected.pricePerHour)} / hora
              </Text>
              <Text style={s.body}>
                {selected.amenities
                  .map(
                    (a) =>
                      catalog?.amenities.find((x) => x.code === a)?.label || a,
                  )
                  .join(" · ")}
              </Text>
              <Button
                title={
                  privateState.favorites.some((x) => x.id === selected.id)
                    ? "Quitar favorito"
                    : "Guardar favorito"
                }
                icon="heart"
                secondary
                onPress={() => favorite(selected)}
              />
              <Field
                label="Fecha (AAAA-MM-DD)"
                value={date}
                onChangeText={(v) => {
                  setDate(v);
                  setQuote(null);
                }}
                placeholder="2026-10-15"
              />
              <View style={s.row}>
                <View style={s.flex}>
                  <Field
                    label="Desde (HH:MM)"
                    value={start}
                    onChangeText={(v) => {
                      setStart(v);
                      setQuote(null);
                    }}
                  />
                </View>
                <View style={s.flex}>
                  <Field
                    label="Hasta (HH:MM)"
                    value={end}
                    onChangeText={(v) => {
                      setEnd(v);
                      setQuote(null);
                    }}
                  />
                </View>
              </View>
              <Field
                label="Personas"
                value={guests}
                keyboardType="numeric"
                onChangeText={(v) => {
                  setGuests(v);
                  setQuote(null);
                }}
              />
              {tab === "owner" ? (
                <>
                  <View style={s.row}>
                    <Button
                      title="Particular"
                      secondary={kind !== "owner"}
                      onPress={() => setKind("owner")}
                    />
                    <Button
                      title="Bloqueo"
                      secondary={kind !== "block"}
                      onPress={() => setKind("block")}
                    />
                  </View>
                  <Button
                    title="Registrar ocupacion"
                    icon="calendar"
                    disabled={busy || !online}
                    onPress={() =>
                      action(async () => {
                        await api("/owner/occupancies", {
                          method: "POST",
                          key: bookingKey,
                          body: { ...bookingInput(), kind, note: "" },
                        });
                        setSelected(null);
                        await loadOwner();
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Button
                    title={
                      online
                        ? "Consultar disponibilidad"
                        : "Guardar solicitud pendiente"
                    }
                    icon="calendar"
                    disabled={busy}
                    onPress={getQuote}
                  />
                  {quote && (
                    <View style={s.quote}>
                      <Text style={s.price}>
                        Total: Gs. {money(quote.totalAmount)}
                      </Text>
                      <Text style={s.body}>
                        Cancelacion hasta {quote.cancellationHours} h antes.
                      </Text>
                      <Button
                        title="Confirmar reserva"
                        icon="check"
                        disabled={busy || !online}
                        onPress={confirm}
                      />
                    </View>
                  )}
                </>
              )}
              <Text style={s.body}>{selected.rules}</Text>
              <Text style={s.muted}>Ubicacion aproximada</Text>
              {online && <MapView items={[selected]} onSelect={() => {}} />}
              {selected.reviews?.map((r) => (
                <View key={r.id} style={s.booking}>
                  <Text style={s.price}>{r.rating}/5</Text>
                  <Text style={s.body}>{r.comment}</Text>
                </View>
              ))}
            </>
          ) : tab === "explore" || tab === "favorites" ? (
            <>
              {tab === "explore" ? (
                <>
                  <View style={s.hero}>
                    <Image
                      source={{ uri: `${origin}/demo/pool.jpg` }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={s.heroText}>
                      <Text style={s.heroTitle}>Un ratito para vos.</Text>
                      <Text style={s.heroSubtitle}>
                        Tu proxima escapada, en Paraguay.
                      </Text>
                    </View>
                  </View>
                  <Field
                    label="Ciudad"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Todo Paraguay"
                  />
                  <View style={s.row}>
                    <View style={s.flex}>
                      <Field
                        label="Personas"
                        value={guests}
                        onChangeText={setGuests}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.flex}>
                      <Field
                        label="Presupuesto (Gs.)"
                        value={budget}
                        onChangeText={setBudget}
                        keyboardType="numeric"
                        placeholder="Sin limite"
                      />
                    </View>
                  </View>
                  <Field
                    label="Fecha (AAAA-MM-DD)"
                    value={date}
                    onChangeText={setDate}
                    placeholder="Cualquier fecha"
                  />
                  <Button
                    title="Buscar espacios"
                    icon="search"
                    onPress={search}
                    disabled={busy}
                  />
                  <Button
                    title={map ? "Ver lista" : "Explorar mapa"}
                    icon={map ? "grid" : "map"}
                    secondary
                    onPress={() => setMap(!map)}
                  />
                  {map && online && (
                    <MapView items={items} onSelect={openProperty} />
                  )}
                </>
              ) : (
                <Text style={s.heading}>Mis lugares guardados</Text>
              )}
              {list.map((p) => (
                <Property
                  key={p.id}
                  p={p}
                  onSelect={openProperty}
                  onFavorite={favorite}
                  favorite={privateState.favorites.some((x) => x.id === p.id)}
                />
              ))}
              {!list.length && (
                <Text style={s.body}>
                  Todavia no hay espacios para mostrar.
                </Text>
              )}
            </>
          ) : tab === "bookings" ? (
            <>
              <Text style={s.heading}>Mis reservas</Text>
              {!user ? (
                <Button title="Ingresar" onPress={() => setAuthOpen(true)} />
              ) : (
                <>
                  {privateState.queue.map((q) => (
                    <View key={q.key} style={s.booking}>
                      <Text style={s.propertyName}>{q.label}</Text>
                      <Text style={s.pending}>
                        {
                          {
                            pending: "Pendiente de sincronizar",
                            syncing: "Sincronizando",
                            synced: "Sincronizada",
                            failed: "No se pudo completar",
                            conflict: "Horario no disponible",
                          }[q.status]
                        }
                      </Text>
                      {q.error && <Text style={s.body}>{q.error}</Text>}
                      {q.status === "conflict" && (
                        <Button
                          title="Buscar otra fecha"
                          secondary
                          onPress={() => chooseTab("explore")}
                        />
                      )}
                    </View>
                  ))}
                  {privateState.bookings.map((r) => (
                    <View key={r.id} style={s.booking}>
                      <Text style={s.propertyName}>{r.propertyName}</Text>
                      <Text style={s.body}>
                        {new Date(r.startsAt).toLocaleString("es-PY", {
                          timeZone: "America/Asuncion",
                        })}
                      </Text>
                      <Text style={s.meta}>
                        {r.status === "confirmed" ? "Confirmada" : "Cancelada"}{" "}
                        · {r.locator}
                      </Text>
                      <Text style={s.price}>Gs. {money(r.totalAmount)}</Text>
                      {r.status === "confirmed" &&
                        Date.parse(r.startsAt) > Date.now() && (
                          <Button
                            title="Cancelar reserva"
                            icon="x"
                            secondary
                            disabled={!online || busy}
                            onPress={() =>
                              Alert.alert(
                                "Cancelar reserva",
                                "Se liberara el horario reservado.",
                                [
                                  { text: "Conservar", style: "cancel" },
                                  {
                                    text: "Cancelar reserva",
                                    style: "destructive",
                                    onPress: () =>
                                      action(async () => {
                                        await api(
                                          `/reservations/${r.id}/cancel`,
                                          { method: "POST", body: {} },
                                        );
                                        await refreshPrivate();
                                      }),
                                  },
                                ],
                              )
                            }
                          />
                        )}
                    </View>
                  ))}
                  {!privateState.bookings.length &&
                    !privateState.queue.length && (
                      <Text style={s.body}>Tu proxima escapada te espera.</Text>
                    )}
                  <Button
                    title="Sincronizar"
                    icon="refresh-cw"
                    disabled={!online || busy}
                    onPress={() => action(sync)}
                  />
                </>
              )}
            </>
          ) : tab === "owner" ? (
            <>
              <Text style={s.heading}>Mi espacio</Text>
              {ownerItems.map((p) => (
                <Property key={p.id} p={p} onSelect={openProperty} />
              ))}
              <Text style={s.subheading}>Calendario de ocupaciones</Text>
              {ownerBookings.map((r) => (
                <View key={r.id} style={s.booking}>
                  <Text style={s.propertyName}>{r.propertyName}</Text>
                  <Text style={s.body}>
                    {new Date(r.startsAt).toLocaleString("es-PY")} ·{" "}
                    {r.kind === "pyapy"
                      ? "Generada por pyApy"
                      : r.kind === "owner"
                        ? "Particular"
                        : "Bloqueo"}{" "}
                    · {r.status}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={s.heading}>
                {user ? `Hola, ${user.name}.` : "Tu cuenta"}
              </Text>
              {user ? (
                <>
                  <Text style={s.body}>{user.email}</Text>
                  {user.role === "client" && (
                    <Button
                      title="Registrarme como propietario"
                      icon="home"
                      disabled={!online || busy}
                      onPress={() =>
                        action(async () => {
                          await api("/owner-profile", {
                            method: "POST",
                            body: { commercialName: user.name },
                          });
                          const result = await api("/auth/session");
                          await SecureStore.setItemAsync(
                            "pyapy.user",
                            JSON.stringify(result.user),
                          );
                          setUser(result.user);
                        })
                      }
                    />
                  )}
                  <Button
                    title="Actualizar sesion"
                    icon="refresh-cw"
                    secondary
                    disabled={!online}
                    onPress={() => {
                      setRegister(false);
                      setEmail(user.email);
                      setAuthOpen(true);
                    }}
                  />
                  <Button
                    title="Cerrar sesion"
                    icon="log-out"
                    secondary
                    onPress={() =>
                      privateState.queue.some((q) =>
                        ["pending", "syncing"].includes(q.status),
                      )
                        ? Alert.alert(
                            "Cerrar sesion",
                            "Las solicitudes pendientes se eliminaran de este dispositivo.",
                            [
                              { text: "Conservar sesion", style: "cancel" },
                              {
                                text: "Cerrar sesion",
                                style: "destructive",
                                onPress: () => action(logout),
                              },
                            ],
                          )
                        : action(logout)
                    }
                  />
                </>
              ) : (
                <Button
                  title="Ingresar"
                  icon="user"
                  onPress={() => setAuthOpen(true)}
                />
              )}
              <Text style={s.body}>pyApy · Paraguay</Text>
            </>
          )}
        </ScrollView>
      )}
      <View style={s.tabs}>
        {[
          ["explore", "compass", "Explorar"],
          ["favorites", "heart", "Guardados"],
          ["bookings", "calendar", "Reservas"],
          ...(user && user.role !== "client"
            ? [["owner", "home", "Mi espacio"]]
            : []),
        ].map(([key, icon, label]) => (
          <Pressable
            key={key}
            onPress={() => chooseTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            style={s.tab}
          >
            <Feather
              name={icon}
              size={20}
              color={tab === key ? "#194b3b" : "#85907b"}
            />
            <Text
              style={[
                s.tabText,
                tab === key && { color: "#194b3b", fontWeight: "700" },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Modal
        visible={authOpen}
        animationType="slide"
        onRequestClose={() => setAuthOpen(false)}
      >
        <SafeAreaView style={s.safe}>
          <ScrollView contentContainerStyle={s.content}>
            <Button
              title="Volver"
              icon="arrow-left"
              secondary
              onPress={() => setAuthOpen(false)}
            />
            <Text style={s.heading}>
              {register ? "Crea tu cuenta" : "Que bueno verte."}
            </Text>
            {register && (
              <Field
                label="Nombre"
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              label="Contrasena (12 caracteres o mas)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            {message && <Text style={s.pending}>{message}</Text>}
            <Button
              title={register ? "Crear mi cuenta" : "Ingresar"}
              onPress={login}
              disabled={busy || !online}
            />
            <Button
              title={register ? "Ya tengo cuenta" : "Crear cuenta"}
              secondary
              onPress={() => setRegister(!register)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderColor: "#e5eadf",
  },
  brand: { fontSize: 31, fontWeight: "800", color: "#194b3b" },
  connection: { marginLeft: "auto", fontSize: 11, color: "#75816c" },
  content: { padding: 22, paddingBottom: 35 },
  heading: {
    fontSize: 27,
    fontWeight: "700",
    color: "#25352c",
    marginVertical: 20,
  },
  subheading: { fontSize: 21, fontWeight: "600", marginVertical: 18 },
  body: { fontSize: 14, color: "#626f5a", lineHeight: 23, marginVertical: 12 },
  muted: { fontSize: 12, color: "#78836f", fontWeight: "400" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#194b3b",
    borderRadius: 5,
    padding: 15,
    marginVertical: 7,
    minHeight: 48,
  },
  secondary: {
    backgroundColor: "#f1f5ec",
    borderWidth: 1,
    borderColor: "#d9e2d1",
  },
  buttonText: { fontSize: 14, fontWeight: "600", color: "white" },
  field: { marginVertical: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#4a5e40", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d6dfce",
    borderRadius: 5,
    padding: 13,
    fontSize: 15,
    color: "#25352c",
    minHeight: 47,
  },
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  hero: {
    height: 220,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#194b3b",
  },
  heroText: { marginTop: "auto", backgroundColor: "#14271c80", padding: 22 },
  heroTitle: { fontSize: 25, fontWeight: "700", color: "white" },
  heroSubtitle: { fontSize: 13, color: "white", marginTop: 8 },
  property: {
    marginTop: 23,
    position: "relative",
    borderBottomWidth: 1,
    borderColor: "#e1e7dc",
    paddingBottom: 18,
  },
  photo: {
    height: 225,
    width: "100%",
    borderRadius: 6,
    backgroundColor: "#e9efdf",
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  propertyBody: { paddingTop: 15 },
  propertyName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#25352c",
    marginBottom: 6,
  },
  meta: { fontSize: 11, color: "#78836f", marginBottom: 9 },
  price: { fontSize: 16, fontWeight: "700", color: "#294735", marginTop: 10 },
  favorite: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e5eadf",
    paddingTop: 10,
    paddingBottom: 10,
  },
  tab: { flex: 1, alignItems: "center", gap: 5, minHeight: 44 },
  tabText: { fontSize: 10, color: "#85907b" },
  notice: {
    padding: 14,
    backgroundColor: "#eef3e5",
    flexDirection: "row",
    gap: 12,
  },
  noticeText: { fontSize: 12, color: "#3c5232", flex: 1, lineHeight: 18 },
  booking: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#dfe7d7",
  },
  pending: { fontSize: 13, color: "#96613a", marginVertical: 10 },
  quote: { padding: 18, backgroundColor: "#f1f5ea", marginVertical: 15 },
});
