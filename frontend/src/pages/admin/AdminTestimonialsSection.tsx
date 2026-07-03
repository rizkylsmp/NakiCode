import { Star, Trash2, Edit2, Plus, MessageSquareQuote, X, Save, PenLine, StarIcon, MessageCircle, Eye, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api-client";
import type { TestimonialItem } from "../admin/AdminTemplateWorkspace.shared";
import { useToast } from "../../components/Toast";

type AvailableRating = {
  id: number;
  customer_name: string;
  rating: number;
  message: string | null;
  created_at: string;
  template_title: string | null;
};

type AdminTestimonialsSectionProps = {
  adminToken: string | null;
  testimonials: TestimonialItem[];
  onTestimonialsChange: (testimonials: TestimonialItem[]) => void;
};

export function AdminTestimonialsSection({
  adminToken,
  testimonials,
  onTestimonialsChange,
}: AdminTestimonialsSectionProps) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isRatingPickerOpen, setIsRatingPickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<TestimonialItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(null);
  const [availableRatings, setAvailableRatings] = useState<AvailableRating[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [selectedRatingId, setSelectedRatingId] = useState<number | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_role: "",
    quote: "",
    rating: 5,
    is_featured: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleOpenSourceDialog = () => {
    setError("");
    setIsSourceDialogOpen(true);
  };

  const handleCloseSourceDialog = () => {
    setIsSourceDialogOpen(false);
  };

  const handleSelectManual = () => {
    setIsSourceDialogOpen(false);
    setEditingTestimonial(null);
    setFormData({
      customer_name: "",
      customer_role: "",
      quote: "",
      rating: 5,
      is_featured: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSelectFromRating = async () => {
    setIsSourceDialogOpen(false);
    setIsRatingPickerOpen(true);
    setRatingError("");
    setSelectedRatingId(null);
    setIsLoadingRatings(true);

    try {
      const data = await apiGet<{ ratings: AvailableRating[] }>("/api/testimonials/available-ratings");
      setAvailableRatings(data.ratings ?? []);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Gagal memuat daftar rating");
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const handleCloseRatingPicker = () => {
    setIsRatingPickerOpen(false);
    setAvailableRatings([]);
    setSelectedRatingId(null);
    setRatingError("");
  };

  const handlePickRating = async () => {
    if (!adminToken || selectedRatingId === null) return;

    setIsLoading(true);
    setRatingError("");

    try {
      const response = await apiPost<{ testimonial: TestimonialItem }>(
        `/api/testimonials/from-rating/${selectedRatingId}`
      );
      onTestimonialsChange([response.testimonial, ...testimonials]);
      handleCloseRatingPicker();
      toast.addToast('success', 'Testimonial berhasil ditambahkan dari review');
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Gagal membuat testimonial dari rating");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (testimonial?: TestimonialItem) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        customer_name: testimonial.customer_name,
        customer_role: testimonial.customer_role || "",
        quote: testimonial.quote,
        rating: testimonial.rating,
        is_featured: testimonial.is_featured,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        customer_name: "",
        customer_role: "",
        quote: "",
        rating: 5,
        is_featured: true,
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setFormData({
      customer_name: "",
      customer_role: "",
      quote: "",
      rating: 5,
      is_featured: true,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    setIsLoading(true);
    setError("");

    try {
      if (editingTestimonial) {
        const response = await apiPut<{ testimonial: TestimonialItem }>(
          `/api/testimonials/${editingTestimonial.id}`,
          formData
        );
        onTestimonialsChange(
          testimonials.map((t) =>
            t.id === editingTestimonial.id ? response.testimonial : t
          )
        );
        toast.addToast('success', 'Testimonial berhasil diperbarui');
      } else {
        const response = await apiPost<{ testimonial: TestimonialItem }>(
          "/api/testimonials",
          formData
        );
        onTestimonialsChange([response.testimonial, ...testimonials]);
        toast.addToast('success', 'Testimonial berhasil ditambahkan');
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan testimonial");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (testimonial: TestimonialItem) => {
    setDeleteTarget(testimonial);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToken || !deleteTarget) return;

    setIsLoading(true);
    try {
      await apiDelete(`/api/testimonials/${deleteTarget.id}`);
      onTestimonialsChange(testimonials.filter((t) => t.id !== deleteTarget.id));
      toast.addToast('success', 'Testimonial berhasil dihapus');
    } catch (err) {
      toast.addToast('error', err instanceof Error ? err.message : "Gagal menghapus testimonial");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handlePreview = (testimonial: TestimonialItem) => {
    setPreviewData(testimonial);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewData(null);
  };

  const handleToggleFeatured = async (testimonial: TestimonialItem) => {
    if (!adminToken) return;

    try {
      const response = await apiPut<{ testimonial: TestimonialItem }>(
        `/api/testimonials/${testimonial.id}`,
        { is_featured: !testimonial.is_featured }
      );
      onTestimonialsChange(
        testimonials.map((t) =>
          t.id === testimonial.id ? response.testimonial : t
        )
      );
      toast.addToast('success', `Testimonial ${!testimonial.is_featured ? 'ditampilkan' : 'disembunyikan'}`);
    } catch (err) {
      toast.addToast('error', err instanceof Error ? err.message : "Gagal mengubah status testimonial");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!adminToken || draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = testimonials.findIndex(t => t.id === draggedId);
    const targetIndex = testimonials.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newOrder = [...testimonials];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    // Update UI immediately
    onTestimonialsChange(newOrder);

    // Update sort_order in backend
    try {
      const updates = newOrder.map((t, index) =>
        apiPut(`/api/testimonials/${t.id}`, { sort_order: index })
      );
      await Promise.all(updates);
      toast.addToast('success', 'Urutan testimonial berhasil diubah');
    } catch (err) {
      toast.addToast('error', 'Gagal mengubah urutan testimonial');
      // Reload to restore original order
      const data = await apiGet<{ testimonials: TestimonialItem[] }>("/api/testimonials/admin");
      onTestimonialsChange(data.testimonials);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-naki-primary">Testimonials</h2>
          <p className="text-sm text-naki-smoke mt-1">
            Kelola testimonial yang ditampilkan di halaman utama
          </p>
        </div>
        <button
          onClick={handleOpenSourceDialog}
          className="flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white hover:bg-naki-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Testimonial
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-lg border border-naki-steel bg-naki-bg p-12 text-center">
          <MessageSquareQuote className="mx-auto h-12 w-12 text-naki-smoke mb-4" />
          <p className="text-naki-smoke">Belum ada testimonial</p>
          <p className="text-sm text-naki-smoke/70 mt-1">
            Klik tombol "Tambah Testimonial" untuk membuat testimonial baru
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`rounded-lg border bg-naki-bg p-6 space-y-3 transition-all ${
                dragOverId === testimonial.id
                  ? 'border-naki-primary border-2 shadow-lg'
                  : draggedId === testimonial.id
                  ? 'opacity-50 border-naki-steel'
                  : 'border-naki-steel'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, testimonial.id)}
              onDragOver={(e) => handleDragOver(e, testimonial.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, testimonial.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="cursor-grab active:cursor-grabbing text-naki-smoke hover:text-naki-primary mt-1"
                    title="Drag untuk mengubah urutan"
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-naki-primary">
                        {testimonial.customer_name}
                      </h3>
                      {testimonial.customer_role && (
                        <span className="text-sm text-naki-smoke">
                          • {testimonial.customer_role}
                        </span>
                      )}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          testimonial.source_type === "rating"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {testimonial.source_type === "rating" ? "Dari Rating" : "Manual"}
                      </span>
                    </div>
                    <p className="text-sm text-naki-primary/90 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-naki-steel"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(testimonial)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      testimonial.is_featured
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-naki-steel text-naki-smoke hover:bg-naki-steel/80"
                    }`}
                    title={testimonial.is_featured ? "Ditampilkan" : "Tidak ditampilkan"}
                  >
                    {testimonial.is_featured ? "Featured" : "Hidden"}
                  </button>
                  <button
                    onClick={() => handlePreview(testimonial)}
                    className="rounded-lg p-2 text-naki-smoke hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(testimonial)}
                    className="rounded-lg p-2 text-naki-smoke hover:bg-naki-steel hover:text-naki-primary transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial)}
                    className="rounded-lg p-2 text-naki-smoke hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSourceDialogOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full my-10 mx-4 max-w-lg rounded-2xl bg-white shadow-naki-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white/95 p-5 backdrop-blur rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold leading-tight text-naki-primary">
                  Tambah Testimonial
                </h2>
                <p className="mt-1 text-sm text-naki-smoke">
                  Pilih sumber testimonial
                </p>
              </div>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={handleCloseSourceDialog}
                type="button"
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <button
                onClick={handleSelectManual}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-naki-steel bg-white hover:border-naki-primary hover:bg-naki-frost transition-all group"
              >
                <div className="shrink-0 grid size-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <PenLine size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-naki-primary">
                    Tulis Manual
                  </h3>
                  <p className="mt-1 text-sm text-naki-smoke">
                    Buat testimonial baru dengan mengisi form secara manual
                  </p>
                </div>
              </button>

              <button
                onClick={handleSelectFromRating}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-naki-steel bg-white hover:border-naki-primary hover:bg-naki-frost transition-all group"
              >
                <div className="shrink-0 grid size-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <MessageCircle size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-naki-primary">
                    Dari Review Template
                  </h3>
                  <p className="mt-1 text-sm text-naki-smoke">
                    Pilih dari review template yang sudah ada
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {isRatingPickerOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full my-10 mx-4 max-w-2xl rounded-2xl bg-white shadow-naki-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white/95 p-5 backdrop-blur rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold leading-tight text-naki-primary">
                  Pilih Review
                </h2>
                <p className="mt-1 text-sm text-naki-smoke">
                  Pilih review yang akan dijadikan testimonial
                </p>
              </div>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={handleCloseRatingPicker}
                type="button"
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5">
              {ratingError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {ratingError}
                </div>
              )}

              {isLoadingRatings ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-naki-primary border-t-transparent" />
                </div>
              ) : availableRatings.length === 0 ? (
                <div className="text-center py-12">
                  <StarIcon className="mx-auto h-12 w-12 text-naki-smoke mb-3" />
                  <p className="text-naki-smoke">Tidak ada review yang tersedia</p>
                  <p className="mt-1 text-sm text-naki-smoke/70">
                    Semua review sudah dijadikan testimonial
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableRatings.map((rating) => (
                      <label
                        key={rating.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRatingId === rating.id
                            ? "border-naki-primary bg-naki-frost"
                            : "border-naki-steel bg-white hover:border-naki-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="rating"
                          value={rating.id}
                          checked={selectedRatingId === rating.id}
                          onChange={() => setSelectedRatingId(rating.id)}
                          className="mt-1 h-4 w-4 text-naki-primary focus:ring-naki-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-naki-primary">
                              {rating.customer_name}
                            </span>
                            {rating.template_title && (
                              <span className="text-xs text-naki-smoke bg-naki-frost px-2 py-0.5 rounded">
                                {rating.template_title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < rating.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-naki-steel"
                                }`}
                              />
                            ))}
                          </div>
                          {rating.message && (
                            <p className="text-sm text-naki-smoke italic">
                              "{rating.message}"
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 mt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCloseRatingPicker}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handlePickRating}
                      disabled={selectedRatingId === null || isLoading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Save size={17} />
                          Jadikan Testimonial
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full my-10 mx-4 max-w-2xl rounded-2xl bg-white shadow-naki-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white/95 p-5 backdrop-blur rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold leading-tight text-naki-primary">
                  {editingTestimonial ? "Edit Testimonial" : "Tambah Testimonial Baru"}
                </h2>
                <p className="mt-1 text-sm text-naki-smoke">
                  {editingTestimonial ? "Perbarui informasi testimonial" : "Buat testimonial baru untuk ditampilkan di homepage"}
                </p>
              </div>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={handleCloseModal}
                type="button"
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-naki-smoke">
                    Nama Customer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
                    placeholder="Contoh: John Doe"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-naki-smoke">
                    Role/Profesi
                  </label>
                  <input
                    type="text"
                    value={formData.customer_role}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_role: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
                    placeholder="Contoh: Frontend Developer"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-naki-smoke">
                  Testimonial <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-blue-400"
                  rows={4}
                  placeholder="Tulis testimonial dari customer di sini..."
                  required
                />
                <p className="text-xs text-naki-smoke">
                  {formData.quote.length} karakter
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-naki-smoke">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`Rating ${i + 1} dari 5`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          i < formData.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-naki-steel hover:text-amber-400"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-naki-primary">
                    {formData.rating} dari 5
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-naki-steel bg-naki-frost p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData({ ...formData, is_featured: e.target.checked })
                    }
                    className="mt-0.5 h-5 w-5 rounded border-naki-steel text-naki-primary focus:ring-naki-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-naki-primary">
                      Tampilkan di Homepage
                    </p>
                    <p className="mt-0.5 text-xs text-naki-smoke">
                      Testimonial akan muncul di section testimoni halaman utama
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingTestimonial ? "Update Testimonial" : "Tambah Testimonial"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-naki-card">
            <div className="flex items-center justify-between border-b border-naki-steel p-5">
              <h2 className="text-xl font-bold text-naki-primary">
                Hapus Testimonial?
              </h2>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={cancelDelete}
                type="button"
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-naki-smoke leading-relaxed">
                Testimonial dari <span className="font-semibold text-naki-primary">{deleteTarget.customer_name}</span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  onClick={cancelDelete}
                  type="button"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={confirmDelete}
                  type="button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && previewData && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-naki-card">
            <div className="flex items-center justify-between border-b border-naki-steel p-5">
              <h2 className="text-xl font-bold text-naki-primary">
                Preview Testimonial
              </h2>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={closePreview}
                type="button"
                aria-label="Tutup preview"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-naki-steel">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < previewData.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-naki-steel"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-naki-smoke">
                  "{previewData.quote}"
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-500">
                    {previewData.customer_name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-naki-primary">
                      {previewData.customer_name}
                    </p>
                    {previewData.customer_role && (
                      <p className="text-xs text-naki-smoke">{previewData.customer_role}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closePreview}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  type="button"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
