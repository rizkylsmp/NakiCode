import { ArrowLeft, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../contexts/compare-context';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { ResponsiveImage } from '../components/ui/ResponsiveImage';
import type { TemplateItem } from '../domain/content';

type ComparePageProps = {
  templates: TemplateItem[];
};

export function ComparePage({ templates }: ComparePageProps) {
  const navigate = useNavigate();
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const compareTemplates = templates.filter((t) => compareIds.includes(t.id));

  if (compareTemplates.length === 0) {
    return (
      <main className="naki-frosted-grid min-h-screen bg-naki-page-bg">
        <Helmet>
          <title>Bandingkan Design - Naki Code</title>
          <meta name="description" content="Bandingkan design website untuk menemukan referensi yang paling sesuai kebutuhan" />
        </Helmet>
        <Header />
        <section className="grid min-h-[70vh] place-items-center px-5 py-16 text-center">
          <div>
            <h1 className="text-3xl font-bold text-naki-primary md:text-4xl">
              Belum ada design untuk dibandingkan
            </h1>
            <p className="mt-3 text-base text-naki-smoke leading-relaxed">
              Pilih 2-3 design dari katalog untuk memulai perbandingan.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white transition hover:opacity-90"
              to="/#template"
            >
              <ArrowLeft size={16} />
              Kembali ke katalog
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-naki-page-bg">
      <Helmet>
        <title>Bandingkan {compareTemplates.length} Design - Naki Code</title>
        <meta name="description" content={`Bandingkan ${compareTemplates.map(t => t.title).join(', ')} side-by-side`} />
      </Helmet>
      <Header />

      {/* Hero Section */}
      <section className="bg-naki-primary px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-naki-secondary transition hover:text-blue-300"
            to="/#template"
          >
            <ArrowLeft size={16} />
            Kembali ke katalog
          </Link>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                Bandingkan Design
              </h1>
              <p className="mt-3 text-base text-naki-steel leading-relaxed">
                Perbandingan side-by-side untuk {compareTemplates.length} design yang dipilih
              </p>
            </div>
            {compareTemplates.length > 0 && (
              <button
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={clearCompare}
                type="button"
              >
                <X size={16} />
                Hapus semua
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="-mt-6 px-5 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-48 bg-naki-frost p-4 text-left text-xs font-semibold uppercase tracking-wider text-naki-smoke">
                    Fitur
                  </th>
                  {compareTemplates.map((template) => (
                    <th
                      key={template.id}
                      className="min-w-70 border-l border-naki-steel bg-naki-frost p-4"
                    >
                      <div className="relative">
                        <button
                          className="absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-primary transition hover:bg-naki-primary hover:text-white"
                          onClick={() => removeFromCompare(template.id)}
                          type="button"
                          aria-label="Hapus dari perbandingan"
                        >
                          <X size={16} />
                        </button>
                        {template.preview[0]?.image && (
                          <ResponsiveImage
                            className="h-32 w-full rounded-xl object-cover"
                            src={template.preview[0].image}
                            sizes="280px"
                            alt={template.title}
                          />
                        )}
                        <h3 className="mt-3 text-base font-bold text-naki-primary">
                          {template.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase text-naki-secondary">
                          {template.category}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="Harga"
                  values={compareTemplates.map((t) => t.price)}
                  highlighted
                />
                <CompareRow
                  label="Level"
                  values={compareTemplates.map((t) => t.level)}
                />
                <CompareRow
                  label="Rating"
                  values={compareTemplates.map((t) =>
                    t.rating > 0 ? `${t.rating.toFixed(1)} / 5.0` : 'Belum ada rating'
                  )}
                />
                <CompareRow
                  label="Pembeli"
                  values={compareTemplates.map((t) => `${t.buyerCount} pembeli`)}
                />
                <CompareRow
                  label="Tech Stack"
                  values={compareTemplates.map((t) => (
                    <div className="flex flex-wrap gap-2">
                      {t.stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-lg bg-naki-steel px-2.5 py-1 text-xs font-semibold text-naki-primary"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ))}
                />
                <CompareRow
                  label="Fitur Utama"
                  values={compareTemplates.map((t) => (
                    <ul className="space-y-1.5 text-left text-sm">
                      {t.features.map((feature, idx) => (
                        <li key={idx} className="leading-relaxed text-naki-primary">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  ))}
                />
                <CompareRow
                  label="File Termasuk"
                  values={compareTemplates.map((t) => (
                    <ul className="space-y-1.5 text-left text-sm">
                      {t.includedFiles.map((file, idx) => (
                        <li key={idx} className="leading-relaxed text-naki-primary">
                          • {file}
                        </li>
                      ))}
                    </ul>
                  ))}
                />
                <CompareRow
                  label="Cocok Untuk"
                  values={compareTemplates.map((t) => (
                    <ul className="space-y-1.5 text-left text-sm">
                      {t.suitableFor.map((suitable, idx) => (
                        <li key={idx} className="leading-relaxed text-naki-primary">
                          • {suitable}
                        </li>
                      ))}
                    </ul>
                  ))}
                />
                <CompareRow
                  label="Lisensi"
                  values={compareTemplates.map((t) => t.license)}
                />
                <CompareRow
                  label="Support"
                  values={compareTemplates.map((t) => t.support)}
                />
                <tr>
                  <td className="sticky left-0 z-10 bg-naki-frost p-4 text-xs font-semibold uppercase tracking-wider text-naki-smoke">
                    Aksi
                  </td>
                  {compareTemplates.map((template) => (
                    <td
                      key={template.id}
                      className="border-l border-t border-naki-steel bg-naki-frost p-4"
                    >
                      <div className="grid gap-2">
                        <button
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
                          onClick={() => navigate(`/templates/${template.slug}`)}
                          type="button"
                        >
                          Lihat Detail
                        </button>
                        {template.demoUrl && (
                          <a
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-smoke transition hover:border-naki-secondary hover:text-naki-secondary"
                            href={template.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Demo Live
                          </a>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="h-16" />
      <Footer />
    </main>
  );
}

type CompareRowProps = {
  label: string;
  values: (string | React.ReactNode)[];
  highlighted?: boolean;
};

function CompareRow({ label, values, highlighted }: CompareRowProps) {
  return (
    <tr className="border-t border-naki-steel">
      <td
        className={`sticky left-0 z-10 p-4 text-xs font-semibold uppercase tracking-wider ${
          highlighted
            ? 'bg-naki-frost text-naki-primary'
            : 'bg-white text-naki-smoke'
        }`}
      >
        {label}
      </td>
      {values.map((value, idx) => (
        <td
          key={idx}
          className={`border-l p-4 text-sm ${
            highlighted ? 'bg-naki-frost font-semibold' : 'bg-white'
          }`}
        >
          {typeof value === 'string' ? (
            <span className="leading-relaxed text-naki-primary">{value}</span>
          ) : (
            value
          )}
        </td>
      ))}
    </tr>
  );
}
