import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogAdminPanel } from "../BlogAdminPanel";
import { defaultBlogPostFormState } from "../AdminTemplateWorkspace.shared";

const post = {
  id: 7,
  slug: "artikel-uji",
  title: "Artikel Uji",
  excerpt: "Ringkasan artikel uji.",
  content: "Konten artikel uji.",
  author: "Naki Code",
  coverImage: null,
  status: "published",
  publishedAt: "2026-09-09T00:00:00.000Z",
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
};

function renderPanel(isDeleting = false, paginatedPosts = [post]) {
  const onConfirmDelete = vi.fn();

  render(
    <BlogAdminPanel
      paginatedPosts={paginatedPosts}
      totalPosts={paginatedPosts.length}
      page={1}
      totalPages={1}
      search=""
      selectedId={null}
      status=""
      isSaving={false}
      isDeleting={isDeleting}
      isModalOpen={false}
      deletingPost={post}
      form={defaultBlogPostFormState}
      adminToken="admin-token"
      onSearchChange={vi.fn()}
      onPageChange={vi.fn()}
      onStartCreate={vi.fn()}
      onStartEdit={vi.fn()}
      onDelete={vi.fn()}
      onOpenModal={vi.fn()}
      onCloseModal={vi.fn()}
      onFormChange={vi.fn()}
      onSubmit={vi.fn()}
      onConfirmDelete={onConfirmDelete}
      onCancelDelete={vi.fn()}
    />,
  );

  return { onConfirmDelete };
}

describe("BlogAdminPanel delete confirmation", () => {
  it("keeps the confirm button enabled after an article is selected", () => {
    const { onConfirmDelete } = renderPanel();
    const confirmButton = screen.getByRole("button", {
      name: "Ya, hapus artikel",
    });

    expect(confirmButton).toBeEnabled();
    fireEvent.click(confirmButton);
    expect(onConfirmDelete).toHaveBeenCalledOnce();
  });

  it("disables confirmation only while the delete request is running", () => {
    renderPanel(true);

    expect(
      screen.getByRole("button", { name: "Menghapus..." }),
    ).toBeDisabled();
  });

  it("keeps the selected article available if pagination results change", () => {
    const { onConfirmDelete } = renderPanel(false, []);

    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus artikel" }));

    expect(screen.getByText(/hapus artikel "Artikel Uji"/i)).toBeInTheDocument();
    expect(onConfirmDelete).toHaveBeenCalledOnce();
  });
});
