import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, readLanguage, translateText } from "./language";
import { LanguageSwitch } from "../components/layout/LanguageSwitch";
import { budgetOptions } from "../domain/budget-options";
beforeEach(() => localStorage.clear());
describe("language selection", () => {
  it("defaults to Indonesian regardless of browser language", () =>
    expect(readLanguage()).toBe("id"));
  it("changes display copy, persists preference, and retains form values and refs", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <h1>Pesanan saya</h1>
        <input ref={ref} defaultValue="Pesanan saya" />
        <select aria-label="Budget">
          {budgetOptions.map((budget) => (
            <option key={budget} value={budget}>
              {budget}
            </option>
          ))}
        </select>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading")).toHaveTextContent("My orders");
    expect(ref.current?.value).toBe("Pesanan saya");
    expect(screen.getByRole("combobox")).toHaveValue("< Rp 1Jt");
    expect(
      screen.getByRole("option", { name: "< IDR 1m" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("naki-language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(screen.getByRole("button", { name: "Indonesian" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Pesanan saya");
  });
  it("does not translate user-entered content, links or unknown text", () => {
    expect(translateText("User project description", "en")).toBe(
      "User project description",
    );
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <p translate="no">Pesanan saya</p>
        <a href="/pesanan-saya">Pesanan saya</a>
        <textarea defaultValue="Pesanan saya" />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getAllByText("Pesanan saya")).toHaveLength(2);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/pesanan-saya");
    expect(screen.getByRole("textbox")).toHaveValue("Pesanan saya");
  });
  it("preserves user content in an untranslated subtree", () => {
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <section translate="no">
          <h2>Pesanan saya</h2>
        </section>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Pesanan saya");
  });
  it.each([
    ["Gagal menyimpan kategori.", "Could not save the category."],
    [
      "Gagal memuat order. Pastikan backend aktif.",
      "Could not load the order. Check that the API is available.",
    ],
    [
      "Login admin diperlukan untuk menghapus order.",
      "Administrator sign-in is required to delete the order.",
    ],
    ["Kategori berhasil diperbarui.", "Category updated."],
    ["Bayar DP 50%", "Pay a 50% deposit"],
  ])("translates known system status %s", (source, expected) => {
    expect(translateText(source, "en")).toBe(expected);
  });
});
