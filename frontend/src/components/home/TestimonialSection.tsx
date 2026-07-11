import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../../services/api-client";
import { Skeleton, SkeletonText } from "../ui/skeletons/Skeleton";

type Testimonial = {
  id: number;
  customer_name: string;
  customer_role: string | null;
  quote: string;
  rating: number;
};

export function TestimonialSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const data = await apiGet<{ testimonials: Testimonial[] }>("/api/testimonials");
        setTestimonials(data.testimonials ?? []);
        setHasConnectionError(false);
      } catch (error) {
        console.error("Failed to load testimonials:", error);
        setHasConnectionError(true);
      } finally {
        setLoading(false);
      }
    }

    void fetchTestimonials();
  }, []);

  const showSkeleton = loading || hasConnectionError;

  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Testimoni
            </p>
            <h2 className="mt-2 text-2xl font-bold text-naki-primary md:text-3xl">
              Cerita dari pelanggan kami
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-naki-smoke">
              Pengalaman nyata pelanggan yang memilih design lalu menyesuaikannya bersama Naki Code.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {showSkeleton ? (
              <TestimonialSkeletonGrid />
            ) : testimonials.length === 0 ? (
              <div className="col-span-full text-center text-sm text-naki-smoke">
                Belum ada testimoni.
              </div>
            ) : (
              testimonials.map((testimonial) => {
                const name = testimonial.customer_name;
                const role = testimonial.customer_role;
                const rating = testimonial.rating;

                return (
                  <article
                    key={testimonial.id}
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
                      "{testimonial.quote}"
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

function TestimonialSkeletonGrid() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <TestimonialSkeletonCard key={index} />
      ))}
    </>
  );
}

function TestimonialSkeletonCard() {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            width="1rem"
            height="1rem"
            radius="999px"
            className="bg-amber-100"
          />
        ))}
      </div>
      <SkeletonText lines={4} />
      <div className="mt-5 flex items-center gap-3">
        <Skeleton width="2.5rem" height="2.5rem" radius="999px" />
        <div className="min-w-0 flex-1">
          <Skeleton width="8rem" height="0.875rem" radius="0.25rem" />
          <Skeleton
            width="6rem"
            height="0.75rem"
            radius="0.25rem"
            className="mt-2"
          />
        </div>
      </div>
    </article>
  );
}
