import { describe, expect, it } from "vitest";
import { getMapsLocation, getOutreachMapPoints } from "../outreach-map";

describe("Google Maps place coordinates", () => {
  it("uses the business position rather than the camera position", () => {
    const url = "https://www.google.com/maps/place/Business/@-7.1,112.1,17z/data=!8m2!3d-7.677203!4d112.8856981!16s%2Fg%2Fexample";
    expect(getMapsLocation(url)).toEqual({ latitude: -7.677203, longitude: 112.8856981, url });
    expect(getMapsLocation("https://www.google.com/maps/place/Business/@-7.1,112.1,17z")).toBeNull();
  });
  it("supports explicit coordinates abroad and encoded place URLs", () => {
    expect(getMapsLocation("https://www.google.com/maps/search/?api=1&query=51.5%2C-0.12")).toMatchObject({ latitude: 51.5, longitude: -0.12 });
    expect(getMapsLocation("https://www.google.co.id/maps/place/Business/data=%213d-7.6%214d112.9")).toMatchObject({ latitude: -7.6, longitude: 112.9 });
  });
  it.each([
    "javascript:alert(1)", "https://google.com.evil.test/maps/data=!3d1!4d2",
    "https://evil.test/maps/data=!3d1!4d2", "https://user@google.com/maps/data=!3d1!4d2",
    "https://google.com/maps/data=!3d91!4d2", "https://google.com/maps/data=!3d1!4d181",
    "https://google.com/search?q=1,2", "https://maps.app.goo.gl/example",
    "https://google.com/maps/data=%invalid", "https://google.com/maps/data=!3d1!4d2garbage",
  ])("skips unsafe or unresolvable URL %s", (url) => expect(getMapsLocation(url)).toBeNull());
  it("falls back to the evidence profile and skips leads without coordinates", () => {
    const lead = { id: 1, business_name: "<script>business</script>", city: "Pasuruan", source_url: "https://example.test", evidence_url: "https://google.com/maps/data=!3d-7.6!4d112.9", contact_url: "" };
    expect(getOutreachMapPoints([lead, { ...lead, id: 2, evidence_url: "" }])).toEqual([{ id: 1, name: lead.business_name, city: "Pasuruan", latitude: -7.6, longitude: 112.9, url: lead.evidence_url }]);
  });
});
