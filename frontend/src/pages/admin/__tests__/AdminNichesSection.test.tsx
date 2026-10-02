import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { apiGet, apiPost, apiPut } from "../../../services/api-client";
import { AdminNichesSection } from "../AdminNichesSection";
vi.mock("../../../services/api-client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiGet).mockResolvedValue({
    niches: [{ id: 1, name: "Laundry", designCount: 2 }],
  });
});
it("adds and renames registry choices while blocking deletion of used niches", async () => {
  const niches = [
    { id: 1, name: "Laundry", designCount: 2 },
    { id: 2, name: "Interior", designCount: 0 },
  ];
  vi.mocked(apiPost).mockResolvedValue({ niches });
  vi.mocked(apiPut).mockResolvedValue({
    niches: [{ ...niches[0], name: "Laundry Express" }, niches[1]],
  });
  render(<AdminNichesSection />);
  await screen.findByText("Laundry");
  expect(
    screen.getByRole("button", { name: "Hapus niche Laundry" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Nama niche"), {
    target: { value: "Interior" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tambah niche" }));
  await screen.findByText("Interior");
  expect(apiPost).toHaveBeenCalledWith("/api/categories/niches", {
    name: "Interior",
  });
  fireEvent.click(screen.getByRole("button", { name: "Edit niche Laundry" }));
  fireEvent.change(screen.getByLabelText("Nama niche"), {
    target: { value: "Laundry Express" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Simpan niche" }));
  await waitFor(() =>
    expect(apiPut).toHaveBeenCalledWith("/api/categories/niches/1", {
      name: "Laundry Express",
    }),
  );
  await screen.findByText("Laundry Express");
});
