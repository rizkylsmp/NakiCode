import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./api-client";

describe("getApiErrorMessage", () => {
  it("includes field details instead of only the generic validation message", () => {
    const error = new AxiosError("Request failed");
    error.response = {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: {} } as never,
      data: {
        message: "Input tidak valid",
        errors: {
          fieldErrors: {
            title: ["Judul wajib diisi"],
            price: ["Harga tidak valid"],
          },
        },
      },
    };
    expect(getApiErrorMessage(error)).toBe(
      "Periksa input: title: Judul wajib diisi; price: Harga tidak valid",
    );
  });
});
