import { describe, expect, it } from "vitest";
import { getOutreachNiche, matchRegisteredNiche } from "../outreach-niche";

describe("outreach niche labels", () => {
  it.each([
    ["Jasa laundry", "Laundry"],
    ["Ekspedisi cargo dan shipping", "Ekspedisi (Courier/Shipping)"],
    ["Jasa pengiriman", "Ekspedisi (Courier/Shipping)"],
    ["Expedisi", "Ekspedisi (Courier/Shipping)"],
    ["Jasa pencucian mobil", "Otomotif"],
    ["Desain interior dan furniture custom", "Interior & Arsitektur"],
    ["Arsitektur interior dan design-build", "Interior & Arsitektur"],
    ["Kontraktor sipil dan interior", "Interior & Arsitektur"],
    ["Workshop dan corporate training", "Training & Pendidikan"],
    ["Pelatihan korporat dan kelas publik", "Training & Pendidikan"],
    ["Jasa", null],
    ["Laundry dan restoran", null],
  ])("classifies %s without guessing mixed or generic categories", (category, expected) => {
    expect(getOutreachNiche(category)).toBe(expected);
  });
  it("matches a registered niche and refuses ambiguous registry choices", () => {
    expect(matchRegisteredNiche("Laundry", [{ name: "Laundry" }])).toBe("Laundry");
    expect(matchRegisteredNiche("Interior & Arsitektur", [{ name: "Interior" }])).toBe("Interior");
    expect(matchRegisteredNiche("Interior & Arsitektur", [{ name: "Interior" }, { name: "Arsitektur" }])).toBeNull();
    expect(matchRegisteredNiche("Laundry", [])).toBeNull();
    expect(matchRegisteredNiche("Ekspedisi (Courier/Shipping)", [{ name: "Shipping" }])).toBe("Shipping");
    expect(matchRegisteredNiche("Kesehatan", [{ name: "Dental" }])).toBeNull();
  });
});
