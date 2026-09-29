import { fireEvent, render, screen } from "@testing-library/react";
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
});
