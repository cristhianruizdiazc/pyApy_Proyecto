// Fully intercepted API for presentation, navigation and error recovery checks.
import { localInterval } from "@pyapy/contracts";
import { savedProperties } from "./personal-area.js";
export const managementId = (n) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Asuncion",
});
export async function mockManagementApi(
  page,
  { role = "owner", ...overrides } = {},
) {
  const p = {
    ...structuredClone(savedProperties[0]),
    cityId: managementId(401),
    zone: "Zona de pruebas",
    latitude: -25.3,
    longitude: -57.3,
    rules: "Respetá el horario acordado.",
  };
  const plans = ["Activo", "Verificado", "VIP"].map((name, i) => ({
    id: managementId(410 + i),
    name,
    monthly_price: 50000 * (i + 1),
    active: true,
  }));
  const state = {
    user: role
      ? {
          id: managementId(400),
          name: "Cuenta de gestión QA",
          email: "gestion@example.invalid",
          role,
        }
      : null,
    properties: [p],
    plans,
    subscription: null,
    failures: {},
    requests: [],
    writes: [],
    bookings: [
      {
        id: managementId(420),
        propertyId: p.id,
        propertyName: p.name,
        ...localInterval(today, "09:00", "17:00"),
        status: "confirmed",
        kind: "owner",
        totalAmount: 80000,
        guests: 18,
        locator: "QA-PARTICULAR",
        cancellationHours: 24,
      },
    ],
    users: [
      {
        id: managementId(400),
        name: "Cuenta de gestión QA",
        email: "gestion@example.invalid",
        role: "admin",
        active: true,
      },
      {
        id: managementId(402),
        name: "Cliente de prueba",
        email: "cliente@example.invalid",
        role: "client",
        active: true,
      },
    ],
    reviews: [
      {
        id: managementId(430),
        comment: "Un lindo lugar para compartir en familia.",
        rating: 5,
        visible: true,
      },
    ],
    subscriptions: [
      {
        id: managementId(431),
        owner_id: managementId(403),
        name: "Anfitrión de prueba",
        plan: "Verificado",
        status: "pending",
        ends_at: null,
      },
    ],
    sponsors: [
      {
        id: managementId(440),
        name: "Sponsor de prueba",
        title: "Escapadas de verano",
        active: true,
        starts_at: "2030-01-01T00:00:00Z",
        ends_at: "2030-02-01T00:00:00Z",
      },
    ],
    weights: ["availability", "city", "capacity", "budget", "amenities"].map(
      (criterion) => ({ criterion, weight: 20 }),
    ),
    audit: [
      {
        id: managementId(450),
        actor_id: managementId(400),
        resource_id: p.id,
        created_at: "2026-11-08T12:00:00Z",
        action: "property_update",
      },
    ],
    ...overrides,
  };
  await page.route("**/api/**", (route) => {
    const req = route.request(),
      method = req.method(),
      path = new URL(req.url()).pathname.replace("/api/v1", "");
    const body = req.headers()["content-type"]?.includes("application/json")
      ? req.postDataJSON()
      : null;
    state.requests.push({ path, method });
    if (method !== "GET")
      state.writes.push({
        path,
        method,
        body,
        key: req.headers()["idempotency-key"],
      });
    if (state.failures[path])
      return route.fulfill({
        status: state.failures[path],
        json: {
          message: "No se pudo completar la operación de prueba.",
          code: "TEST_REJECTED",
        },
      });
    let json = { items: [] };
    if (path === "/auth/session")
      json = { user: state.user, csrfToken: "management-test" };
    else if (path === "/catalog")
      json = {
        cities: [{ id: p.cityId, city: "Aregua" }],
        amenities: [
          { code: "pool", label: "Piscina" },
          { code: "grill", label: "Parrilla" },
        ],
        plans: state.plans,
      };
    else if (path === "/owner/metrics")
      json = {
        properties: state.properties.length,
        bookings: 1,
        revenue: 80000,
        views: 8,
        favorites: 4,
      };
    else if (path === "/owner/properties") json = { items: state.properties };
    else if (path === "/owner/reservations") json = { items: state.bookings };
    else if (path === "/owner/subscription") {
      if (method === "POST")
        state.subscription = {
          ...plans.find((p) => p.id === body.planId),
          status: "pending",
        };
      json = { subscription: state.subscription };
    } else if (path === "/owner-profile") {
      state.user.role = "owner";
      json = { ok: true };
    } else if (path === "/owner/occupancies") {
      const item = {
        ...body,
        id: managementId(421),
        propertyName: p.name,
        status: "confirmed",
        locator: "QA-BLOQUEO",
        totalAmount: 0,
      };
      state.bookings.push(item);
      json = { reservation: item };
    } else if (path.endsWith("/cancel")) {
      state.bookings = state.bookings.map((r) =>
        path.includes(r.id) ? { ...r, status: "cancelled" } : r,
      );
      json = { ok: true };
    } else if (path.endsWith("/private"))
      json =
        method === "GET"
          ? {
              address: "Dirección privada ficticia 123",
              phone: "000000",
              latitude: -25.31,
              longitude: -57.32,
            }
          : { ok: true };
    else if (path.endsWith("/socials")) json = { ok: true };
    else if (/^\/properties\/[^/]+\/images/.test(path)) {
      const prop = state.properties.find((p) => path.includes(p.id));
      if (method === "POST")
        prop.images.push({
          id: managementId(460),
          url: "/demo/house.jpg",
          alt: "Foto añadida de prueba",
        });
      if (method === "DELETE")
        prop.images = prop.images.filter((i) => !path.endsWith(i.id));
      json = { ok: true };
    } else if (path === "/properties" && method === "POST") {
      const item = {
        ...body,
        id: managementId(470),
        images: [],
        socials: [],
        reviews: [],
      };
      state.properties.push(item);
      json = item;
    } else if (/^\/properties\/[^/]+$/.test(path)) {
      const prop = state.properties.find((p) => path.endsWith(p.id));
      if (method === "PUT") Object.assign(prop, body);
      json = prop;
    } else if (path === "/admin/overview")
      json = {
        users: 2,
        properties: 1,
        total: 1,
        revenue: 80000,
        jobs: { pending: 1, failed: 0 },
        demand: [{ city: "Aregua", searches: 3 }],
      };
    else if (path === "/admin/weights" && method === "PUT") {
      if (Object.values(body).reduce((a, b) => a + b, 0) !== 100)
        return route.fulfill({
          status: 422,
          json: { message: "Los pesos deben sumar 100." },
        });
      state.weights = Object.entries(body).map(([criterion, weight]) => ({
        criterion,
        weight,
      }));
      json = { ok: true };
    } else if (path === "/admin/sponsors" && method === "POST") {
      state.sponsors.push({
        ...body,
        id: managementId(441),
        starts_at: body.startsAt,
        ends_at: body.endsAt,
        active: true,
      });
      json = { ok: true };
    } else if (path.startsWith("/admin/")) {
      const [, , section, id] = path.split("/");
      const items = state[section] || [];
      if (method === "GET") json = { items };
      else {
        const item = items.find((i) => i.id === id || i.owner_id === id);
        if (item)
          Object.assign(
            item,
            body,
            body.monthlyPrice === undefined
              ? {}
              : { monthly_price: body.monthlyPrice },
            body.endsAt ? { ends_at: body.endsAt } : {},
          );
        json = { ok: true };
      }
    }
    return route.fulfill({
      status:
        method === "POST" &&
        ["/properties", "/owner/occupancies", "/admin/sponsors"].includes(path)
          ? 201
          : 200,
      json,
    });
  });
  return state;
}
