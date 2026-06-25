import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Template dari Naki Code sangat membantu saya menyelesaikan project client lebih cepat. Kualitas kodenya bersih dan dokumentasinya lengkap.",
    name: "Rizky Pratama",
    role: "Freelance Developer",
  },
  {
    quote:
      "SaaS Landing Kit menjadi pilihan tepat untuk landing page produk kami. Desainnya modern dan konversinya meningkat signifikan.",
    name: "Dewi Lestari",
    role: "Startup Founder",
  },
  {
    quote:
      "REST API Starter menghemat waktu setup backend saya. Auth, validasi, dan docs sudah siap pakai. Sangat direkomendasikan!",
    name: "Andi Wijaya",
    role: "Fullstack Engineer",
  },
];

export function TestimonialSection() {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Testimoni
            </p>
            <h2 className="mt-2 text-2xl font-bold text-naki-primary md:text-3xl">
              Apa Kata Developer Kami
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-naki-smoke">
              Bergabung dengan ribuan developer yang sudah mempercayakan workflow mereka.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ quote, name, role }) => (
              <article
                key={name}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-naki-smoke">
                  "{quote}"
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-500">
                    {name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-naki-primary">
                      {name}
                    </p>
                    <p className="text-xs text-naki-smoke">{role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
