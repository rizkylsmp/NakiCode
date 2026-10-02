import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./outreach-map.css";
import { translateText, useLanguage } from "../../i18n/language";
import type { OutreachMapPoint } from "../../utils/outreach-map";

type Props = { points: OutreachMapPoint[]; selectedId: number | null; selectionVersion: number; onSelect: (id: number) => void };

export default function OutreachLeafletMap({ points, selectedId, selectionVersion, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef(new Map<number, L.Marker>());
  const selectionHandler = useRef(onSelect);
  const { language } = useLanguage();
  const [tileError, setTileError] = useState(false);
  useEffect(() => { selectionHandler.current = onSelect; }, [onSelect]);
  useEffect(() => {
    if (!container.current || !points.length) return;
    const map = L.map(container.current, { scrollWheelZoom: true, zoomAnimation: false }).setView([points[0].latitude, points[0].longitude], 14);
    mapRef.current = map;
    const markerIndex = markers.current;
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
      const marker = L.marker([point.latitude, point.longitude], { icon, title: point.name, alt: point.name, keyboard: true }).addTo(map).bindPopup(popup, { maxWidth: 240 });
      marker.on("click", () => selectionHandler.current(point.id));
      marker.on("keypress", (event: L.LeafletEvent & { originalEvent?: KeyboardEvent }) => {
        if (event.originalEvent?.key === "Enter") selectionHandler.current(point.id);
      });
      markerIndex.set(point.id, marker);
    }
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((point) => [point.latitude, point.longitude])), { padding: [36, 36], maxZoom: 15 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.stop(); map.remove(); mapRef.current = null; markerIndex.clear(); };
  }, [points, language]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.closePopup();
    const marker = selectedId === null ? undefined : markers.current.get(selectedId);
    if (!marker) return;
    const open = () => marker.openPopup();
    map.once("moveend", open);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    map.flyTo(marker.getLatLng(), 16, { duration: 0.65, animate: !reducedMotion });
    return () => {
      map.off("moveend", open);
      // The map setup effect cleans up first during unmount/StrictMode replay.
      // Leaflet stop() accesses panes that no longer exist after remove().
      if (mapRef.current === map) map.stop();
    };
  }, [selectedId, selectionVersion, points, language]);
  return <>
    <div ref={container} role="region" aria-label="Peta lokasi prospek" className="outreach-map relative isolate z-0 h-72 w-full rounded-xl bg-naki-frost sm:h-80" />
    {tileError && <p role="status" className="mt-2 text-sm text-naki-smoke">Latar peta gagal dimuat. Marker dan tautan Google Maps tetap dapat digunakan.</p>}
  </>;
}
