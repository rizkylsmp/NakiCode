import { MessageSquareText, Palette, Rocket } from "lucide-react";

const steps = [
  {
    icon: Palette,
    number: "01",
    title: "Pilih arah design",
    description:
      "Temukan tampilan yang paling dekat dengan karakter brand dan kebutuhan website-mu.",
  },
  {
    icon: MessageSquareText,
    number: "02",
    title: "Konsultasikan kebutuhan",
    description:
      "Bahas konten, fitur, warna, serta penyesuaian yang diperlukan bersama tim Naki Code.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Website siap digunakan",
    description:
      "Kami mengembangkan, menguji, dan menyiapkan hasil akhir sesuai scope yang disepakati.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-5 md:px-8 md:py-14 xl:px-12 2xl:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            Cara Kerja
          </p>
          <h2 className="mt-2 text-2xl font-bold text-naki-primary md:text-3xl">
            Dari referensi menjadi website milikmu
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
            Design adalah titik awal. Hasil akhirnya tetap disesuaikan dengan
            identitas brand, konten, dan tujuan bisnismu.
          </p>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, description }) => (
            <li
              key={number}
              className="relative overflow-hidden rounded-2xl border border-naki-steel bg-white p-5 shadow-sm sm:p-6"
            >
              <span className="absolute right-5 top-4 text-3xl font-black text-naki-steel">
                {number}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-500">
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-naki-primary">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
