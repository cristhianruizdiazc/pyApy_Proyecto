import {
  bookingSchema,
  intervalSchema,
  localInterval,
  ZONE,
} from "@pyapy/contracts";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
export function localParts(value = new Date()) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}${parts.second === "00" ? "" : `:${parts.second}`}`,
  };
}
export function formatStay(value) {
  return new Date(value).toLocaleString("es-PY", {
    timeZone: ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
export function detailHref(id, search = "") {
  const source = new URLSearchParams(search),
    next = new URLSearchParams();
  for (const key of ["startsAt", "endsAt", "guests"])
    if (source.has(key)) next.set(key, source.get(key));
  return `/espacios/${id}${next.size ? `?${next}` : ""}`;
}
export function draftFromSearch(search, capacity) {
  const params = new URLSearchParams(search);
  const draft = {
    date: "",
    endDate: "",
    start: "09:00",
    end: "17:00",
    guests: params.get("guests") || String(Math.min(2, capacity)),
  };
  let warning = "";
  if (params.has("startsAt") || params.has("endsAt")) {
    const parsed = intervalSchema.safeParse({
      startsAt: params.get("startsAt"),
      endsAt: params.get("endsAt"),
    });
    if (
      parsed.success &&
      Date.parse(parsed.data.endsAt) > Date.parse(parsed.data.startsAt)
    ) {
      const a = localParts(parsed.data.startsAt),
        b = localParts(parsed.data.endsAt);
      Object.assign(draft, {
        date: a.date,
        start: a.time,
        end: b.time,
        endDate: b.date === a.date ? "" : b.date,
      });
    } else
      warning =
        "La fecha del enlace no es válida. Elegí una fecha y un horario para consultar.";
  }
  return { draft, warning };
}
export function inputFromDraft(draft, propertyId) {
  const input = {
    propertyId,
    guests: Number(draft.guests),
    ...localInterval(
      draft.date,
      draft.start,
      draft.end,
      draft.endDate || draft.date,
    ),
  };
  if (
    !bookingSchema.safeParse(input).success ||
    Date.parse(input.endsAt) <= Date.parse(input.startsAt)
  )
    throw new Error(
      "Revisá las fechas, los horarios y la cantidad de personas.",
    );
  return input;
}
export function draftFromInput(input) {
  const a = localParts(input.startsAt),
    b = localParts(input.endsAt);
  return {
    date: a.date,
    start: a.time,
    end: b.time,
    endDate: b.date === a.date ? "" : b.date,
    guests: String(input.guests),
  };
}
