import { ArrowLeft, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../compare-context';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { ResponsiveImage } from '../components/ResponsiveImage';
import type { TemplateItem } from '../content';

type ComparePageProps = {
  templates: TemplateItem[];
};

export function ComparePage({ templates }: ComparePageProps) {
  const navigate = useNavigate();
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  
  const compareTemplates = templates.filter((t) => compareIds.includes(t.id));

  if (compareTemplates.length === 0) {
    return (
      <main className="naki-frosted-grid min-h-screen text-naki-primary">
        <Helmet>
          <title>Bandingkan Template - Naki Code</title>
          <meta name="description" content="Bandingkan template side-by-side untuk menemukan yang paling sesuai kebutuhan" />
        </Helmet>
        <Header />
        <section className="grid min-h-[70vh] place-items-center px-5 py-16 text-center">
          <div>
            <h1 className="text-4xl font-black">Belum ada template untuk dibandingkan</h1>
            <p className="mt-3 text-naki-smoke">
              Pilih 2-3 template dari katalog untuk memulai perbandingan.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
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
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>Bandingkan {compareTemplates.length} Template - Naki Code</title>
        <meta name="description" content={`Bandingkan ${compareTemplates.map(t => t.title).join(', ')} side-by-side`} />
      </Helmet>
      <Header />
      
      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
            to="/#template"
          >
            <ArrowLeft size={16} />
            Kembali ke katalog
          </Link>
          {compareTemplates.length > 0 && (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-smoke transition hover:border-naki-secondary hover:text-naki-secondary"
              onClick={clearCompare}
              type="button"
            >
              <X size={16} />
              Hapus semua
            </button>
          )}
        </div>

        <h1 className="mt-6 text-4xl font-black md:text-5xl">
          Bandingkan Template
        </h1>
        <p className="mt-3 text-lg text-naki-smoke">
          Perbandingan side-by-side untuk {compareTemplates.length} template yang dipilih
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-48 bg-naki-frost p-4 text-left text-sm font-black uppercase text-naki-smoke">
                  Fitur
                </th>
                {compareTemplates.map((template) => (
                  <th
                    key={template.id}
                    className="min-w-[280px] border-l border-naki-steel bg-naki-frost p-4"
                  >
                    <div className="relative">
                      <button
                        className="absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-primary transition hover:bg-naki-primary hover:text-naki-frost"
                        onClick={() => removeFromCompare(template.id)}
                        type="button"
                        aria-label="Hapus dari perbandingan"
                      >
                        <X size={16} />
                      </button>
                      {template.preview[0]?.image && (
                        <ResponsiveImage
                          className="h-32 w-full rounded-lg object-cover"
                          src={template.preview[0].image}
                          sizes="280px"
                          alt={template.title}
                        />
                      )}
                      <h3 className="mt-3 text-lg font-black text-naki-primary">
                        {template.title}
                      </h3>
                      <p className="mt-1 text-xs font-bold uppercase text-naki-secondary">
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
                        className="rounded-md bg-naki-steel px-2 py-1 text-xs font-black"
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
                  <ul className="space-y-2 text-left text-sm">
                    {t.features.map((feature, idx) => (
                      <li key={idx} className="leading-6">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                ))}
              />
              <CompareRow
                label="File Termasuk"
                values={compareTemplates.map((t) => (
                  <ul className="space-y-2 text-left text-sm">
                    {t.includedFiles.map((file, idx) => (
                      <li key={idx} className="leading-6">
                        • {file}
                      </li>
                    ))}
                  </ul>
                ))}
              />
              <CompareRow
                label="Cocok Untuk"
                values={compareTemplates.map((t) => (
                  <ul className="space-y-2 text-left text-sm">
                    {t.suitableFor.map((suitable, idx) => (
                      <li key={idx} className="leading-6">
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
                <td className="sticky left-0 z-10 bg-naki-frost p-4 text-sm font-black uppercase text-naki-smoke">
                  Aksi
                </td>
                {compareTemplates.map((template) => (
                  <td
                    key={template.id}
                    className="border-l border-t border-naki-steel bg-naki-frost p-4"
                  >
                    <div className="grid gap-2">
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
                        onClick={() => navigate(`/templates/${template.slug}`)}
                        type="button"
                      >
                        Lihat Detail
                      </button>
                      {template.demoUrl && (
                        <a
                          className="inline-flex h-11 items-center justify-center rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-secondary"
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
      </section>

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
    <tr>
      <td
        className={`sticky left-0 z-10 p-4 text-sm font-black uppercase ${
          highlighted ? 'bg-naki-steel text-naki-primary' : 'bg-naki-frost text-naki-smoke'
        }`}
      >
        {label}
      </td>
      {values.map((value, idx) => (
        <td
          key={idx}
          className={`border-l border-t border-naki-steel p-4 text-sm font-semibold ${
            highlighted ? 'bg-naki-steel' : 'bg-naki-frost'
          }`}
        >
          {typeof value === 'string' ? (
            <span className="leading-6 text-naki-primary">{value}</span>
          ) : (
            value
          )}
        </td>
      ))}
    </tr>
  );
}
