import { HelpCircle } from "lucide-react";
import type { FaqItem } from "../content";

type FaqSectionProps = {
  faqs: FaqItem[];
};

export function FaqSection({ faqs }: FaqSectionProps) {
  return (
    <section
      id="pertanyaan"
      className="border-y border-naki-steel bg-naki-frost px-5 py-14 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <HelpCircle className="text-naki-secondary" size={32} />
          <h2 className="mt-5 text-4xl font-black leading-tight text-naki-primary">
            Pertanyaan yang sering muncul.
          </h2>
          <p className="mt-4 leading-7 text-naki-smoke">
            Jawaban singkat untuk pembelian template, source code, lisensi,
            support, dan request custom.
          </p>
        </div>
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card"
            >
              <summary className="cursor-pointer list-none text-lg font-black text-naki-primary">
                {faq.question}
              </summary>
              <p className="mt-3 leading-7 text-naki-smoke">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

