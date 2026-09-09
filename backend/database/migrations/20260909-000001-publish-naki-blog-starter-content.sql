-- Migration: publish-naki-blog-starter-content
-- Created: 2026-09-09

-- UP
INSERT INTO blog_posts (
  slug,
  title,
  excerpt,
  content,
  author,
  cover_image,
  status,
  published_at
) VALUES
  (
    'halaman-penting-website-bisnis',
    '7 Halaman Penting untuk Website Bisnis yang Siap Menghasilkan Leads',
    'Website bisnis yang efektif bukan sekadar terlihat menarik. Susunan halamannya harus membantu calon pelanggan memahami layanan, membangun kepercayaan, dan mengambil tindakan.',
    'Website yang baik bekerja seperti anggota tim yang selalu siap menjelaskan bisnis Anda. Ia menyambut pengunjung, menjawab pertanyaan dasar, menunjukkan bukti, lalu mengarahkan mereka ke langkah berikutnya. Karena itu, sebelum memilih animasi atau efek visual, pastikan struktur informasi utamanya sudah kuat.

1. BERANDA YANG LANGSUNG MENJELASKAN NILAI

Beranda perlu menjawab tiga hal dalam beberapa detik: siapa yang Anda bantu, masalah apa yang diselesaikan, dan tindakan apa yang sebaiknya dilakukan pengunjung. Gunakan judul yang spesifik, penjelasan singkat, serta satu tombol utama seperti Konsultasi, Lihat Design, atau Minta Penawaran. Hindari membuka halaman dengan kalimat umum yang bisa digunakan oleh bisnis apa pun.

2. HALAMAN LAYANAN YANG TERSTRUKTUR

Jangan hanya menuliskan daftar layanan. Jelaskan hasil yang diterima pelanggan, proses singkat, ruang lingkup, dan siapa yang paling cocok menggunakan layanan tersebut. Bila layanan Anda cukup berbeda, berikan halaman khusus untuk setiap layanan agar pengunjung dan mesin pencari dapat memahami konteksnya dengan lebih baik.

3. PORTOFOLIO DAN STUDI KASUS

Portofolio adalah bukti visual, sedangkan studi kasus memberi konteks. Tampilkan tujuan project, tantangan, pendekatan, dan hasil akhirnya. Screenshot yang rapi dan relevan lebih bernilai daripada banyak gambar tanpa penjelasan. Jika project masih sedikit, tampilkan karya terbaik dan jelaskan kemampuan yang benar-benar tercermin di dalamnya.

4. TENTANG BISNIS ATAU TIM

Calon pelanggan ingin mengetahui siapa yang akan mengerjakan kebutuhan mereka. Ceritakan cara kerja, nilai yang dijaga, pengalaman yang relevan, dan alasan bisnis Anda dapat dipercaya. Halaman ini tidak perlu menjadi biografi panjang; fokuskan pada hal yang membantu pelanggan merasa yakin.

5. TESTIMONI DAN BUKTI KEPERCAYAAN

Testimoni yang kuat menyebutkan situasi, pengalaman, atau perubahan yang dirasakan pelanggan. Tambahkan nama dan konteks yang diizinkan. Anda juga dapat menampilkan angka project, proses kerja yang transparan, garansi layanan, atau pertanyaan umum untuk mengurangi keraguan sebelum calon pelanggan menghubungi Anda.

6. FAQ YANG MENJAWAB HAMBATAN PEMBELIAN

Kumpulkan pertanyaan yang paling sering muncul sebelum transaksi: estimasi waktu, alur revisi, kebutuhan konten, biaya tambahan, dukungan setelah website selesai, dan kepemilikan source code. Jawaban yang jelas menghemat waktu kedua pihak dan membuat calon pelanggan datang dengan ekspektasi yang lebih sehat.

7. KONTAK DENGAN LANGKAH BERIKUTNYA YANG JELAS

Formulir kontak sebaiknya singkat. Minta hanya informasi yang benar-benar dibutuhkan untuk memulai percakapan. Sediakan alternatif seperti WhatsApp dan jelaskan kapan pesan biasanya dibalas. Setelah formulir dikirim, tampilkan konfirmasi agar pengguna tidak bertanya-tanya apakah pesannya berhasil masuk.

CHECKLIST SEBELUM DIPUBLIKASIKAN

• Setiap halaman memiliki satu tujuan utama.
• Tombol tindakan mudah ditemukan di desktop dan mobile.
• Informasi kontak konsisten.
• Navigasi menggunakan istilah yang mudah dipahami.
• Portofolio memakai gambar aktual dan tidak menyesatkan.
• Formulir sudah diuji sampai pesan benar-benar diterima.

Struktur ini bukan aturan kaku. Website satu halaman pun dapat bekerja jika seluruh informasi penting tersusun dengan jelas. Yang utama adalah perjalanan pengunjung terasa logis: memahami, percaya, lalu bertindak. Mulailah dari kebutuhan pelanggan, kemudian pilih design yang mendukung alur tersebut.',
    'Naki Code',
    '/images/blog/business-website-essential-pages.webp',
    'published',
    CURRENT_TIMESTAMP
  ),
  (
    'cara-memilih-design-website-sesuai-brand',
    'Cara Memilih Design Website yang Sesuai dengan Karakter Brand',
    'Design yang bagus belum tentu tepat untuk setiap bisnis. Pelajari cara menilai arah visual, struktur, konten, dan fleksibilitas design sebelum menjadikannya referensi website.',
    'Memilih design website sering dimulai dari rasa suka. Itu wajar, tetapi keputusan terbaik tidak berhenti pada tampilan. Design perlu menerjemahkan karakter brand, mendukung jenis konten, dan memudahkan pengunjung melakukan tindakan yang diharapkan.

MULAI DARI KARAKTER BRAND

Tuliskan tiga sampai lima kata yang menggambarkan kesan brand, misalnya tepercaya, hangat, presisi, berani, atau eksklusif. Kata-kata ini akan membantu menyaring pilihan visual. Brand profesional yang tenang mungkin cocok dengan ruang kosong luas dan warna netral, sedangkan brand kreatif dapat menggunakan komposisi lebih ekspresif tanpa mengorbankan keterbacaan.

KENALI SIAPA PENGUNJUNGNYA

Design harus nyaman bagi orang yang akan menggunakannya. Pertimbangkan usia, kebiasaan digital, perangkat yang dominan, serta informasi yang mereka cari. Pengunjung yang ingin membandingkan layanan membutuhkan struktur yang berbeda dari pengunjung yang ingin melihat karya visual. Jangan memilih layout hanya karena sedang populer jika pola tersebut justru menyulitkan target pengguna.

COCOKKAN DENGAN JENIS KONTEN

Periksa aset yang benar-benar tersedia. Apakah bisnis memiliki fotografi berkualitas, video, katalog produk, artikel, atau hanya beberapa materi utama? Design yang bergantung pada banyak foto besar akan terasa kosong bila asetnya terbatas. Sebaliknya, bisnis dengan portofolio visual kuat membutuhkan ruang yang cukup agar karya dapat menjadi pusat perhatian.

NILAI HIERARKI, BUKAN HANYA WARNA

Warna dan ilustrasi mudah menarik perhatian, tetapi hierarki menentukan apakah halaman mudah dipahami. Lihat urutan judul, penjelasan, bukti, dan tombol tindakan. Bayangkan semua warna dihilangkan: apakah Anda masih dapat mengetahui informasi yang paling penting? Jika jawabannya ya, struktur design tersebut kemungkinan cukup matang.

PERIKSA KOMPONEN UTAMA

Pastikan design dapat menampung kebutuhan nyata seperti navigasi, kartu layanan, portofolio, testimoni, FAQ, formulir, dan footer. Periksa juga state yang sering terlupakan: data kosong, gambar gagal dimuat, proses loading, pesan error, serta tombol yang tidak aktif. Design profesional tetap terasa rapi ketika kondisi tidak ideal terjadi.

JANGAN ABAIKAN MOBILE

Screenshot desktop tidak cukup. Pada layar kecil, urutan konten, ukuran tombol, panjang judul, dan jarak antar elemen berubah. Pastikan tindakan utama tetap mudah dijangkau, teks tidak terlalu kecil, dan elemen dekoratif tidak menutupi konten. Mobile bukan versi yang diperkecil, melainkan susunan ulang dengan prioritas yang sama.

BEDAKAN REFERENSI DAN HASIL AKHIR

Design referensi adalah titik awal untuk berdiskusi, bukan batas yang mengunci hasil. Identitas brand, konten, kebutuhan fitur, dan kebiasaan pengguna tetap harus memengaruhi implementasi akhir. Hindari menyalin website pihak lain secara utuh. Ambil prinsip layout atau suasananya, lalu bangun identitas yang khas dan aman digunakan.

PERTANYAAN SEBELUM MEMILIH DESIGN

• Apakah kesan visualnya sejalan dengan karakter brand?
• Apakah konten yang tersedia cukup untuk mengisi layout?
• Apakah pengunjung mudah menemukan tindakan utama?
• Apakah susunannya tetap jelas di layar mobile?
• Apakah komponen dapat dikembangkan ketika bisnis bertumbuh?
• Apakah aset, font, dan elemen visual memiliki hak penggunaan yang jelas?

Design yang tepat membuat pesan brand terasa lebih kuat tanpa mengambil alih perhatian. Saat struktur, visual, dan konten bekerja sebagai satu sistem, website akan lebih mudah dipahami, lebih konsisten, dan lebih siap berkembang.',
    'Naki Code',
    '/images/blog/choose-brand-website-design.webp',
    'published',
    CURRENT_TIMESTAMP
  ),
  (
    'checklist-responsive-performa-sebelum-launch',
    'Website Responsif dan Cepat: Checklist Sebelum Launch',
    'Gunakan checklist praktis ini untuk memeriksa tampilan mobile, performa, aksesibilitas, SEO dasar, formulir, dan keamanan sebelum website dipublikasikan.',
    'Hari peluncuran seharusnya bukan saat pertama kali website diuji secara menyeluruh. Pemeriksaan terbaik dilakukan bertahap sejak proses development, lalu ditutup dengan satu putaran quality assurance yang terstruktur. Berikut area penting yang perlu diperiksa sebelum domain diumumkan ke publik.

1. UJI RESPONSIVE DI BEBERAPA UKURAN

Jangan hanya mengandalkan satu ponsel dan satu laptop. Uji layar kecil, tablet, laptop, dan desktop lebar. Perhatikan navigasi, tabel, modal, galeri, formulir, serta judul panjang. Pastikan tidak ada konten yang terpotong secara tidak sengaja atau menyebabkan halaman bergeser horizontal.

2. PERIKSA GAMBAR DAN MEDIA

Gunakan dimensi gambar yang sesuai dengan tempat tampilnya dan kompres ukuran file tanpa merusak kualitas visual. Tetapkan rasio agar layout tidak melompat saat gambar selesai dimuat. Gunakan teks alternatif yang menjelaskan fungsi gambar, bukan mengulang nama file. Untuk gambar di bawah layar awal, aktifkan lazy loading bila sesuai.

3. UKUR KECEPATAN SECARA NYATA

Tes performa pada koneksi dan perangkat yang tidak selalu ideal. Cari penyebab utama seperti gambar terlalu besar, JavaScript berlebihan, font yang memblokir tampilan, atau permintaan API yang lambat. Prioritaskan perbaikan yang paling terasa bagi pengguna: konten utama muncul cepat, tombol segera dapat digunakan, dan perpindahan layout minimal.

4. UJI SELURUH INTERAKSI

Klik setiap tautan dan tombol penting. Kirim formulir dengan data benar dan salah. Periksa state loading, sukses, kosong, error, serta tombol disabled. Uji login, pencarian, filter, wishlist, checkout, upload, dan pembayaran bila fitur tersebut tersedia. Catat hasilnya agar masalah tidak hanya diingat secara lisan.

5. CEK AKSESIBILITAS DASAR

Pastikan website dapat digunakan dengan keyboard. Fokus harus terlihat, urutan tab masuk akal, tombol memiliki nama yang jelas, dan modal dapat ditutup dengan aman. Periksa kontras warna serta ukuran area klik. Struktur heading juga perlu berurutan agar halaman lebih mudah dinavigasi oleh teknologi bantu.

6. SIAPKAN SEO DAN PREVIEW BERBAGI

Setiap halaman penting membutuhkan title dan deskripsi yang relevan. Gunakan URL yang mudah dibaca, canonical URL, sitemap, serta aturan index yang benar. Pastikan cover artikel dan halaman produk muncul saat tautan dibagikan. Structured data boleh digunakan jika isinya memang sesuai dengan konten yang terlihat oleh pengguna.

7. VERIFIKASI KEAMANAN DAN PRIVASI

Secret tidak boleh berada di source code frontend atau repository. Gunakan HTTPS, validasi input di server, batasi tipe serta ukuran upload, dan terapkan otorisasi pada endpoint admin. Tinjau cookie, analytics, data formulir, serta kebijakan privasi sesuai data yang benar-benar dikumpulkan.

8. SIAPKAN PEMANTAUAN DAN PEMULIHAN

Pastikan error aplikasi dapat diketahui setelah launch. Siapkan backup database yang dapat dipulihkan, bukan hanya dibuat. Dokumentasikan konfigurasi domain, hosting, email, payment gateway, dan variabel environment tanpa menyimpan nilai rahasia di repository. Tentukan juga siapa yang menerima laporan bila transaksi atau formulir bermasalah.

CHECKLIST RINGKAS HARI PELUNCURAN

• Domain dan HTTPS aktif.
• Build produksi berhasil tanpa error.
• Database telah dimigrasikan dan dibackup.
• Formulir serta notifikasi sampai ke tujuan.
• Tampilan desktop dan mobile sudah diperiksa.
• Metadata dan gambar berbagi tersedia.
• Halaman 404 dan kondisi error dapat dipahami.
• Analytics dan pemantauan hanya memuat data yang diperlukan.

Website tidak harus sempurna untuk diluncurkan, tetapi alur utama harus aman dan dapat dipercaya. Setelah publikasi, pantau data nyata, kumpulkan masukan, lalu lakukan perbaikan kecil secara rutin. Website yang sehat adalah produk yang terus dirawat, bukan pekerjaan yang berhenti pada tombol publish.',
    'Naki Code',
    '/images/blog/responsive-performance-launch-checklist.webp',
    'published',
    CURRENT_TIMESTAMP
  ),
  (
    'kapan-bisnis-perlu-redesign-website',
    'Kapan Bisnis Perlu Redesign Website? Kenali 8 Tandanya',
    'Redesign bukan sekadar mengganti warna. Kenali tanda bahwa website sudah menghambat pengalaman pengguna, kredibilitas, performa, atau pertumbuhan bisnis.',
    'Website tidak perlu dirombak hanya karena tampilannya terasa lama. Redesign menjadi keputusan yang masuk akal ketika website sudah tidak mampu mendukung tujuan bisnis atau membuat pengunjung bekerja terlalu keras untuk mendapatkan informasi. Audit yang baik membantu membedakan masalah visual, konten, teknologi, dan strategi.

1. PESAN UTAMA SULIT DIPAHAMI

Pengunjung seharusnya dapat memahami apa yang ditawarkan, siapa yang dilayani, dan apa langkah berikutnya dalam beberapa detik. Jika beranda dipenuhi slogan umum, terlalu banyak tombol, atau penjelasan yang saling bersaing, masalah utamanya mungkin berada pada hierarki dan strategi konten. Redesign dapat menyusun ulang perjalanan tersebut menjadi lebih fokus.

2. TAMPILAN MOBILE TERASA SEPERTI VERSI KECIL DESKTOP

Teks yang kecil, menu sulit disentuh, gambar keluar layar, dan formulir yang melelahkan adalah tanda responsive design belum direncanakan dengan baik. Karena banyak interaksi dimulai dari ponsel, pengalaman mobile yang buruk dapat langsung mengurangi jumlah pertanyaan, pendaftaran, atau transaksi.

3. WEBSITE LAMBAT DAN TIDAK STABIL

Gambar besar, script lama, plugin berlebihan, dan arsitektur yang sulit dirawat dapat membuat halaman lambat atau bergeser saat dimuat. Sebagian masalah bisa diselesaikan dengan optimasi. Namun bila fondasi teknisnya membatasi perbaikan, redesign yang disertai pembaruan implementasi akan lebih efisien daripada menambal masalah satu per satu.

4. IDENTITAS BRAND SUDAH BERUBAH

Bisnis dapat berkembang ke segmen baru, memperbarui positioning, atau menawarkan layanan yang berbeda. Jika website masih menggunakan bahasa dan visual dari fase lama, calon pelanggan menerima kesan yang tidak lagi akurat. Redesign membantu menyelaraskan warna, tipografi, fotografi, gaya bahasa, dan struktur penawaran dengan arah brand saat ini.

5. KONTEN SULIT DIPERBARUI

Tim seharusnya dapat mengubah informasi rutin tanpa takut merusak layout. Ketika menambah layanan, portofolio, atau artikel selalu membutuhkan perubahan manual yang rumit, struktur konten perlu dievaluasi. Redesign dapat menghadirkan komponen yang dapat digunakan ulang dan pengelolaan data yang lebih jelas.

6. KONVERSI RENDAH MESKI TRAFIK CUKUP

Trafik tidak otomatis menjadi hasil. Periksa apakah tombol tindakan terlihat, formulir terlalu panjang, bukti kepercayaan kurang, atau biaya dan proses tidak dijelaskan. Gunakan analytics, rekaman interaksi yang menghormati privasi, serta masukan pelanggan untuk menemukan titik hambatan sebelum menentukan perubahan visual.

7. WEBSITE TIDAK LAGI MENDUKUNG FITUR BISNIS

Kebutuhan seperti pemesanan, pembayaran, akun pelanggan, katalog, integrasi CRM, atau multi-bahasa dapat melampaui struktur awal. Memaksa fitur baru masuk ke fondasi yang tidak dirancang untuknya sering menghasilkan pengalaman yang terpecah. Redesign memberi kesempatan untuk merencanakan data dan alur utama sebagai satu sistem.

8. KEPERCAYAAN PENGUNJUNG MENURUN

Tautan rusak, informasi lama, sertifikat keamanan bermasalah, gambar berkualitas rendah, dan tampilan yang tidak konsisten membuat bisnis terasa kurang aktif. Hal-hal ini perlu diperbaiki segera. Bila masalahnya tersebar di seluruh halaman, pembaruan menyeluruh dapat menghasilkan pengalaman yang lebih konsisten.

SEBELUM MEMUTUSKAN REDESIGN

• Tentukan masalah bisnis yang ingin diselesaikan.
• Catat halaman dan fitur yang masih bekerja dengan baik.
• Pelajari data trafik, pencarian, dan konversi.
• Inventarisasi konten serta aset yang dapat dipertahankan.
• Susun prioritas untuk mobile, kecepatan, aksesibilitas, dan SEO.
• Tentukan indikator keberhasilan setelah website baru diluncurkan.

Redesign terbaik tidak menghapus semuanya tanpa alasan. Ia mempertahankan bagian yang efektif, memperbaiki hambatan nyata, dan membangun fondasi yang lebih mudah berkembang. Mulailah dengan audit, bukan dengan memilih warna baru.',
    'Naki Code',
    '/images/blog/when-to-redesign-business-website.webp',
    'published',
    CURRENT_TIMESTAMP
  ),
  (
    'memahami-biaya-pembuatan-website-profesional',
    'Biaya Pembuatan Website: Apa yang Sebenarnya Anda Bayar?',
    'Harga website dipengaruhi strategi, design, konten, fitur, integrasi, kualitas implementasi, dan dukungan. Pahami komponennya agar penawaran dapat dibandingkan secara adil.',
    'Dua website yang sekilas terlihat mirip dapat memiliki biaya yang sangat berbeda. Perbedaannya sering tidak terlihat pada screenshot karena nilai sebuah website juga berada pada proses, fondasi teknis, keamanan, kemudahan pengelolaan, dan dukungan setelah peluncuran. Memahami komponennya membantu Anda menilai penawaran berdasarkan ruang lingkup, bukan hanya angka akhir.

1. PENEMUAN KEBUTUHAN DAN STRATEGI

Project yang terarah dimulai dengan memahami tujuan bisnis, target pengguna, tindakan utama, kebutuhan konten, dan batasan teknis. Tahap ini dapat berupa diskusi, riset ringan, pemetaan halaman, serta penyusunan prioritas. Semakin kompleks keputusan bisnisnya, semakin besar pekerjaan yang perlu dilakukan sebelum design dimulai.

2. STRUKTUR INFORMASI DAN USER FLOW

Website bukan kumpulan halaman yang berdiri sendiri. Navigasi, urutan konten, pencarian, formulir, checkout, dan pesan setelah tindakan perlu dirancang sebagai perjalanan yang utuh. Struktur yang matang mengurangi kebingungan pengguna sekaligus menghindari perubahan mahal ketika development sudah berjalan.

3. DESIGN VISUAL DAN RESPONSIVE

Biaya design dipengaruhi jumlah halaman unik, variasi komponen, kebutuhan brand, tingkat custom, animasi, serta jumlah breakpoint. Mengadaptasi design referensi biasanya lebih efisien daripada membangun arah visual sepenuhnya dari awal, tetapi hasilnya tetap perlu disesuaikan dengan identitas, konten, dan target pengguna.

4. DEVELOPMENT DAN KUALITAS IMPLEMENTASI

Development mencakup lebih dari mengubah gambar menjadi halaman. Komponen harus responsif, interaksi harus memiliki state loading dan error, data harus divalidasi, serta kode perlu cukup rapi untuk dirawat. Fitur akun, dashboard, pembayaran, upload, pencarian, atau integrasi pihak ketiga menambah kebutuhan backend dan pengujian.

5. KONTEN DAN ASET

Siapa yang menulis copy, mengambil foto, membuat ilustrasi, atau memasukkan data akan memengaruhi biaya. Konten yang belum siap juga dapat memperpanjang jadwal. Pastikan penawaran menjelaskan apakah pekerjaan meliputi penulisan, editing, optimasi gambar, migrasi artikel, atau hanya menyediakan tempat untuk konten dari klien.

6. INFRASTRUKTUR DAN LAYANAN PIHAK KETIGA

Domain, hosting, database, penyimpanan media, email transaksi, analytics, CDN, serta payment gateway dapat memiliki biaya berulang. Sebagian dibayar langsung kepada penyedia layanan dan bukan bagian dari jasa development. Mintalah pemisahan antara biaya pembuatan dan biaya operasional agar anggaran tahunan lebih jelas.

7. TESTING, KEAMANAN, DAN PELUNCURAN

Pengujian mencakup perangkat, browser, formulir, hak akses, performa, SEO dasar, serta skenario kegagalan. Website yang menerima data atau pembayaran membutuhkan perhatian keamanan yang lebih tinggi. Proses deployment, konfigurasi environment, migrasi database, backup, dan pemantauan juga merupakan pekerjaan nyata.

8. REVISI, DUKUNGAN, DAN PEMELIHARAAN

Jumlah putaran revisi, masa garansi bug, dokumentasi, pelatihan admin, dan dukungan setelah launch harus tertulis. Pemeliharaan dapat mencakup update dependency, backup, monitoring, perubahan konten, atau pengembangan fitur baru. Bedakan perbaikan bug dari permintaan perubahan agar ekspektasi kedua pihak tetap sehat.

CARA MEMBANDINGKAN PENAWARAN

• Bandingkan hasil dan ruang lingkup yang sama.
• Periksa jumlah halaman, fitur, integrasi, dan revisi.
• Pastikan kepemilikan source code serta aset dijelaskan.
• Tanyakan biaya layanan pihak ketiga dan perpanjangannya.
• Periksa apa yang terjadi setelah website diluncurkan.
• Hindari asumsi; minta hal penting ditulis dalam proposal.

Harga terendah dapat tepat untuk kebutuhan sederhana, sedangkan investasi lebih besar masuk akal ketika website menjadi bagian penting dari penjualan atau operasional. Pilih ruang lingkup yang menjawab kebutuhan hari ini tanpa membuat bisnis terjebak pada fondasi yang sulit dikembangkan.',
    'Naki Code',
    '/images/blog/understanding-website-project-cost.webp',
    'published',
    CURRENT_TIMESTAMP
  ),
  (
    'menyiapkan-konten-sebelum-development-website',
    'Menyiapkan Konten Website Sebelum Mulai Development',
    'Konten yang siap membuat proses design dan development lebih cepat serta akurat. Gunakan panduan ini untuk menyiapkan struktur halaman, copy, foto, data, dan persetujuan.',
    'Banyak project website melambat bukan karena coding, melainkan karena konten belum memiliki pemilik, versi final, atau struktur yang jelas. Design yang dibangun dengan teks sementara sering berubah besar ketika konten asli masuk. Persiapan sederhana sejak awal membantu tim membuat keputusan layout yang lebih realistis.

1. TENTUKAN TUJUAN DAN AUDIENS SETIAP HALAMAN

Sebelum menulis, tentukan siapa yang membuka halaman dan tindakan apa yang diharapkan. Beranda bertugas memberi orientasi, halaman layanan membantu perbandingan, portofolio membangun kepercayaan, sedangkan kontak memulai percakapan. Satu halaman boleh memiliki beberapa informasi, tetapi sebaiknya tetap mempunyai satu tujuan utama.

2. BUAT DAFTAR HALAMAN DAN HIERARKINYA

Susun sitemap sederhana berisi halaman utama dan subhalaman. Tandai halaman wajib untuk peluncuran serta halaman yang dapat menyusul. Langkah ini membantu menentukan navigasi, kebutuhan design, estimasi waktu, dan relasi antarkonten sebelum pekerjaan teknis dimulai.

3. TULIS COPY BERDASARKAN PERTANYAAN PELANGGAN

Mulailah dari pertanyaan nyata: apa layanannya, siapa yang cocok, bagaimana prosesnya, berapa lama, apa hasilnya, dan bagaimana memulai. Gunakan bahasa yang konkret dan konsisten dengan cara brand berbicara. Judul sebaiknya menyampaikan manfaat atau konteks, bukan hanya terdengar menarik.

4. SIAPKAN FOTO DAN VISUAL YANG BENAR-BENAR BOLEH DIGUNAKAN

Kumpulkan logo sumber, foto, ilustrasi, icon, dan video dalam folder yang rapi. Catat pemilik serta hak penggunaannya. Hindari mengambil gambar acak dari internet. Pilih aset yang aktual dan representatif, lalu sediakan kualitas cukup tinggi agar dapat diolah untuk desktop maupun mobile.

5. INVENTARISASI DATA TERSTRUKTUR

Katalog produk, daftar layanan, anggota tim, testimoni, FAQ, portofolio, dan artikel sebaiknya disiapkan dalam format yang konsisten. Tentukan field yang wajib seperti nama, deskripsi, kategori, harga, gambar, status, dan tautan. Data yang rapi memudahkan impor serta mencegah kartu kosong atau informasi tidak seimbang.

6. TENTUKAN CALL TO ACTION

Pilih tindakan utama yang sesuai dengan tahap pelanggan, misalnya konsultasi, meminta penawaran, melihat design, atau melakukan checkout. Tentukan juga tujuan teknisnya: formulir, WhatsApp, email, kalender, atau halaman pembayaran. Copy tombol harus menjelaskan tindakan, bukan sekadar menggunakan kata umum.

7. SIAPKAN INFORMASI LEGAL DAN OPERASIONAL

Jika website mengumpulkan data, menjual produk, atau menerima pembayaran, siapkan kebijakan privasi, syarat layanan, refund, pengiriman, serta kontak resmi yang relevan. Isi dokumen perlu mencerminkan proses bisnis sebenarnya. Untuk kebutuhan hukum khusus, gunakan bantuan profesional yang sesuai.

8. TETAPKAN ALUR REVIEW DAN PERSETUJUAN

Tentukan siapa yang menulis, memeriksa fakta, dan memberi persetujuan final. Gunakan satu tempat penyimpanan serta penamaan versi yang jelas agar tim tidak memasukkan copy lama. Batasi feedback pada tahap yang disepakati sehingga perubahan besar tidak terus muncul saat website hampir selesai.

PAKET KONTEN MINIMAL UNTUK MEMULAI

• Sitemap dan prioritas halaman.
• Ringkasan brand serta target pelanggan.
• Draft judul, penjelasan, dan tombol utama.
• Logo serta panduan warna yang tersedia.
• Foto atau daftar kebutuhan foto.
• Data layanan, produk, portofolio, dan testimoni.
• Informasi kontak dan tautan sosial resmi.
• Nama pemberi persetujuan final.

Konten tidak harus sempurna sebelum project dimulai, tetapi struktur dan tanggung jawabnya harus jelas. Dengan bahan yang cukup nyata, design dapat menyesuaikan panjang teks, jumlah gambar, dan prioritas informasi sejak awal. Hasilnya lebih akurat, revisi lebih terarah, dan waktu development digunakan untuk membangun pengalaman yang baik.',
    'Naki Code',
    '/images/blog/prepare-content-before-web-development.webp',
    'published',
    CURRENT_TIMESTAMP
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  author = VALUES(author),
  cover_image = VALUES(cover_image),
  status = VALUES(status),
  published_at = COALESCE(published_at, VALUES(published_at)),
  deleted_at = NULL;

-- DOWN
DELETE FROM blog_posts
WHERE slug IN (
  'halaman-penting-website-bisnis',
  'cara-memilih-design-website-sesuai-brand',
  'checklist-responsive-performa-sebelum-launch',
  'kapan-bisnis-perlu-redesign-website',
  'memahami-biaya-pembuatan-website-profesional',
  'menyiapkan-konten-sebelum-development-website'
);
