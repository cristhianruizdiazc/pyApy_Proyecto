import { idSchema } from "@pyapy/contracts";

// Login can resume known local screens, but never itself or an external URL.
export function localReturn(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (
    [...value].some(
      (char) =>
        char === "\\" ||
        /\s/u.test(char) ||
        char.charCodeAt(0) <= 31 ||
        char.charCodeAt(0) === 127,
    )
  )
    return "/";
  try {
    const url = new URL(value, "https://pyapy.invalid");
    if (url.origin !== "https://pyapy.invalid") return "/";
    if (
      ![
        "/",
        "/reservas",
        "/favoritos",
        "/cuenta",
        "/propietario",
        "/admin",
      ].includes(url.pathname) &&
      !/^\/espacios\/[^/%]+$/.test(url.pathname)
    )
      return "/";
    return value;
  } catch {
    return "/";
  }
}

export function returnState(location, action = null) {
  return {
    from: localReturn(location.pathname + location.search + location.hash),
    pendingAction: action,
  };
}

export function pendingAction(value, from) {
  if (
    value?.type === "interest" &&
    new URL(from, "https://pyapy.invalid").pathname === "/"
  )
    return { type: "interest" };
  if (value?.type === "favorite" && idSchema.safeParse(value.id).success)
    return {
      type: "favorite",
      id: value.id,
      ...(value.remove === true ? { remove: true } : {}),
    };
  if (value?.type === "booking") return { type: "booking" };
  return null;
}

export function continuationMessage(action, from = "/") {
  if (action?.type === "interest")
    return "Tu búsqueda se conserva. Confirmá si querés guardar tu interés.";
  if (action?.type === "favorite")
    return action.remove
      ? "Confirmá si querés quitar este espacio de favoritos."
      : "Tu espacio sigue pendiente de guardar. Confirmá para agregarlo a favoritos.";
  if (action?.type === "booking")
    return "Tu selección se conserva. Consultá disponibilidad para continuar; la reserva requiere confirmación.";
  const path = new URL(localReturn(from), "https://pyapy.invalid").pathname;
  if (path === "/propietario")
    return "Después de ingresar continuarás con la publicación según los permisos de tu cuenta. Crear un perfil o publicar requiere tu confirmación.";
  if (path === "/reservas")
    return "Después de ingresar volverás a Mis reservas.";
  if (path === "/favoritos")
    return "Después de ingresar volverás a tus favoritos.";
  if (path === "/cuenta") return "Después de ingresar volverás a tu cuenta.";
  return "Después de ingresar volverás a la página que elegiste.";
}
