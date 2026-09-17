import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { money } from "@pyapy/contracts";
import "leaflet/dist/leaflet.css";
function Bounds({ items }) {
  const map = useMap();
  useEffect(() => {
    if (items.length)
      map.fitBounds(
        items.map((p) => [p.latitude, p.longitude]),
        { padding: [40, 40], maxZoom: 12 },
      );
  }, [items, map]);
  return null;
}
export default function PropertyMap({ items, selected, onSelect }) {
  return (
    <MapContainer
      className="property-map"
      center={[-25.32, -57.35]}
      zoom={10}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Bounds items={items} />
      {items.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={selected === p.id ? 13 : 9}
          pathOptions={{
            color: "#fff",
            weight: 3,
            fillColor: selected === p.id ? "#bd503e" : "#194b3b",
            fillOpacity: 1,
          }}
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Popup>
            <strong>{p.name}</strong>
            <p>
              {p.city} · Gs. {money(p.pricePerHour)}/h
            </p>
            <Link to={`/espacios/${p.id}`}>Ver espacio</Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
