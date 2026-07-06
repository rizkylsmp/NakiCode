import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PortfolioItem } from "../../../domain/content";
import { defaultPortfolioFormState } from "../AdminTemplateWorkspace.shared";
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

function PortfolioPanelHarness() {
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
      projects={[project]}
      status=""
    />
  );
}

describe("PortfolioAdminPanel", () => {
  it("opens the delete confirmation dialog after clicking delete", async () => {
    const user = userEvent.setup();

    render(<PortfolioPanelHarness />);

    await user.click(screen.getByRole("button", { name: "Hapus Naki Showcase" }));

    expect(
      screen.getByText('Portofolio "Naki Showcase" akan dihapus secara permanen.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeEnabled();
  });
});
