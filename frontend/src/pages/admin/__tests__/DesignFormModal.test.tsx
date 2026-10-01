import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { defaultFormState } from "../AdminDesignWorkspace.shared";
import { DesignFormModal } from "../DesignFormModal";

function PriceForm() {
  const [form, setForm] = useState({
    ...defaultFormState,
    price: "",
    sourceAvailable: true,
  });

  return (
    <DesignFormModal
      adminToken={null}
      categoryOptions={[]}
      form={form}
      isOpen
      isSaving={false}
      onClose={vi.fn()}
      onStartCreate={vi.fn()}
      onSubmitTemplate={vi.fn()}
      onUpdateField={(key, value) =>
        setForm((current) => ({ ...current, [key]: value }))
      }
      selectedTemplate={undefined}
    />
  );
}

describe("DesignFormModal price preview", () => {
  it("shows the rupiah amount below Harga while typing", () => {
    render(<PriceForm />);
    fireEvent.click(screen.getByRole("tab", { name: /Penjualan/ }));

    fireEvent.change(screen.getByLabelText("Harga"), {
      target: { value: "5000000" },
    });

    expect(screen.getByText("Rp. 5.000.000,-")).toBeInTheDocument();
  });

  it("lists missing fields, marks them, and focuses the first invalid input", () => {
    const submit = vi.fn();
    render(
      <DesignFormModal
        adminToken={null}
        categoryOptions={["Portfolio"]}
        form={{ ...defaultFormState, title: "", category: "", description: "" }}
        isOpen
        isSaving={false}
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={submit}
        onUpdateField={vi.fn()}
        selectedTemplate={undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Simpan draft$/ }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Judul")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Kategori")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Deskripsi")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Judul")).toHaveFocus();
  });

  it("opens Media for an invalid demo URL", () => {
    const submit = vi.fn();
    render(
      <DesignFormModal
        adminToken={null}
        categoryOptions={["Portfolio"]}
        form={{
          ...defaultFormState,
          title: "Studio",
          description: "Design studio.",
          demoUrl: "javascript:alert(1)",
        }}
        isOpen
        isSaving={false}
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={submit}
        onUpdateField={vi.fn()}
        selectedTemplate={undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Simpan draft$/ }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: /Media/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("Demo URL")).toHaveFocus();
  });

  it("shows server field errors on the relevant tab and retains form values", async () => {
    const submit = vi
      .fn()
      .mockResolvedValue({ price: "Harga terlalu panjang." });
    render(
      <DesignFormModal
        adminToken={null}
        categoryOptions={["Portfolio"]}
        form={{
          ...defaultFormState,
          title: "Studio",
          description: "Design studio.",
        }}
        isOpen
        isSaving={false}
        onClose={vi.fn()}
        onStartCreate={vi.fn()}
        onSubmitTemplate={submit}
        onUpdateField={vi.fn()}
        selectedTemplate={undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Simpan draft$/ }));
    await waitFor(() =>
      expect(screen.getByLabelText("Harga")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByLabelText("Harga")).toHaveValue(defaultFormState.price);
    await waitFor(() => expect(screen.getByLabelText("Harga")).toHaveFocus());
  });
});
