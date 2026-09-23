import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "../../services/api-client";
import { renderWithProviders } from "../../test/render";
import { PortfolioPage } from "../PortfolioPage";

vi.mock("../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../services/api-client")
  >("../../services/api-client");

  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const firstPortfolio = {
  id: 1,
  title: "Portfolio Pertama",
  category: "Company Profile",
  description: "Halaman pertama",
  result: "Selesai",
  websiteUrl: "#",
  imageUrl: "https://example.com/first.jpg",
  imageUrls: ["https://example.com/first.jpg"],
  coverIndex: 0,
};

describe("PortfolioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    vi.mocked(apiGet).mockImplementation(async (path) => {
      const isSecondPage = path.includes("page=2");

      return {
        source: "mysql",
        projects: [
          isSecondPage
            ? { ...firstPortfolio, id: 10, title: "Portfolio Kesepuluh" }
            : firstPortfolio,
        ],
        page: isSecondPage ? 2 : 1,
        pageSize: 9,
        total: 10,
        totalPages: 2,
      };
    });
  });

  it("loads every portfolio page through the public pagination", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <HelmetProvider>
        <PortfolioPage />
      </HelmetProvider>,
      { route: "/portofolio" },
    );

    expect(await screen.findByText("Portfolio Pertama")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 1-9 dari 10 portofolio")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(
      "Halaman 1 dari 2",
    );

    await user.click(screen.getByRole("link", { name: "Berikutnya" }));

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/projects?page=2&pageSize=9"),
    );
    expect(await screen.findByText("Portfolio Kesepuluh")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 10-10 dari 10 portofolio")).toBeInTheDocument();
  });
});
