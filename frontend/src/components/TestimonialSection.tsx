import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../api-client";

type Testimonial = {
  id: number;
  customer_name: string;
  customer_role: string | null;
  quote: string;
  rating: number;
};

const fallbackTestimonials = [
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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const data = await apiGet<{ testimonials: Testimonial[] }>("/api/testimonials");
        setTestimonials(data.testimonials);
      } catch (error) {
        console.error("Failed to load testimonials:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchTestimonials();
  }, []);

  // Use fallback if no testimonials from API
  const displayTestimonials = testimonials.length > 0 ? testimonials : fallbackTestimonials;
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
            {loading ? (
              <div className="col-span-full text-center text-sm text-naki-smoke">
                Memuat testimoni...
              </div>
            ) : displayTestimonials.length === 0 ? (
              <div className="col-span-full text-center text-sm text-naki-smoke">
                Belum ada testimoni.
              </div>
            ) : (
              displayTestimonials.map((testimonial, index) => {
                const name =
                  "customer_name" in testimonial
                    ? testimonial.customer_name
                    : testimonial.name;
                const role =
                  "customer_role" in testimonial
                    ? testimonial.customer_role
                    : testimonial.role;
                const quote = testimonial.quote;
                const rating =
                  "rating" in testimonial ? testimonial.rating : 5;

                return (
                  <article
                    key={`${name}-${index}`}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    {/* Stars */}
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-amber-400"
                          }
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
                        {role && (
                          <p className="text-xs text-naki-smoke">{role}</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
