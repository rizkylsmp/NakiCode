import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./outreach-map.css";
import { translateText, useLanguage } from "../../i18n/language";
import type { OutreachMapPoint } from "../../utils/outreach-map";

export default function OutreachLeafletMap({ points }: { points: OutreachMapPoint[] }) {
  const container = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current || !points.length) return;
    const map = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false }).setView([points[0].latitude, points[0].longitude], 14);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));
    const icon = L.divIcon({ className: "outreach-map-pin", html: '<span aria-hidden="true"></span>', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28] });
    for (const point of points) {
      const popup = document.createElement("div");
      popup.className = "outreach-map-popup";
      popup.setAttribute("data-no-translate", "");
      const name = document.createElement("strong");
      name.textContent = point.name;
      const city = document.createElement("p");
      city.textContent = point.city;
      const link = document.createElement("a");
      link.href = point.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = translateText("Lihat di Google Maps", language);
      popup.append(name, city, link);
      L.marker([point.latitude, point.longitude], { icon, title: point.name, alt: point.name, keyboard: true }).addTo(map).bindPopup(popup, { maxWidth: 240 });
    }
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((point) => [point.latitude, point.longitude])), { padding: [36, 36], maxZoom: 15 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [points, language]);
  return <>
    <div ref={container} role="region" aria-label="Peta lokasi prospek" className="outreach-map relative isolate z-0 h-72 w-full rounded-xl bg-naki-frost sm:h-80" />
    {tileError && <p role="status" className="mt-2 text-sm text-naki-smoke">Latar peta gagal dimuat. Marker dan tautan Google Maps tetap dapat digunakan.</p>}
  </>;
}
