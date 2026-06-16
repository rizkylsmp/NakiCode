import { ArrowRight, Boxes, CheckCircle2, Code2, Database } from "lucide-react";
import type { ServiceItem } from "../content";

const icons = [Boxes, Code2, Database];

type ServicesSectionProps = {
  services: ServiceItem[];
};

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section
      id="layanan"
      className="border-y border-naki-steel bg-naki-primary text-naki-frost"
    >
      <div className="grid w-full gap-8 px-5 py-14 md:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start xl:px-12 2xl:px-16">
        <div>
          <h2 className="text-4xl font-black leading-tight">
            Layanan untuk template siap pakai dan website custom.
          </h2>
          <p className="mt-4 leading-7 text-naki-steel">
            Fokus Naki Code adalah source code, UI, backend, dan flow aplikasi.
            Domain dan hosting tetap bisa kamu urus terpisah sesuai kebutuhan.
          </p>
          <a
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-frost px-5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
            href="#template"
          >
            Mulai dari katalog
            <ArrowRight size={17} />
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[index] ?? Code2;

            return (
              <article
                key={service.title}
                className="rounded-lg border border-naki-frost/10 bg-naki-secondary p-5"
              >
                <span className="grid size-11 place-items-center rounded-lg bg-naki-frost text-naki-primary">
                  <Icon size={21} />
                </span>
                <h3 className="mt-5 text-xl font-black">{service.title}</h3>
                <p className="mt-3 min-h-24 leading-7 text-naki-steel">
                  {service.description}
                </p>
                <div className="mt-5 grid gap-2">
                  {service.points.map((point) => (
                    <span
                      key={point}
                      className="inline-flex items-center gap-2 text-sm font-bold text-naki-frost"
                    >
                      <CheckCircle2 size={16} />
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

