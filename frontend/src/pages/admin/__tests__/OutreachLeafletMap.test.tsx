import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OutreachLeafletMap from "../OutreachLeafletMap";

const fixture = vi.hoisted(() => ({ popups: [] as HTMLElement[], events: {} as Record<string, () => void>, markerClicks: [] as Array<() => void>, markerKeys: [] as Array<(event: { originalEvent: { key: string } }) => void>, openPopup: vi.fn(), flyTo: vi.fn(), stop: vi.fn(), remove: vi.fn(), disconnect: vi.fn(), options: {} as Record<string, unknown> }));
vi.mock("leaflet", () => ({ default: {
  map: (_container: HTMLElement, options: Record<string, unknown>) => { fixture.options = options; return { setView() { return this; }, fitBounds: vi.fn(), invalidateSize: vi.fn(), remove: fixture.remove, stop: fixture.stop, closePopup: vi.fn(), flyTo: fixture.flyTo, once(name: string, callback: () => void) { fixture.events[name] = callback; }, off: vi.fn() }; },
  tileLayer: () => ({ addTo() { return this; }, on(name: string, callback: () => void) { fixture.events[name] = callback; return this; } }),
  divIcon: vi.fn(), latLngBounds: vi.fn(),
  marker: (position: number[]) => ({ addTo() { return this; }, bindPopup(popup: HTMLElement) { fixture.popups.push(popup); return this; }, on(name: string, callback: () => void) { if (name === "click") fixture.markerClicks.push(callback); else fixture.markerKeys.push(callback); }, getLatLng: () => position, openPopup: fixture.openPopup }),
} }));
const point = { id: 1, name: '<img src=x onerror="alert(1)">', city: "Pasuruan", latitude: -7.6, longitude: 112.9, url: "https://www.google.com/maps/data=!3d-7.6!4d112.9" };
beforeEach(() => {
  vi.clearAllMocks(); fixture.popups.length = 0; fixture.markerClicks.length = 0; fixture.markerKeys.length = 0;
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = fixture.disconnect; });
});
describe("outreach map popup and lifecycle", () => {
  it("renders business text safely and links to its profile in a separate tab", () => {
    const view = render(<OutreachLeafletMap points={[point]} selectedId={null} selectionVersion={0} onSelect={vi.fn()} />);
    const popup = fixture.popups[0];
    expect(popup.querySelector("img")).toBeNull();
    expect(popup.querySelector("strong")?.textContent).toBe(point.name);
    expect(popup.querySelector("a")).toHaveAttribute("href", point.url);
    expect(popup.querySelector("a")).toHaveAttribute("rel", "noopener noreferrer");
    expect(popup.querySelector("a")).toHaveAttribute("target", "_blank");
    view.rerender(<OutreachLeafletMap points={[{ ...point, id: 2 }]} selectedId={null} selectionVersion={0} onSelect={vi.fn()} />);
    expect(fixture.remove).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(fixture.remove).toHaveBeenCalledTimes(2);
    expect(fixture.disconnect).toHaveBeenCalledTimes(2);
  });
  it("reports failed tiles while keeping the map available", () => {
    render(<OutreachLeafletMap points={[point]} selectedId={null} selectionVersion={0} onSelect={vi.fn()} />);
    act(() => fixture.events.tileerror());
    expect(screen.getByRole("status")).toHaveTextContent("Latar peta gagal dimuat.");
    expect(screen.getByRole("region", { name: "Peta lokasi prospek" })).toBeInTheDocument();
    act(() => fixture.events.tileload());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("flies to list selection, opens its popup, and selects the detail on marker click", () => {
    const points = [point, { ...point, id: 2, latitude: 51.5, longitude: -0.12 }];
    const onSelect = vi.fn();
    const view = render(<OutreachLeafletMap points={points} selectedId={1} selectionVersion={0} onSelect={onSelect} />);
    expect(fixture.options.scrollWheelZoom).toBe(true);
    expect(fixture.flyTo).toHaveBeenLastCalledWith([-7.6, 112.9], 16, expect.any(Object));
    act(() => fixture.events.moveend());
    expect(fixture.openPopup).toHaveBeenCalledOnce();
    act(() => fixture.markerClicks[1]());
    expect(onSelect).toHaveBeenCalledWith(2);
    act(() => fixture.markerKeys[1]({ originalEvent: { key: "Enter" } }));
    expect(onSelect).toHaveBeenCalledTimes(2);
    view.rerender(<OutreachLeafletMap points={points} selectedId={2} selectionVersion={1} onSelect={onSelect} />);
    expect(fixture.flyTo).toHaveBeenLastCalledWith([51.5, -0.12], 16, expect.any(Object));
    expect(fixture.remove).not.toHaveBeenCalled();
    const flights = fixture.flyTo.mock.calls.length;
    view.rerender(<OutreachLeafletMap points={points} selectedId={2} selectionVersion={2} onSelect={onSelect} />);
    expect(fixture.flyTo.mock.calls.length).toBe(flights + 1);
    view.rerender(<OutreachLeafletMap points={points} selectedId={999} selectionVersion={3} onSelect={onSelect} />);
    expect(fixture.flyTo.mock.calls.length).toBe(flights + 1);
  });
});
