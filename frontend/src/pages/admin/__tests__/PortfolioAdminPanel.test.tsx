import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PortfolioItem } from "../../../domain/content";
import { defaultPortfolioFormState } from "../AdminDesignWorkspace.shared";
import { PortfolioAdminPanel } from "../PortfolioAdminPanel";

const project: PortfolioItem = {
  id: 7,
  title: "Naki Showcase",
  category: "Company Profile",
  description: "Website portfolio untuk brand digital.",
  result: "Conversion naik",
  websiteUrl: "https://example.com",
  imageUrl: "https://example.com/cover.jpg",
  imageUrls: ["https://example.com/cover.jpg"],
  coverIndex: 0,
};

function PortfolioPanelHarness({
  projects = [project],
  categoryOptions = ["Company Profile", "E-Commerce"],
  isModalOpen = false,
  initialForm = defaultPortfolioFormState,
}: {
  projects?: PortfolioItem[];
  categoryOptions?: string[];
  isModalOpen?: boolean;
  initialForm?: typeof defaultPortfolioFormState;
}) {
  const [deleteCandidateProject, setDeleteCandidateProject] =
    useState<PortfolioItem | null>(null);
  const [form, setForm] = useState(initialForm);

  return (
    <PortfolioAdminPanel
      adminToken="admin-token"
      categoryOptions={categoryOptions}
      deleteCandidateProject={deleteCandidateProject}
      deletingProjectId={null}
      form={form}
      isModalOpen={isModalOpen}
      isSaving={false}
      onCancelDelete={() => setDeleteCandidateProject(null)}
      onCloseModal={vi.fn()}
      onConfirmDelete={vi.fn()}
      onDelete={setDeleteCandidateProject}
      onOpenModal={vi.fn()}
      onReset={vi.fn()}
      onStartEdit={vi.fn()}
      onSubmit={vi.fn()}
      onUpdateField={(key, value) =>
        setForm((current) => ({ ...current, [key]: value }))
      }
      projects={projects}
      status=""
    />
  );
}

describe("PortfolioAdminPanel", () => {
  it("shows pagination on a single page and limits long lists", async () => {
    const user = userEvent.setup();
    const projects = Array.from({ length: 11 }, (_, index) => ({
      ...project,
      id: index + 1,
      title: `Project ${index + 1}`,
    }));

    render(<PortfolioPanelHarness projects={projects} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(
      "Halaman 1 dari 2",
    );
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.queryByText("Project 11")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));

    expect(screen.getByText("Project 11")).toBeInTheDocument();
    expect(screen.queryByText("Project 1")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Maksimal data per halaman"),
      "20",
    );

    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toHaveTextContent("Halaman 1 dari 1");
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("Project 11")).toBeInTheDocument();
  });

  it("opens the delete confirmation dialog after clicking delete", async () => {
    const user = userEvent.setup();

    render(<PortfolioPanelHarness />);

    await user.click(screen.getByRole("button", { name: "Hapus Naki Showcase" }));

    expect(
      screen.getByText('Portofolio "Naki Showcase" akan dihapus dari website.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ya, hapus portofolio" }),
    ).toBeEnabled();
  });

  it("uses registered categories in the portfolio form", async () => {
    const user = userEvent.setup();

    render(
      <PortfolioPanelHarness
        categoryOptions={["Company profile", "Toko Online"]}
        isModalOpen
      />,
    );

    const categorySelect = screen.getByRole("combobox", {
      name: "Kategori",
    });

    expect(categorySelect).toHaveTextContent("Company profile");
    expect(categorySelect).toHaveTextContent("Toko Online");

    await user.selectOptions(categorySelect, "Toko Online");

    expect(categorySelect).toHaveValue("Toko Online");
  });

  it("shows photos vertically and makes the first dragged photo the cover", () => {
    render(
      <PortfolioPanelHarness
        initialForm={{
          ...defaultPortfolioFormState,
          title: "Portfolio Drag",
          imageUrl: "https://example.com/two.jpg",
          imageUrls: [
            "https://example.com/one.jpg",
            "https://example.com/two.jpg",
            "https://example.com/three.jpg",
          ],
          coverIndex: 1,
        }}
        isModalOpen
      />,
    );

    const photoList = screen.getByRole("list", {
      name: "Urutan foto portofolio",
    });
    let photoItems = within(photoList).getAllByRole("listitem");

    expect(photoItems[0]).toHaveAttribute("draggable", "true");
    expect(within(photoItems[0]).getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/two.jpg",
    );
    expect(photoItems[0]).toHaveAccessibleName("Foto 1, cover");

    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
      getData: vi.fn(() => "2"),
    };

    fireEvent.dragStart(photoItems[2], { dataTransfer });
    fireEvent.dragOver(photoItems[0], { dataTransfer });
    fireEvent.drop(photoItems[0], { dataTransfer });

    photoItems = within(photoList).getAllByRole("listitem");
    expect(within(photoItems[0]).getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/three.jpg",
    );
    expect(photoItems[0]).toHaveAccessibleName("Foto 1, cover");
  });
});
