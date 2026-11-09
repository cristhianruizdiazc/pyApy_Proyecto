import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { detailHref } from "./booking-selection.js";
import { money } from "@pyapy/contracts";
import { SearchEstimate } from "./SearchPropertyCard.jsx";
import "leaflet/dist/leaflet.css";
function Bounds({ items }) {
  const map = useMap();
  useEffect(() => {
    if (items.length)
      map.fitBounds(
        items.map((p) => [p.latitude, p.longitude]),
        { padding: [40, 40], maxZoom: 12, animate: false },
      );
  }, [items, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
function PropertyMarker({ p, selected, onSelect, origin, search }) {
  const ref = useRef(null);
  useEffect(() => {
    const marker = ref.current;
    const element = marker?.getElement();
    if (!element) return;
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute(
      "aria-label",
      `${p.name}, ${p.city}, Gs. ${money(p.pricePerHour)} por hora`,
    );
    element.setAttribute("aria-pressed", String(selected));
    const keydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(p.id);
        marker.openPopup();
      }
    };
    element.addEventListener("keydown", keydown);
    return () => element.removeEventListener("keydown", keydown);
  }, [p, selected, onSelect]);
  return (
    <CircleMarker
      ref={ref}
      center={[p.latitude, p.longitude]}
      radius={selected ? 14 : 11}
      pathOptions={{
        color: "#fff",
        weight: 3,
        fillColor: selected ? "#a64f2b" : "#0f3b2d",
        fillOpacity: 1,
      }}
      eventHandlers={{ click: () => onSelect?.(p.id) }}
    >
      <Popup>
        <strong>{p.name}</strong>
        <p>
          {p.isDemo && "Demo · "}
          {p.city} · Gs. {money(p.pricePerHour)}/h
        </p>
        <SearchEstimate p={p} />
        {p.isPublicSample && <p>Muestra · no admite reservas</p>}
        <Link to={detailHref(p.id, search, p, origin)}>Ver espacio</Link>
      </Popup>
    </CircleMarker>
  );
}
export default function PropertyMap({ items, selected, onSelect }) {
  const location = useLocation();
  const located = useMemo(
    () =>
      items.filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
      ),
    [items],
  );
  return (
    <MapContainer
      className="property-map"
      center={[-25.32, -57.35]}
      zoom={10}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Bounds items={located} />
      {located.map((p) => (
        <PropertyMarker
          key={p.id}
          p={p}
          selected={selected === p.id}
          onSelect={onSelect}
          search={location.search}
          origin={
            location.pathname === "/"
              ? `${location.pathname}${location.search}${location.hash}`
              : null
          }
        />
      ))}
    </MapContainer>
  );
}
