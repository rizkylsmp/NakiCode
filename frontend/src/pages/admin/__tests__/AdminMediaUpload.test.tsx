import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PreviewDropZone,
  SourceCodeUpload,
  defaultFormState,
} from "../AdminTemplateWorkspace.shared";
import { TemplateFormModal } from "../TemplateFormModal";

const apiUploadMock = vi.hoisted(() => vi.fn());

vi.mock("../../../services/api-client", () => ({
  apiUpload: apiUploadMock,
}));

beforeEach(() => {
  apiUploadMock.mockReset();
});

describe("PreviewDropZone", () => {
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
    expect(screen.getByRole("button", { name: "Simpan draft" })).toBeDisabled();

    finishUpload({ video: { url: "/uploads/preview.mp4" } });

    await waitFor(() => {
      expect(onUpdateField).toHaveBeenCalledWith(
        "videoUrl",
        "/uploads/preview.mp4",
      );
    });
    expect(screen.getByText(/1 video berhasil diupload/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan draft" })).toBeEnabled();
  });

  it("keeps edit mode from the form id and does not regenerate its slug", () => {
    const onUpdateField = vi.fn();

    render(
      <TemplateFormModal
        categoryOptions={["Portfolio"]}
        form={{
          ...defaultFormState,
          id: 8,
          slug: "slug-tetap",
          title: "Design Lama",
        }}
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

    expect(
      screen.getByRole("heading", { name: "Edit design" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Judul"), {
      target: { value: "Design Baru" },
    });

    expect(onUpdateField).toHaveBeenCalledWith("title", "Design Baru");
    expect(onUpdateField).not.toHaveBeenCalledWith("slug", expect.anything());
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
