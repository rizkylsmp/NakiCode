import { MessageCircle, RefreshCcw, UsersRound, Wrench } from "lucide-react";

const benefits = [
  {
    title: "Grup diskusi",
    description: "Tempat tanya setup, struktur project, dan ide custom.",
    icon: UsersRound,
  },
  {
    title: "Update template",
    description: "Template bisa terus disempurnakan saat ada versi baru.",
    icon: RefreshCcw,
  },
  {
    title: "Bantuan instalasi",
    description: "Panduan menjalankan frontend, backend, dan database lokal.",
    icon: Wrench,
  },
];

export function CommunitySection() {
  return (
    <section
      id="komunitas"
      className="border-y border-naki-steel bg-naki-steel/70 px-5 py-14 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <span className="grid size-12 place-items-center rounded-lg bg-naki-secondary text-naki-frost">
            <MessageCircle size={22} />
          </span>
          <h2 className="mt-5 text-4xl font-black leading-tight text-naki-primary">
            Beli source code, tetap ada ruang diskusi.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-naki-smoke">
            Komunitas dipakai untuk support ringan, update, dan sharing cara
            mengembangkan template supaya tidak berhenti di file ZIP saja.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="rounded-lg border border-naki-steel bg-naki-frost p-5"
              >
                <Icon className="text-naki-secondary" size={24} />
                <h3 className="mt-5 text-lg font-black text-naki-primary">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-7 text-naki-smoke">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

