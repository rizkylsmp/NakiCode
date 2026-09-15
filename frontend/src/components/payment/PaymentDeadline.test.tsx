import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatRemainingTime, PaymentDeadline } from "./PaymentDeadline";

describe("PaymentDeadline", () => {
  it("shows the remaining payment time", () => {
    expect(formatRemainingTime(3_661_000)).toBe("1 jam 1 menit");
    expect(formatRemainingTime(61_000)).toBe("1 menit 1 detik");
  });

  it("reports an expired deadline to its parent", async () => {
    const onExpire = vi.fn();
    render(
      <PaymentDeadline
        expiresAt="2020-01-01T00:00:00.000Z"
        onExpire={onExpire}
      />,
    );

    expect(
      screen.getByText("Batas pembayaran telah berakhir"),
    ).toBeInTheDocument();
    await waitFor(() => expect(onExpire).toHaveBeenCalledOnce());
  });
});
