import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/ui/Toast";
import type { TestimonialItem } from "../AdminDesignWorkspace.shared";
import { AdminTestimonialsSection } from "../AdminTestimonialsSection";

describe("AdminTestimonialsSection pagination", () => {
  it("paginates testimonials and keeps the control visible", async () => {
    const user = userEvent.setup();
    const testimonials: TestimonialItem[] = Array.from(
      { length: 11 },
      (_, index) => ({
        id: index + 1,
        source_type: "manual",
        rating_id: null,
        customer_name: `Customer ${index + 1}`,
        customer_role: "Owner",
        quote: `Testimoni ${index + 1}`,
        rating: 5,
        template_id: null,
        is_featured: true,
        sort_order: index,
        created_at: "2026-09-15T00:00:00.000Z",
        updated_at: "2026-09-15T00:00:00.000Z",
      }),
    );

    render(
      <ToastProvider>
        <AdminTestimonialsSection
          adminToken="admin-token"
          onTestimonialsChange={vi.fn()}
          testimonials={testimonials}
        />
      </ToastProvider>,
    );

    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toHaveTextContent("Halaman 1 dari 2");
    expect(screen.queryByText("Customer 11")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));

    expect(screen.getByText("Customer 11")).toBeInTheDocument();
  });
});
