import { CalendarClock, ImageIcon, Pencil, Plus, RefreshCw, Tag, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut, getApiErrorMessage } from "../../services/api-client";
import { formatRupiahInputPreview } from "../../utils/currency";
import { ImageUploadDropZone } from "./AdminDesignWorkspace.shared";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useClientPagination } from "../../hooks/useClientPagination";

type Coupon = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  imageUrl: string | null;
  showBanner: boolean;
  createdAt: string;
  redemptionCount: number;
};

type CouponForm = {
  code: string;
  description: string;
  discountType: Coupon["discountType"];
  discountValue: number;
  active: boolean;
  limitType: "time" | "usage";
  expiresAt: string;
  maxRedemptions: number;
  imageUrl: string | null;
  showBanner: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  active: true,
  limitType: "time",
  expiresAt: "",
  maxRedemptions: 10,
  imageUrl: null,
  showBanner: false,
};

export function AdminCouponsSection({ adminToken }: { adminToken: string | null }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [status, setStatus] = useState("Memuat coupon...");
  const [uploadStatus, setUploadStatus] = useState("Belum ada gambar banner.");
  const {
    page,
    pageSize,
    paginatedItems: paginatedCoupons,
    setPage,
    setPageSize,
    totalPages,
  } = useClientPagination(coupons);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ coupons: Coupon[] }>("/api/business/coupons");
      setCoupons(data.coupons ?? []);
      setStatus(`${data.coupons?.length ?? 0} coupon ditemukan.`);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal memuat coupon."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setUploadStatus("Belum ada gambar banner.");
    setIsOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      active: coupon.active,
      limitType: coupon.maxRedemptions !== null ? "usage" : "time",
      expiresAt: coupon.maxRedemptions !== null ? "" : (coupon.expiresAt?.slice(0, 16) ?? ""),
      maxRedemptions: coupon.maxRedemptions ?? 10,
      imageUrl: coupon.imageUrl,
      showBanner: coupon.showBanner,
    });
    setUploadStatus(coupon.imageUrl ? "Gambar banner siap digunakan." : "Belum ada gambar banner.");
    setIsOpen(true);
  }

  async function saveCoupon(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      active: form.active,
      expiresAt: form.limitType === "time" && form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      maxRedemptions: form.limitType === "usage" ? form.maxRedemptions : null,
      imageUrl: form.imageUrl,
      showBanner: form.showBanner,
    };
    try {
      const data = editingId
        ? await apiPut<{ coupons: Coupon[] }>(`/api/business/coupons/${editingId}`, payload)
        : await apiPost<{ coupons: Coupon[] }>("/api/business/coupons", payload);
      setCoupons(data.coupons ?? []);
      setStatus(editingId ? "Coupon diperbarui." : "Coupon dibuat.");
      setIsOpen(false);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan coupon."));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setUpdatingId(coupon.id);
    try {
      const data = await apiPut<{ coupons: Coupon[] }>(`/api/business/coupons/${coupon.id}`, {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        active: !coupon.active,
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
        maxRedemptions: coupon.maxRedemptions,
        imageUrl: coupon.imageUrl,
        showBanner: coupon.showBanner,
      });
      setCoupons(data.coupons ?? []);
      setStatus(`Coupon ${coupon.code} ${coupon.active ? "dinonaktifkan" : "diaktifkan"}.`);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal mengubah status coupon."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeCoupon(coupon: Coupon) {
    if (!window.confirm(`Hapus coupon ${coupon.code}?`)) return;
    setUpdatingId(coupon.id);
    try {
      const data = await apiDelete<{ coupons: Coupon[]; archived: boolean }>(`/api/business/coupons/${coupon.id}`);
      setCoupons(data.coupons ?? []);
      setStatus(data.archived ? "Coupon pernah dipakai dan telah dinonaktifkan." : "Coupon dihapus.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menghapus coupon."));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Coupon</h1>
          <p className="mt-1 text-sm text-naki-smoke">Atur diskon checkout dan banner promo yang tampil sekali kepada pengunjung.</p>
        </div>
        <div className="flex gap-2">
          <button aria-label="Muat ulang coupon" className="grid size-11 place-items-center rounded-lg border border-naki-steel bg-white text-naki-smoke" onClick={() => void loadCoupons()} type="button"><RefreshCw className={isLoading ? "animate-spin" : ""} size={17} /></button>
          <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" onClick={openCreate} type="button"><Plus size={17} />Tambah coupon</button>
        </div>
      </div>

      <p className="rounded-lg border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke" aria-live="polite">{status}</p>

      <div className="overflow-hidden rounded-xl border border-naki-steel bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left">
            <thead className="bg-naki-frost text-xs uppercase text-naki-smoke"><tr><th className="p-4">Kode</th><th className="p-4">Diskon</th><th className="p-4">Batas</th><th className="p-4">Dipakai</th><th className="p-4">Banner</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-naki-steel">
              {paginatedCoupons.map((coupon) => {
                const timeExpired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt) <= new Date());
                const usageExpired = coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions;
                const expired = timeExpired || usageExpired;
                const limitLabel = coupon.maxRedemptions !== null ? `${coupon.maxRedemptions} pemakaian` : coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Tanpa batas";
                return (
                  <tr key={coupon.id} className="text-sm">
                    <td className="p-4"><p className="font-bold text-naki-primary">{coupon.code}</p><p className="mt-1 max-w-72 text-xs text-naki-smoke">{coupon.description}</p></td>
                    <td className="p-4 font-semibold text-naki-primary">{coupon.discountType === "percent" ? `${coupon.discountValue}%` : `Rp${coupon.discountValue.toLocaleString("id-ID")}`}</td>
                    <td className="p-4 text-naki-smoke">{limitLabel}</td>
                    <td className="p-4 text-naki-primary">{coupon.maxRedemptions !== null ? `${coupon.redemptionCount}/${coupon.maxRedemptions}` : `${coupon.redemptionCount} order`}</td>
                    <td className="p-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${coupon.showBanner && coupon.imageUrl ? "bg-blue-50 text-blue-700" : "bg-naki-frost text-naki-smoke"}`}><ImageIcon size={13} />{coupon.showBanner && coupon.imageUrl ? "Tampil" : "Tidak tampil"}</span></td>
                    <td className="p-4"><button className={`min-h-9 rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${coupon.active && !expired ? "bg-green-50 text-green-700" : "bg-naki-frost text-naki-smoke"}`} disabled={updatingId === coupon.id} onClick={() => void toggleCoupon(coupon)} type="button">{updatingId === coupon.id ? "Memproses..." : usageExpired ? "Habis" : timeExpired ? "Kedaluwarsa" : coupon.active ? "Aktif" : "Nonaktif"}</button></td>
                    <td className="p-4"><div className="flex justify-end gap-1"><button aria-label={`Edit coupon ${coupon.code}`} className="grid size-11 place-items-center rounded-lg text-naki-smoke hover:bg-naki-frost disabled:opacity-60" disabled={updatingId === coupon.id} onClick={() => openEdit(coupon)} type="button"><Pencil size={16} /></button><button aria-label={`Hapus coupon ${coupon.code}`} className="grid size-11 place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-60" disabled={updatingId === coupon.id} onClick={() => void removeCoupon(coupon)} type="button"><Trash2 size={16} /></button></div></td>
                  </tr>
                );
              })}
              {!isLoading && coupons.length === 0 ? <tr><td className="p-10 text-center text-sm text-naki-smoke" colSpan={7}><Tag className="mx-auto mb-2" size={24} />Belum ada coupon.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        alwaysVisible
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        page={page}
        pageSize={pageSize}
        total={coupons.length}
        totalPages={totalPages}
      />

      {isOpen ? (
        <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsOpen(false); }}>
          <form aria-modal="true" className="my-4 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl sm:p-6" onSubmit={saveCoupon} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-bold text-naki-primary">{editingId ? "Edit coupon" : "Tambah coupon"}</h2><p className="mt-1 text-xs text-naki-smoke">Kode otomatis disimpan dalam huruf kapital.</p></div>
              <button aria-label="Tutup form coupon" className="grid size-11 shrink-0 place-items-center rounded-lg text-naki-smoke hover:bg-naki-frost" disabled={isSaving} onClick={() => setIsOpen(false)} type="button"><X size={18} /></button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-naki-primary">Kode<input required pattern="[A-Za-z0-9_-]+" maxLength={60} className="h-11 rounded-lg border border-naki-steel px-3 uppercase outline-none focus:border-blue-400" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-naki-primary">Keterangan<input required maxLength={255} className="h-11 rounded-lg border border-naki-steel px-3 outline-none focus:border-blue-400" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-naki-primary">Jenis<select className="h-11 rounded-lg border border-naki-steel px-3" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as CouponForm["discountType"] })}><option value="percent">Persen</option><option value="fixed">Nominal</option></select></label>
                <label className="grid gap-1.5 text-sm font-medium text-naki-primary">
                  Nilai
                  <input required min={1} max={form.discountType === "percent" ? 100 : undefined} className="h-11 rounded-lg border border-naki-steel px-3" type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} />
                  {form.discountType === "fixed" ? (
                    <span aria-live="polite" className="text-xs font-semibold text-naki-secondary">
                      {formatRupiahInputPreview(form.discountValue)}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-naki-primary">Batas<select className="h-11 rounded-lg border border-naki-steel px-3" value={form.limitType} onChange={(event) => setForm((current) => event.target.value === "usage" ? { ...current, limitType: "usage", expiresAt: "" } : { ...current, limitType: "time" })}><option value="time">Waktu kedaluwarsa</option><option value="usage">Jumlah pemakaian</option></select></label>
                {form.limitType === "time" ? <label className="grid gap-1.5 text-sm font-medium text-naki-primary"><span className="inline-flex items-center gap-2"><CalendarClock size={15} />Berlaku sampai</span><input required className="h-11 rounded-lg border border-naki-steel px-3" type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label> : <label className="grid gap-1.5 text-sm font-medium text-naki-primary"><span className="inline-flex items-center gap-2"><Tag size={15} />Maksimal pemakaian</span><input required min={1} className="h-11 rounded-lg border border-naki-steel px-3" type="number" value={form.maxRedemptions} onChange={(event) => setForm({ ...form, maxRedemptions: Number(event.target.value) })} /></label>}
              </div>

              <ImageUploadDropZone adminToken={adminToken} description="JPG, PNG, atau WebP. Gambar akan dipakai sebagai visual banner promo." multiple={false} onStatusChange={setUploadStatus} onUploaded={(urls) => setForm((current) => ({ ...current, imageUrl: urls[0] ?? current.imageUrl }))} status={uploadStatus} successMessage={() => "Gambar banner berhasil diunggah."} title="Foto banner coupon" uploadLabel="Upload foto banner" />
              {form.imageUrl ? <div className="relative overflow-hidden rounded-xl border border-naki-steel bg-naki-frost"><img alt="Preview banner coupon" className="aspect-16/7 w-full object-cover" src={form.imageUrl} /><button aria-label="Hapus gambar banner" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/95 text-red-500 shadow-md" onClick={() => setForm((current) => ({ ...current, imageUrl: null, showBanner: false }))} type="button"><Trash2 size={17} /></button></div> : null}

              <div className="grid gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-naki-primary"><input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" />Aktifkan coupon</label>
                <label className={`flex min-h-11 items-center gap-3 text-sm font-medium ${form.imageUrl ? "text-naki-primary" : "text-naki-smoke"}`}><input checked={form.showBanner} disabled={!form.imageUrl} onChange={(event) => setForm({ ...form, showBanner: event.target.checked })} type="checkbox" />Aktifkan banner</label>
              </div>
              <p className="text-xs leading-5 text-naki-smoke">Banner aktif tampil sekali per browser untuk rangkaian promo saat ini. Jika ada beberapa banner aktif, semuanya ditampilkan sebagai slider otomatis.</p>
            </div>
            <button className="mt-6 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan coupon"}</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
