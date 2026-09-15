import { render, screen } from "@testing-library/react";
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
}: {
  projects?: PortfolioItem[];
}) {
  const [deleteCandidateProject, setDeleteCandidateProject] =
    useState<PortfolioItem | null>(null);

  return (
    <PortfolioAdminPanel
      adminToken="admin-token"
      deleteCandidateProject={deleteCandidateProject}
      deletingProjectId={null}
      form={defaultPortfolioFormState}
      isModalOpen={false}
      isSaving={false}
      onCancelDelete={() => setDeleteCandidateProject(null)}
      onCloseModal={vi.fn()}
      onConfirmDelete={vi.fn()}
      onDelete={setDeleteCandidateProject}
      onOpenModal={vi.fn()}
      onReset={vi.fn()}
      onStartEdit={vi.fn()}
      onSubmit={vi.fn()}
      onUpdateField={vi.fn()}
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
});
