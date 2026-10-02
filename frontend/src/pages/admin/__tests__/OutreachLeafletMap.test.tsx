import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OutreachLeafletMap from "../OutreachLeafletMap";

const fixture = vi.hoisted(() => ({ popups: [] as HTMLElement[], events: {} as Record<string, () => void>, remove: vi.fn(), disconnect: vi.fn() }));
vi.mock("leaflet", () => ({ default: {
  map: () => ({ setView() { return this; }, fitBounds: vi.fn(), invalidateSize: vi.fn(), remove: fixture.remove }),
  tileLayer: () => ({ addTo() { return this; }, on(name: string, callback: () => void) { fixture.events[name] = callback; return this; } }),
  divIcon: vi.fn(), latLngBounds: vi.fn(),
  marker: () => ({ addTo() { return this; }, bindPopup(popup: HTMLElement) { fixture.popups.push(popup); return this; } }),
} }));
const point = { id: 1, name: '<img src=x onerror="alert(1)">', city: "Pasuruan", latitude: -7.6, longitude: 112.9, url: "https://www.google.com/maps/data=!3d-7.6!4d112.9" };
beforeEach(() => {
  vi.clearAllMocks(); fixture.popups.length = 0;
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = fixture.disconnect; });
});
describe("outreach map popup and lifecycle", () => {
  it("renders business text safely and links to its profile in a separate tab", () => {
    const view = render(<OutreachLeafletMap points={[point]} />);
    const popup = fixture.popups[0];
    expect(popup.querySelector("img")).toBeNull();
    expect(popup.querySelector("strong")?.textContent).toBe(point.name);
    expect(popup.querySelector("a")).toHaveAttribute("href", point.url);
    expect(popup.querySelector("a")).toHaveAttribute("rel", "noopener noreferrer");
    expect(popup.querySelector("a")).toHaveAttribute("target", "_blank");
    view.rerender(<OutreachLeafletMap points={[{ ...point, id: 2 }]} />);
    expect(fixture.remove).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(fixture.remove).toHaveBeenCalledTimes(2);
    expect(fixture.disconnect).toHaveBeenCalledTimes(2);
  });
  it("reports failed tiles while keeping the map available", () => {
    render(<OutreachLeafletMap points={[point]} />);
    act(() => fixture.events.tileerror());
    expect(screen.getByRole("status")).toHaveTextContent("Latar peta gagal dimuat.");
    expect(screen.getByRole("region", { name: "Peta lokasi prospek" })).toBeInTheDocument();
    act(() => fixture.events.tileload());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
