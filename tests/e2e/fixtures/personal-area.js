// All API traffic is intercepted. These fixtures never write to a real database.
export const accountUser = {
  id: "00000000-0000-4000-8000-000000000050",
  name: "Ana del Río",
  email: "ana@example.invalid",
  role: "client",
};
const uuid = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
export const savedProperties = [1, 2, 3].map((number) => ({
  id: uuid(50 + number),
  name: `Quinta del río ${number}`,
  city: "Aregua",
  department: "Central",
  kind: "Quinta",
  status: "published",
  capacity: 30,
  pricePerHour: 10000,
  minHours: 4,
  maxHours: 48,
  openHour: 0,
  closeHour: 24,
  cancellationHours: 24,
  description: "Un jardín junto al agua para compartir una escapada.",
  amenities: ["pool", "grill"],
  isDemo: true,
  images: [{ id: "photo", url: "/demo/pool.jpg", alt: "Piscina ilustrativa" }],
  reviews: [],
  socials: [],
}));
export const personalReservations = [
  {
    id: uuid(61),
    propertyId: savedProperties[0].id,
    propertyName: savedProperties[0].name,
    startsAt: "2030-01-10T12:00:00.000Z",
    endsAt: "2030-01-11T12:00:00.000Z",
    status: "confirmed",
    locator: "PYAPY-PLAN-2030",
    totalAmount: 240000,
    guests: 18,
    cancellationHours: 24,
    kind: "pyapy",
  },
  {
    id: uuid(62),
    propertyId: savedProperties[1].id,
    propertyName: savedProperties[1].name,
    startsAt: "2020-01-10T12:00:00.000Z",
    endsAt: "2020-01-10T20:00:00.000Z",
    status: "confirmed",
    locator: "PYAPY-RECUERDO",
    totalAmount: 80000,
    guests: 8,
    cancellationHours: 24,
    kind: "pyapy",
  },
  {
    id: uuid(63),
    propertyId: savedProperties[2].id,
    propertyName: savedProperties[2].name,
    startsAt: "2030-01-12T12:00:00.000Z",
    endsAt: "2030-01-12T20:00:00.000Z",
    status: "cancelled",
    locator: "PYAPY-CANCELADA",
    totalAmount: 80000,
    guests: 5,
    cancellationHours: 24,
    kind: "pyapy",
  },
];
export async function mockPersonalApi(page, overrides = {}) {
  const state = {
    user: { ...accountUser },
    favorites: structuredClone(savedProperties),
    reservations: structuredClone(personalReservations),
    notifications: [
      {
        id: uuid(71),
        message: "Tu próxima escapada ya está confirmada.",
        created_at: "2026-11-01T12:00:00.000Z",
        read_at: null,
      },
      {
        id: uuid(72),
        message: "Tenés un nuevo aviso de tu reserva.",
        created_at: "2026-11-02T12:00:00.000Z",
        read_at: null,
      },
      {
        id: uuid(73),
        message: "Gracias por compartir tu experiencia.",
        created_at: "2026-10-20T12:00:00.000Z",
        read_at: "2026-10-21T12:00:00.000Z",
      },
    ],
    failures: {},
    requests: [],
    writes: [],
    ...overrides,
  };
  await page.route("**/api/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ path, method });
    if (method !== "GET") state.writes.push({ path, method, body });
    if (state.failures[path])
      return route.fulfill({
        status: state.failures[path],
        json: {
          message: `No pudimos completar ${path}. Reintentá.`,
          code: "TEST_FAILURE",
        },
      });
    let json = { items: [] };
    if (path === "/auth/session")
      json = { user: state.user, csrfToken: "personal-area-test" };
    else if (path === "/auth/login" || path === "/auth/register") {
      state.user = {
        ...accountUser,
        ...(body.name ? { name: body.name } : {}),
      };
      json = { user: state.user, csrfToken: "personal-area-test" };
    } else if (path === "/catalog")
      json = {
        cities: [],
        amenities: [
          { code: "pool", label: "Piscina" },
          { code: "grill", label: "Parrilla" },
        ],
        plans: [],
      };
    else if (path === "/favorites") json = { items: state.favorites };
    else if (path.startsWith("/favorites/") && method === "DELETE") {
      state.favorites = state.favorites.filter((p) => !path.endsWith(p.id));
      json = { ok: true };
    } else if (path === "/reservations") json = { items: state.reservations };
    else if (path.endsWith("/arrival"))
      json = {
        address: "Calle privada ficticia 123",
        phone: "000000000",
        latitude: -25.33,
        longitude: -57.31,
      };
    else if (path.endsWith("/cancel")) {
      state.reservations = state.reservations.map((r) =>
        path.includes(r.id) ? { ...r, status: "cancelled" } : r,
      );
      json = { ok: true };
    } else if (path === "/notifications") json = { items: state.notifications };
    else if (/^\/notifications\/.+\/read$/.test(path)) {
      state.notifications = state.notifications.map((n) =>
        path.includes(n.id) ? { ...n, read_at: "2026-11-08T15:00:00.000Z" } : n,
      );
      json = { ok: true };
    } else if (/^\/properties\/.+$/.test(path))
      json = savedProperties.find((p) => path.endsWith(p.id));
    return route.fulfill({ json });
  });
  return state;
}
