import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { apiGet } from "../../../services/api-client";
import { NicheSelect } from "../NicheSelect";

vi.mock("../../../services/api-client", () => ({ apiGet: vi.fn() }));

it("keeps the chosen niche on failure and supports retry with an empty registry", async () => {
  vi.mocked(apiGet).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ niches: [] });
  const onChange = vi.fn();
  render(<NicheSelect value="Laundry" onChange={onChange} />);
  expect(screen.getByRole("combobox", { name: "Niche" })).toBeDisabled();
  await screen.findByText(/Gagal memuat niche/);
  expect(screen.getByRole("combobox", { name: "Niche" })).toHaveValue("Laundry");
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  await screen.findByText("Tambahkan niche melalui Admin → Kategori.");
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Niche" })).toBeEnabled());
  expect(screen.getByRole("option", { name: "Tanpa niche" })).toBeInTheDocument();
});
