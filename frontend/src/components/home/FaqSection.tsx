import { HelpCircle } from "lucide-react";
import type { FaqItem } from "../../domain/content";

type FaqSectionProps = {
  faqs: FaqItem[];
};

export function FaqSection({ faqs }: FaqSectionProps) {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="lg:max-w-sm">
              <span className="grid size-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                <HelpCircle size={24} />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-naki-primary md:text-3xl">
                Pertanyaan yang Sering Muncul
              </h2>
              <p className="mt-3 text-sm text-naki-smoke">
                Jawaban singkat tentang design, proses pengerjaan website, source code, revisi, dan support.
              </p>
            </div>
            <div className="flex-1 grid gap-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-naki-steel bg-white p-5 shadow-sm"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-naki-primary list-none">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
