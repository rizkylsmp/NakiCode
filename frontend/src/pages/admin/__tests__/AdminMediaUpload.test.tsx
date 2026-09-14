import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PreviewDropZone,
  SourceCodeUpload,
  defaultFormState,
  normalizeDesignSlug,
  updateTemplateFormField,
} from "../AdminTemplateWorkspace.shared";
import { TemplateFormModal } from "../TemplateFormModal";

const apiUploadMock = vi.hoisted(() => vi.fn());

vi.mock("../../../services/api-client", () => ({
  apiUpload: apiUploadMock,
}));

beforeEach(() => {
  apiUploadMock.mockReset();
});

describe("updateTemplateFormField", () => {
  it("accepts a slug pasted as a design path or full URL", () => {
    expect(normalizeDesignSlug("/design/naki-nightfall")).toBe(
      "naki-nightfall",
    );
    expect(
      normalizeDesignSlug("https://nakicode.com/design/naki-nightfall"),
    ).toBe("naki-nightfall");
  });

  it("keeps a manually edited slug", () => {
    const updated = updateTemplateFormField(
      { ...defaultFormState, id: 8, slug: "slug-lama" },
      "slug",
      "slug-baru",
    );

    expect(updated.slug).toBe("slug-baru");
  });

  it("only regenerates slug from title for a new design", () => {
    const created = updateTemplateFormField(
      { ...defaultFormState, slug: "" },
      "title",
      "Design Baru",
    );
    const edited = updateTemplateFormField(
      { ...defaultFormState, id: 8, slug: "slug-tetap" },
      "title",
      "Judul Baru",
    );

    expect(created.slug).toBe("design-baru");
    expect(edited.slug).toBe("slug-tetap");
  });
});

