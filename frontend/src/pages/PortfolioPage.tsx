import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { PortfolioGrid } from "../components/home/PortfolioSection";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { PaginationControls } from "../components/ui/PaginationControls";
import type { PortfolioItem } from "../domain/content";
import { apiGet } from "../services/api-client";

const portfolioPageSize = 9;

type PortfolioResponse = {
  source: string;
  projects: PortfolioItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function getPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function PortfolioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = getPage(searchParams.get("page"));
  const portfolioQuery = useQuery({
    queryKey: ["portfolio-page", requestedPage],
    queryFn: () =>
      apiGet<PortfolioResponse>(
        `/api/projects?page=${requestedPage}&pageSize=${portfolioPageSize}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const projects = portfolioQuery.data?.projects ?? [];
  const page = portfolioQuery.data?.page ?? requestedPage;
  const total = portfolioQuery.data?.total ?? 0;
  const totalPages = portfolioQuery.data?.totalPages ?? 1;
  const canonicalUrl = `${window.location.origin}/portofolio`;

  useEffect(() => {
    if (portfolioQuery.data && requestedPage > totalPages) {
      setSearchParams(totalPages > 1 ? { page: String(totalPages) } : {}, {
        replace: true,
      });
    }
  }, [portfolioQuery.data, requestedPage, setSearchParams, totalPages]);

  function changePage(nextPage: number) {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>Portofolio Website - Naki Code</title>
        <meta
          name="description"
          content="Lihat portofolio website yang telah dikerjakan Naki Code dari design referensi dan brief custom pelanggan."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Portofolio Website - Naki Code" />
        <meta
          property="og:description"
          content="Kumpulan website yang telah dikerjakan Naki Code untuk berbagai kebutuhan bisnis dan personal."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="bg-naki-primary px-5 py-14 text-center md:px-8 xl:px-12 2xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Portofolio Naki Code
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Website yang sudah kami kerjakan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Jelajahi hasil pengerjaan dari design referensi maupun brief custom
            yang disesuaikan dengan kebutuhan setiap pelanggan.
          </p>
        </section>

        <section className="px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-7xl">
            {portfolioQuery.isError ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700"
                role="alert"
              >
                Portofolio belum dapat dimuat. Silakan coba kembali beberapa saat lagi.
              </div>
            ) : (
              <>
                <PortfolioGrid
                  items={projects}
                  isLoading={portfolioQuery.isPending}
                />
                <div className="mt-10">
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={portfolioPageSize}
                    isLoading={portfolioQuery.isFetching}
                    onPageChange={changePage}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
