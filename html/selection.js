// Carry the local demo selection; no reservation is created here.
(() => {
  const params = new URLSearchParams(location.search);
  const catalog = document.querySelector(".catalog-scope");
  const scope = document.querySelector("[data-capacity]");
  const fields = ["date", "start", "end", "guests"];
  const input = (name) => document.querySelector(`[name="${name}"]`);
  const money = (value) => new Intl.NumberFormat("es-PY").format(value);
  function selection() {
    const next = new URLSearchParams();
    for (const name of fields) {
      const value = input(name)?.value;
      if (value && value !== "all") next.set(name, value);
    }
    const turn = input("turn")?.value;
    if (turn) {
      const times = {
        day: ["09:00", "17:00"],
        morning: ["09:00", "13:00"],
        afternoon: ["13:00", "17:00"],
        full: ["09:00", "09:00"],
      };
      next.set("start", times[turn][0]);
      next.set("end", times[turn][1]);
    }
    return next;
  }
  function updateLinks(next) {
    for (const link of document.querySelectorAll(
      ".property-card a, .booking-box a",
    )) {
      const url = new URL(link.getAttribute("href"), location.href);
      if (!url.pathname.endsWith(".html")) continue;
      url.search = next.toString();
      link.href = url.href;
    }
  }
  function filter() {
    const city = input("city")?.value || "all";
    const guests = Number(input("guests")?.value) || 0;
    const budget = Number(input("budget")?.value) || Infinity;
    const kind =
      document.querySelector('[name="kind"]:checked')?.value || "all";
    let visible = 0;
    for (const card of document.querySelectorAll(".property-card")) {
      card.hidden =
        !(city === "all" || card.dataset.city === city) ||
        !(kind === "all" || card.dataset.kind === kind) ||
        Number(card.dataset.guests) < guests ||
        Number(card.dataset.price) > budget;
      if (!card.hidden) visible++;
    }
    const empty = document.querySelector(".catalog-empty");
    if (empty) empty.hidden = visible > 0;
    updateLinks(selection());
  }
  function booking() {
    const valid = fields.every(
      (name) => !input(name) || input(name).checkValidity(),
    );
    const lines = document.querySelectorAll(".price-line");
    for (const line of lines) line.hidden = !valid;
    const error = document.querySelector(".selection-error");
    if (error) {
      error.hidden = valid;
      error.textContent = `Indicá entre 1 y ${scope.dataset.capacity} personas y revisá la fecha y los horarios.`;
    }
    const summary = document.querySelector(".guest-summary");
    if (summary)
      summary.textContent = valid
        ? `${input("guests").value} personas · Cantidad para el anfitrión`
        : "";
    if (!valid) return;
    updateLinks(selection());
    if (lines.length) {
      const minutes = (value) => {
        const [h, m] = value.split(":").map(Number);
        return h * 60 + m;
      };
      const duration =
        (minutes(input("end").value) - minutes(input("start").value) + 1440) %
          1440 || 1440;
      const hours = Math.ceil(duration / 60),
        price = Number(scope.dataset.price);
      lines[0].firstElementChild.textContent = `Gs. ${money(price)} × ${hours} horas`;
      lines[0].lastElementChild.textContent = `Gs. ${money(price * hours)}`;
      lines[2].lastElementChild.textContent = `Gs. ${money(price * hours)}`;
    }
  }
  if (scope) {
    for (const name of fields)
      if (params.get(name) && input(name)) input(name).value = params.get(name);
    scope.addEventListener("input", booking);
    scope.addEventListener("change", booking);
    scope.addEventListener("click", (event) => {
      if (!event.target.closest('a[href*="reserva-"]')) return;
      for (const name of fields)
        if (input(name) && !input(name).reportValidity()) {
          event.preventDefault();
          return;
        }
    });
    booking();
  }
  if (catalog) {
    catalog.addEventListener("change", filter);
    filter();
  }
})();