describe("PreviewDropZone", () => {
  it("places Level below Judul on mobile and beside Slug on desktop", () => {
    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{ ...defaultFormState }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Judul").parentElement?.parentElement).toHaveClass(
      "order-1",
    );
    expect(screen.getByLabelText("Level").parentElement?.parentElement).toHaveClass(
      "order-2",
      "md:order-3",
    );
    expect(screen.getByLabelText("Slug").parentElement?.parentElement).toHaveClass(
      "order-4",
    );
  });

  it("uses one file input for both images and videos", () => {
    const { container } = render(
      <PreviewDropZone
        adminToken="admin-token"
        value={[]}
        videoValue=""
        onChange={vi.fn()}
        onVideoChange={vi.fn()}
      />,
    );

    const fileInputs = container.querySelectorAll('input[type="file"]');

    expect(fileInputs).toHaveLength(1);
    expect(fileInputs[0]).toHaveAttribute(
      "accept",
      "image/*,video/mp4,video/webm,video/quicktime,.mov",
    );
    expect(
      screen.getByText(/drag & drop gambar atau video/i),
    ).toBeInTheDocument();
  });

  it("shows uploaded video and images in the same media list", () => {
    const { container } = render(
      <PreviewDropZone
        adminToken="admin-token"
        value={[{ image: "/uploads/cover.webp", caption: "Cover" }]}
        videoValue="/uploads/preview.mp4"
        onChange={vi.fn()}
        onVideoChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Media terupload")).toBeInTheDocument();
    expect(screen.getByText("2 file")).toBeInTheDocument();
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "/uploads/preview.mp4",
    );
    expect(screen.getByRole("img", { name: "Cover" })).toBeInTheDocument();
  });

  it("keeps uploading while the admin fills another tab", async () => {
    let finishUpload!: (value: { video: { url: string } }) => void;
    apiUploadMock.mockReturnValueOnce(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );
    const onUpdateField = vi.fn();

    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{ ...defaultFormState }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={vi.fn()}
        onUpdateField={onUpdateField}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Media/i }));
    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"][accept*="video/mp4"]',
    );
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, {
      target: {
        files: [new File(["preview"], "preview.mp4", { type: "video/mp4" })],
      },
    });

    expect(
      await screen.findByText(/tetap bisa mengisi tab lain/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Informasi/i }));

    expect(
      screen.getByText(/tetap bisa mengisi tab lain/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Simpan draft$/ }),
    ).toBeDisabled();

    finishUpload({ video: { url: "/uploads/preview.mp4" } });

    await waitFor(() => {
      expect(onUpdateField).toHaveBeenCalledWith(
        "videoUrl",
        "/uploads/preview.mp4",
      );
    });
    expect(screen.getByText(/1 video berhasil diupload/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Simpan draft$/ }),
    ).toBeEnabled();
  });

  it("keeps edit mode from the form id and does not regenerate its slug", () => {
    const onUpdateField = vi.fn();
    const onSubmitTemplate = vi.fn();

    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{
          ...defaultFormState,
          id: 8,
          slug: "slug-tetap",
          title: "Design Lama",
          description: "Deskripsi design lama.",
        }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={onSubmitTemplate}
        onUpdateField={onUpdateField}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Edit design" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Judul"), {
      target: { value: "Design Baru" },
    });

    expect(onUpdateField).toHaveBeenCalledWith("title", "Design Baru");
    expect(onUpdateField).not.toHaveBeenCalledWith("slug", expect.anything());
    fireEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );
    expect(onSubmitTemplate).toHaveBeenCalledWith("draft");
  });

  it("marks a slug used by another design and blocks saving", () => {
    const onSubmitTemplate = vi.fn();

    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        existingSlugs={[
          { id: 8, slug: "design-sendiri" },
          { id: 9, slug: "slug-terpakai" },
        ]}
        form={{
          ...defaultFormState,
          id: 8,
          title: "Design Uji",
          category: "Portfolio",
          description: "Deskripsi design.",
          slug: "slug-terpakai",
        }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={onSubmitTemplate}
        onUpdateField={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Slug sudah digunakan oleh design lain."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /^Simpan perubahan$/ }),
    );

    expect(onSubmitTemplate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Gunakan slug lain sebelum menyimpan design/i),
    ).toBeInTheDocument();
  });

  it("moves draft and publish choices into the save menu", () => {
    const onSubmitTemplate = vi.fn();

    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{
          ...defaultFormState,
          title: "Design Siap",
          category: "Portfolio",
          description: "Deskripsi design.",
          slug: "design-siap",
        }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={onSubmitTemplate}
        onUpdateField={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Penjualan/i }));
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Status saat ini")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Penjualan source code" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Pilih cara menyimpan" }),
    );
    expect(
      screen.getByRole("menuitem", { name: /Simpan sebagai draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Publikasikan/i }),
    ).toBeInTheDocument();

    const publishAction = screen.getByRole("menuitem", {
      name: /Publikasikan/i,
    });
    fireEvent.click(publishAction);
    expect(onSubmitTemplate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Design published memerlukan minimal satu gambar/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Pilih cara menyimpan" }),
    );
    const draftAction = screen.getByRole("menuitem", {
      name: /Simpan sebagai draft/i,
    });
    fireEvent.click(draftAction);
    expect(onSubmitTemplate).toHaveBeenCalledOnce();
    expect(onSubmitTemplate).toHaveBeenCalledWith("draft");
  });

  it("uses the Naki dialog for unsaved changes", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{ ...defaultFormState }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={onClose}
        onStartCreate={vi.fn()}
        onSubmitTemplate={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    );

    rerender(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{ ...defaultFormState, title: "Draft berubah" }}
        isOpen
        isSaving={false}
        selectedTemplate={undefined}
        adminToken="admin-token"
        onClose={onClose}
        onStartCreate={vi.fn()}
        onSubmitTemplate={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup form" }));

    expect(
      screen.getByRole("alertdialog", { name: "Draft ini belum disimpan" }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Kembali mengedit" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("SourceCodeUpload", () => {
  it("uploads a real source package and stores its returned URL", async () => {
    apiUploadMock.mockResolvedValueOnce({
      source: { name: "design.zip", url: "/uploads/source/design.zip" },
    });
    const onChange = vi.fn();
    const { container } = render(
      <SourceCodeUpload
        adminToken="admin-token"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["source"], "design.zip")] },
    });

    await waitFor(() => {
      expect(apiUploadMock).toHaveBeenCalledWith(
        "/api/uploads/source",
        expect.any(FormData),
      );
      expect(onChange).toHaveBeenCalledWith("/uploads/source/design.zip");
    });
  });
});
