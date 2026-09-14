import { BadgeCheck, MessageCircle } from "lucide-react";
import categorySeoItems from "../../domain/category-seo.json";
import { slugifyTemplateCategory } from "../../utils/template-url";

type CategorySeoItem = (typeof categorySeoItems)[number];

export function getCategorySeo(category: string): CategorySeoItem | undefined {
  const slug = slugifyTemplateCategory(category);
  return categorySeoItems.find((item) => item.slug === slug);
}

export function CategorySeoContent({ category }: { category: string }) {
  const content = getCategorySeo(category);
  if (!content) return null;

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  const message = encodeURIComponent(
    `Halo Naki Code, saya ingin konsultasi pembuatan ${content.name}.`,
  );

  return (
    <section className="border-t border-naki-steel/60 bg-white px-5 py-14 md:px-8 xl:px-12 2xl:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <article>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            Jasa pembuatan website
          </p>
          <h2 className="mt-3 text-2xl font-bold text-naki-primary md:text-3xl">
            {content.heading}
          </h2>
          {content.intro.map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-3xl text-base leading-8 text-naki-smoke">
              {paragraph}
            </p>
          ))}

          <h3 className="mt-8 text-lg font-semibold text-naki-primary">
            Yang dapat disiapkan
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {content.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 rounded-xl bg-naki-frost p-4 text-sm text-naki-smoke">
                <BadgeCheck className="mt-0.5 shrink-0 text-blue-500" size={17} />
                {benefit}
              </li>
            ))}
          </ul>
        </article>

        <aside className="h-fit rounded-2xl bg-naki-primary p-6 text-white shadow-naki-card">
          <h3 className="text-lg font-semibold">{content.question}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{content.answer}</p>
          <a
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-naki-primary transition hover:bg-naki-frost"
            href={whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${message}` : "/#cara-kerja"}
            rel={whatsappNumber ? "noreferrer" : undefined}
            target={whatsappNumber ? "_blank" : undefined}
          >
            <MessageCircle size={17} />
            Konsultasikan kebutuhan
          </a>
        </aside>
      </div>
    </section>
  );
}
