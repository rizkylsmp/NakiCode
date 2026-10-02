export type MapsLocation = { latitude: number; longitude: number; url: string };

/** Read a place position, never the @latitude,longitude camera position. */
export function getMapsLocation(value: string): MapsLocation | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!(["google.com", "www.google.com", "maps.google.com", "google.co.id", "www.google.co.id"].includes(url.hostname))) return null;
    if (!/^\/maps(?:\/|$)/.test(url.pathname) && url.hostname !== "maps.google.com") return null;
    const decoded = decodeURIComponent(url.pathname + url.search);
    const number = "(-?\\d+(?:\\.\\d+)?)";
    const place = decoded.match(new RegExp(`!3d${number}!4d${number}(?:!|$)`));
    const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";
    const coordinates = place ?? query.match(new RegExp(`^\\s*${number}\\s*,\\s*${number}\\s*$`));
    if (!coordinates) return null;
    const latitude = Number(coordinates[1]);
    const longitude = Number(coordinates[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude, url: url.href };
  } catch { return null; }
}

export type OutreachMapLead = { id: number; business_name: string; city: string; source_url: string; evidence_url: string; contact_url: string };
export type OutreachMapPoint = MapsLocation & { id: number; name: string; city: string };

export function getOutreachMapPoints(leads: OutreachMapLead[]): OutreachMapPoint[] {
  return leads.flatMap((lead) => {
    const location = [lead.source_url, lead.evidence_url, lead.contact_url].map(getMapsLocation).find(Boolean);
    return location ? [{ ...location, id: lead.id, name: lead.business_name, city: lead.city }] : [];
  });
}
