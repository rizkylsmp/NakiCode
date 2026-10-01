import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { TemplateItem } from "../../../domain/content";
import { DesignCard } from "../DesignCard";

const template: TemplateItem = {
  id: 7,
  slug: "studio-preview",
  title: "Studio Preview",
  category: "Portfolio",
  description: "Design portfolio dengan preview video.",
  price: "Rp149K",
  stack: ["React"],
  level: "Pemula",
  rating: 0,
  accentClass: "bg-naki-secondary",
  preview: [{ image: "https://example.com/cover.webp", caption: "Cover" }],
  videoUrl: "https://example.com/preview.mp4",
  demoUrl: "#",
  buyerCount: 0,
  features: [],
  includedFiles: [],
  sourceCode: [],
  suitableFor: [],
  license: "Personal",
  support: "Setup dasar",
  reviews: [],
};

describe("DesignCard", () => {
  it("prioritizes the uploaded video and keeps the cover as its poster", () => {
    const { container } = render(
      <MemoryRouter>
        <DesignCard
          isAuthenticated
          isFavorite={false}
          isFavoriteLoading={false}
          onToggleFavorite={() => undefined}
          template={template}
        />
      </MemoryRouter>,
    );

    const video = container.querySelector("video");

    expect(video).toHaveAttribute("src", template.videoUrl);
    expect(video).toHaveAttribute("poster", template.preview[0].image);
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveClass("object-contain");
    expect(screen.getByTestId("design-card-media")).toHaveClass("aspect-[4/3]");
    expect(screen.getByText("Video preview")).toHaveClass("z-20");
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveClass("z-20");
    expect(
      screen.getByRole("button", { name: /simpan studio preview/i })
        .parentElement,
    ).toHaveClass("z-20");
    expect(container.querySelector('img[alt=""]')).toHaveClass(
      "object-cover",
      "blur-xl",
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("uses a blurred cover behind a contained image preview", () => {
    const imageTemplate = { ...template, videoUrl: null };
    const { container } = render(
      <MemoryRouter>
        <DesignCard
          isAuthenticated={false}
          isFavorite={false}
          isFavoriteLoading={false}
          onToggleFavorite={() => undefined}
          template={imageTemplate}
        />
      </MemoryRouter>,
    );

    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(2);
    expect(images[0]).toHaveClass("object-cover", "blur-xl");
    expect(images[1]).toHaveClass("object-contain");
    expect(images[1]).toHaveAttribute("alt", template.title);
  });

  it("shows the configured demo link", () => {
    render(
      <MemoryRouter>
        <DesignCard
          isAuthenticated={false}
          isFavorite={false}
          isFavoriteLoading={false}
          onToggleFavorite={() => undefined}
          template={{
            ...template,
            videoUrl: null,
            demoUrl: "https://demo.example.com",
          }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /buka demo studio preview/i }),
    ).toHaveAttribute("href", "https://demo.example.com");
    expect(screen.getByText("Rp. 149.000,-")).toBeInTheDocument();
  });

  it.each(["#", "javascript:alert(1)", "https://", ""])(
    "does not expose an invalid demo URL: %s",
    (demoUrl) => {
      render(
        <MemoryRouter>
          <DesignCard
            isAuthenticated={false}
            isFavorite={false}
            isFavoriteLoading={false}
            onToggleFavorite={() => undefined}
            template={{ ...template, demoUrl }}
          />
        </MemoryRouter>,
      );
      expect(
        screen.queryByRole("link", { name: /buka demo/i }),
      ).not.toBeInTheDocument();
    },
  );
});
