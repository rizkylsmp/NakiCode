import { ArrowRight } from "lucide-react";

type WorkflowSectionProps = {
  workflow: string[];
};

export function WorkflowSection({ workflow }: WorkflowSectionProps) {
  return (
    <section
      id="cara-beli"
      className="bg-naki-primary px-5 py-14 text-naki-frost md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="grid w-full gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div>
          <h2 className="text-4xl font-black leading-tight">
            Dari cari template sampai siap edit.
          </h2>
          <p className="mt-4 leading-7 text-naki-steel">
            Alurnya dibuat pendek: cari kebutuhan, cek demo, lalu pilih source
            code atau custom agar sesuai project kamu.
          </p>
          <a
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-frost px-5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
            href="#template"
          >
            Pilih sekarang
            <ArrowRight size={17} />
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {workflow.map((item, index) => (
            <div
              key={item}
              className="rounded-lg border border-naki-frost/10 bg-naki-secondary p-5"
            >
              <span className="grid size-9 place-items-center rounded-md bg-naki-frost text-sm font-black text-naki-primary">
                {index + 1}
              </span>
              <p className="mt-5 text-lg font-black">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

