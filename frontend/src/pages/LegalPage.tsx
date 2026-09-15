import { ArrowLeft, Scale, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { absoluteSiteUrl } from "../utils/seo";

type LegalPageKind = "privacy" | "terms";
type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const privacySections: LegalSection[] = [
  {
    title: "1. Ruang lingkup",
    paragraphs: [
      "Kebijakan Privasi ini menjelaskan bagaimana NAKI CODE mengumpulkan, menggunakan, menyimpan, dan melindungi informasi ketika Anda mengakses website, membuat akun, menggunakan wishlist, meminta konsultasi, atau melakukan pemesanan.",
    ],
  },
  {
    title: "2. Dasar pemrosesan",
    paragraphs: [
      "Kami memproses data secara terbatas berdasarkan persetujuan Anda, kebutuhan untuk menyediakan layanan atau menjalankan perjanjian, kepentingan yang sah dalam menjaga keamanan dan meningkatkan layanan, serta kewajiban hukum yang berlaku. Pengelolaan data dilakukan dengan memperhatikan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.",
    ],
  },
  {
    title: "3. Data yang kami kumpulkan",
    bullets: [
      "Data akun seperti nama pengguna, email, dan informasi verifikasi akun.",
      "Data pemesanan seperti nama pelanggan, kontak, detail kebutuhan website, design yang dipilih, dan status pembayaran.",
      "Data interaksi seperti design yang dilihat, wishlist, rating, pesan konsultasi, dan penggunaan coupon.",
      "Data teknis seperti alamat IP, jenis perangkat, browser, log keamanan, dan informasi diagnostik yang diperlukan untuk menjalankan layanan.",
      "Aset yang Anda kirimkan untuk kebutuhan project, termasuk gambar atau file yang diunggah melalui fitur yang tersedia.",
    ],
  },
  {
    title: "4. Cara kami menggunakan data",
    bullets: [
      "Menyediakan katalog design, portofolio, akun, wishlist, blog, dan fitur lain yang Anda minta.",
      "Memproses konsultasi, order, pembayaran, coupon, pengiriman notifikasi, dan dukungan pelanggan.",
      "Memverifikasi identitas, mencegah penyalahgunaan, menjaga keamanan akun, dan mendeteksi aktivitas yang mencurigakan.",
      "Memperbaiki performa, aksesibilitas, konten, dan pengalaman penggunaan website.",
      "Memenuhi kewajiban hukum atau menanggapi permintaan resmi dari pihak berwenang.",
    ],
  },
  {
    title: "5. Pembayaran dan pihak ketiga",
    paragraphs: [
      "Pembayaran dapat diproses melalui payment gateway atau layanan eksternal yang dipilih pada checkout. Data pembayaran sensitif diproses oleh penyedia tersebut sesuai kebijakan mereka dan tidak disimpan sebagai nomor kartu oleh NAKI CODE.",
      "Kami juga dapat menggunakan penyedia hosting, penyimpanan gambar, email, analitik, monitoring, dan cache untuk menjalankan layanan. Akses pihak ketiga dibatasi sesuai kebutuhan operasional.",
    ],
  },
  {
    title: "6. Penyimpanan dan keamanan",
    paragraphs: [
      "Kami menerapkan kontrol akses, autentikasi admin, validasi input, pencatatan aktivitas penting, serta pengamanan teknis yang wajar untuk melindungi data. Tidak ada metode transmisi atau penyimpanan yang dapat dijamin 100% aman, sehingga Anda juga perlu menjaga kerahasiaan password dan token akun.",
      "Data disimpan selama diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, menyelesaikan sengketa, dan menegakkan perjanjian. Data yang tidak lagi diperlukan dapat dihapus, dianonimkan, atau diarsipkan sesuai kebutuhan.",
    ],
  },
  {
    title: "7. Hak Anda",
    bullets: [
      "Meminta informasi mengenai data pribadi yang kami simpan.",
      "Memperbarui data akun yang tidak akurat.",
      "Meminta penghapusan akun atau data tertentu, dengan memperhatikan kewajiban penyimpanan yang berlaku.",
      "Menarik persetujuan atau menyampaikan keberatan atas penggunaan data tertentu jika secara hukum memungkinkan.",
    ],
  },
  {
    title: "8. Cookie dan teknologi serupa",
    paragraphs: [
      "Website dapat menggunakan penyimpanan lokal, cookie, atau teknologi serupa untuk menjaga sesi, menyimpan preferensi, mengingat wishlist, serta memahami penggunaan fitur. Anda dapat mengatur cookie melalui browser, tetapi beberapa fitur mungkin tidak berfungsi dengan baik jika penyimpanan tersebut diblokir.",
    ],
  },
  {
    title: "9. Perubahan kebijakan",
    paragraphs: [
      "Kami dapat memperbarui kebijakan ini ketika layanan, teknologi, atau kewajiban hukum berubah. Versi terbaru akan ditampilkan di halaman ini dengan tanggal pembaruan yang sesuai.",
    ],
  },
  {
    title: "10. Kontak",
    paragraphs: [
      "Untuk pertanyaan privasi atau permintaan terkait data, hubungi NAKI CODE melalui WhatsApp di 0857-9480-1890 atau kanal kontak resmi yang tercantum di website.",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    title: "1. Penerimaan ketentuan",
    paragraphs: [
      "Dengan mengakses website atau menggunakan layanan NAKI CODE, Anda menyetujui Syarat & Ketentuan ini. Jika tidak menyetujui salah satu ketentuan, mohon tidak menggunakan bagian layanan yang bersangkutan.",
    ],
  },
  {
    title: "2. Posisi layanan NAKI CODE",
    paragraphs: [
      "NAKI CODE menyediakan jasa pembuatan website dengan katalog design sebagai referensi awal. Design di katalog bukan janji hasil final yang kaku; hasil akhir dapat disesuaikan dengan brief, identitas brand, konten, fitur, dan kebutuhan teknis pelanggan.",
    ],
  },
  {
    title: "3. Akun dan keamanan",
    bullets: [
      "Anda wajib memberikan informasi yang benar, terbaru, dan tidak menyesatkan.",
      "Anda bertanggung jawab menjaga password, token, dan akses ke akun.",
      "Jangan menggunakan akun untuk menyamar sebagai pihak lain, mengakses data tanpa izin, atau mengganggu layanan.",
      "Kami dapat membatasi atau menutup akun yang digunakan untuk penipuan, penyalahgunaan, pelanggaran hukum, atau pelanggaran ketentuan ini.",
    ],
  },
  {
    title: "4. Order, konsultasi, dan pembayaran",
    bullets: [
      "Informasi harga, cakupan pekerjaan, waktu pengerjaan, revisi, dan deliverable mengikuti kesepakatan atau ringkasan order yang dikonfirmasi.",
      "Order melalui checkout hanya dapat dibayar menggunakan metode yang tersedia pada saat transaksi.",
      "Pembayaran melalui payment gateway, Lynk, atau penyedia lain tunduk pada ketentuan penyedia pembayaran tersebut.",
      "Status pembayaran dan akses deliverable dapat ditahan sampai pembayaran terverifikasi.",
      "Permintaan custom yang belum memiliki harga final dapat memerlukan konfirmasi manual dari tim NAKI CODE.",
    ],
  },
  {
    title: "5. Coupon dan promosi",
    paragraphs: [
      "Coupon hanya berlaku sesuai batas waktu atau jumlah pemakaian yang tercantum. Satu coupon tidak dapat digunakan setelah kedaluwarsa, mencapai batas pemakaian, dinonaktifkan, atau dihapus. Kami dapat menolak penggunaan coupon jika terdapat kesalahan sistem, indikasi penyalahgunaan, atau ketidaksesuaian dengan ketentuan promosi.",
    ],
  },
  {
    title: "6. Hak atas konten dan aset",
    bullets: [
      "Anda tetap bertanggung jawab atas hak penggunaan logo, foto, teks, font, kode, dan aset lain yang Anda kirimkan.",
      "Anda memberikan izin kepada NAKI CODE untuk menggunakan aset tersebut sejauh diperlukan untuk mengerjakan dan menampilkan project yang disepakati.",
      "Anda tidak boleh mengunggah malware, materi ilegal, materi yang melanggar hak pihak lain, atau file yang membahayakan sistem.",
      "Hak penggunaan source code, design, aset stock, dan komponen pihak ketiga mengikuti lisensi atau kesepakatan yang berlaku pada project.",
    ],
  },
  {
    title: "7. Penggunaan yang dilarang",
    bullets: [
      "Mencoba memperoleh akses ke area admin, database, API, akun, atau data pengguna lain tanpa izin.",
      "Melakukan scraping, spam, reverse engineering, pemindaian keamanan tanpa otorisasi, atau tindakan yang membebani layanan.",
      "Menggunakan layanan untuk penipuan, phishing, distribusi malware, pelanggaran hukum, atau pelanggaran hak pihak lain.",
      "Menyalin, menjual kembali, atau mendistribusikan asset dan source code di luar lisensi yang disepakati.",
    ],
  },
  {
    title: "8. Ketersediaan dan perubahan layanan",
    paragraphs: [
      "Kami berupaya menjaga website tetap tersedia, tetapi layanan dapat mengalami pemeliharaan, gangguan penyedia pihak ketiga, perubahan fitur, atau penghentian sementara. Kami dapat mengubah konten katalog, harga, fitur, atau alur layanan dengan tetap memperhatikan order yang sudah dikonfirmasi.",
    ],
  },
  {
    title: "9. Batas tanggung jawab",
    paragraphs: [
      "Sejauh diizinkan hukum, NAKI CODE tidak bertanggung jawab atas kerugian yang timbul dari penggunaan aset tanpa lisensi oleh pelanggan, kesalahan informasi yang diberikan pelanggan, gangguan pihak ketiga, atau penggunaan website yang melanggar ketentuan ini. Ketentuan khusus pada penawaran atau kontrak project dapat mengatur hal yang lebih spesifik.",
    ],
  },
  {
    title: "10. Hukum dan penyelesaian perselisihan",
    paragraphs: [
      "Ketentuan ini ditafsirkan berdasarkan hukum Republik Indonesia. Jika terjadi perselisihan, para pihak akan lebih dahulu berupaya menyelesaikannya secara musyawarah sebelum menempuh mekanisme lain yang tersedia berdasarkan hukum.",
    ],
  },
  {
    title: "11. Perubahan ketentuan dan kontak",
    paragraphs: [
      "Ketentuan ini dapat diperbarui untuk menyesuaikan layanan atau kewajiban hukum. Penggunaan berkelanjutan setelah pembaruan berarti Anda menerima versi terbaru. Pertanyaan mengenai order atau ketentuan dapat disampaikan melalui WhatsApp 0857-9480-1890.",
    ],
  },
];

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Kebijakan Privasi" : "Syarat & Ketentuan";
  const description = isPrivacy
    ? "Pelajari cara NAKI CODE mengelola data, akun, order, dan aset yang Anda gunakan di website."
    : "Ketentuan penggunaan website, konsultasi, order, pembayaran, coupon, dan layanan NAKI CODE.";
  const sections = isPrivacy ? privacySections : termsSections;
  const Icon = isPrivacy ? ShieldCheck : Scale;
  const path = isPrivacy ? "kebijakan-privasi" : "syarat-ketentuan";

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>{title} - Naki Code</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={absoluteSiteUrl(`/${path}`)} />
      </Helmet>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="bg-naki-primary px-5 py-14 text-white md:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-4xl">
            <Link
              className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              to="/"
            >
              <ArrowLeft size={16} /> Kembali ke beranda
            </Link>
            <div className="mt-8 flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-300">
                <Icon size={24} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                  NAKI CODE
                </p>
                <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                  {description}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Terakhir diperbarui: 9 September 2026
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
          <article className="mx-auto max-w-4xl rounded-2xl border border-naki-steel bg-white p-6 shadow-naki-soft md:p-10">
            <div className="grid gap-9">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold text-naki-primary">
                    {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-3 text-sm leading-7 text-naki-smoke"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="mt-3 grid gap-2 pl-5 text-sm leading-7 text-naki-smoke">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
