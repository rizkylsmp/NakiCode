import { CalendarClock, Pencil, Plus, RefreshCw, Tag, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut, getApiErrorMessage } from "../../services/api-client";

type Coupon = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  createdAt: string;
  redemptionCount: number;
};

type CouponForm = Omit<Coupon, "id" | "createdAt" | "redemptionCount" | "expiresAt" | "maxRedemptions"> & {
  limitType: "time" | "usage";
  expiresAt: string;
  maxRedemptions: number;
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
};

export function AdminCouponsSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Memuat kupon...");

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ coupons: Coupon[] }>("/api/business/coupons");
      setCoupons(data.coupons ?? []);
      setStatus(`${data.coupons?.length ?? 0} kupon ditemukan.`);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal memuat kupon."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      expiresAt: coupon.maxRedemptions !== null ? "" : (coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : ""),
      maxRedemptions: coupon.maxRedemptions ?? 10,
    });
    setIsOpen(true);
  }

  async function saveCoupon(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      expiresAt: form.limitType === "time" && form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      maxRedemptions: form.limitType === "usage" ? form.maxRedemptions : null,
    };
    try {
      const data = editingId
        ? await apiPut<{ coupons: Coupon[] }>(`/api/business/coupons/${editingId}`, payload)
        : await apiPost<{ coupons: Coupon[] }>("/api/business/coupons", payload);
      setCoupons(data.coupons ?? []);
      setStatus(editingId ? "Kupon diperbarui." : "Kupon dibuat.");
      setIsOpen(false);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan kupon."));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    const payload = {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      active: !coupon.active,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
      maxRedemptions: coupon.maxRedemptions,
    };
    const data = await apiPut<{ coupons: Coupon[] }>(`/api/business/coupons/${coupon.id}`, payload);
    setCoupons(data.coupons ?? []);
    setStatus(`Kupon ${coupon.code} ${coupon.active ? "dinonaktifkan" : "diaktifkan"}.`);
  }

  async function removeCoupon(coupon: Coupon) {
    if (!window.confirm(`Hapus kupon ${coupon.code}?`)) return;
    try {
      const data = await apiDelete<{ coupons: Coupon[]; archived: boolean }>(`/api/business/coupons/${coupon.id}`);
      setCoupons(data.coupons ?? []);
      setStatus(data.archived ? "Kupon pernah dipakai dan telah dinonaktifkan." : "Kupon dihapus.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menghapus kupon."));
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Coupon</h1>
          <p className="mt-1 text-sm text-naki-smoke">Atur diskon yang dapat digunakan saat checkout Midtrans.</p>
        </div>
        <div className="flex gap-2">
          <button className="grid size-11 place-items-center rounded-lg border border-naki-steel bg-white text-naki-smoke" onClick={() => void loadCoupons()} title="Refresh" type="button"><RefreshCw className={isLoading ? "animate-spin" : ""} size={17} /></button>
          <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" onClick={openCreate} type="button"><Plus size={17} />Tambah coupon</button>
        </div>
      </div>

      <p className="rounded-lg border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke" aria-live="polite">{status}</p>

      <div className="overflow-hidden rounded-xl border border-naki-steel bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left">
            <thead className="bg-naki-frost text-xs uppercase text-naki-smoke"><tr><th className="p-4">Kode</th><th className="p-4">Diskon</th><th className="p-4">Batas</th><th className="p-4">Dipakai</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-naki-steel">
              {coupons.map((coupon) => {
                const timeExpired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt) <= new Date());
                const usageExpired = coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions;
                const expired = timeExpired || usageExpired;
                const limitLabel = coupon.maxRedemptions !== null
                  ? `${coupon.maxRedemptions} pemakaian`
                  : coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                    : "Tanpa batas";
                const usageLabel = coupon.maxRedemptions !== null
                  ? `${coupon.redemptionCount}/${coupon.maxRedemptions}`
                  : `${coupon.redemptionCount} order`;
                return <tr key={coupon.id} className="text-sm">
                  <td className="p-4"><p className="font-bold text-naki-primary">{coupon.code}</p><p className="mt-1 max-w-72 text-xs text-naki-smoke">{coupon.description}</p></td>
                  <td className="p-4 font-semibold text-naki-primary">{coupon.discountType === "percent" ? `${coupon.discountValue}%` : `Rp${coupon.discountValue.toLocaleString("id-ID")}`}</td>
                  <td className="p-4 text-naki-smoke">{limitLabel}</td>
                  <td className="p-4 text-naki-primary">{usageLabel}</td>
                  <td className="p-4"><button className={`rounded-full px-3 py-1 text-xs font-semibold ${coupon.active && !expired ? "bg-green-50 text-green-700" : "bg-naki-frost text-naki-smoke"}`} onClick={() => void toggleCoupon(coupon)} type="button">{usageExpired ? "Habis" : timeExpired ? "Kedaluwarsa" : coupon.active ? "Aktif" : "Nonaktif"}</button></td>
                  <td className="p-4"><div className="flex justify-end gap-1"><button className="grid size-9 place-items-center rounded-lg text-naki-smoke hover:bg-naki-frost" onClick={() => openEdit(coupon)} title="Edit" type="button"><Pencil size={16} /></button><button className="grid size-9 place-items-center rounded-lg text-red-500 hover:bg-red-50" onClick={() => void removeCoupon(coupon)} title="Hapus" type="button"><Trash2 size={16} /></button></div></td>
                </tr>;
              })}
              {!isLoading && coupons.length === 0 ? <tr><td className="p-10 text-center text-sm text-naki-smoke" colSpan={6}><Tag className="mx-auto mb-2" size={24} />Belum ada coupon.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen ? <div className="fixed inset-0 z-70 grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}><form className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onSubmit={saveCoupon}><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-naki-primary">{editingId ? "Edit coupon" : "Tambah coupon"}</h2><p className="mt-1 text-xs text-naki-smoke">Kode otomatis disimpan dalam huruf kapital.</p></div><button className="grid size-9 place-items-center rounded-lg text-naki-smoke hover:bg-naki-frost" onClick={() => setIsOpen(false)} type="button"><X size={18} /></button></div><div className="mt-5 grid gap-4"><label className="grid gap-1.5 text-sm font-medium text-naki-primary">Kode<input required pattern="[A-Za-z0-9_-]+" maxLength={60} className="h-11 rounded-lg border border-naki-steel px-3 uppercase outline-none focus:border-blue-400" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label><label className="grid gap-1.5 text-sm font-medium text-naki-primary">Keterangan<input required maxLength={255} className="h-11 rounded-lg border border-naki-steel px-3 outline-none focus:border-blue-400" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium text-naki-primary">Jenis<select className="h-11 rounded-lg border border-naki-steel px-3" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as CouponForm["discountType"] })}><option value="percent">Persen</option><option value="fixed">Nominal</option></select></label><label className="grid gap-1.5 text-sm font-medium text-naki-primary">Nilai<input required min={1} max={form.discountType === "percent" ? 100 : undefined} className="h-11 rounded-lg border border-naki-steel px-3" type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium text-naki-primary">Batas<select className="h-11 rounded-lg border border-naki-steel px-3" value={form.limitType} onChange={(event) => setForm((current) => event.target.value === "usage" ? { ...current, limitType: "usage", expiresAt: "" } : { ...current, limitType: "time", maxRedemptions: current.maxRedemptions || 10 })}><option value="time">Waktu kedaluwarsa</option><option value="usage">Jumlah pemakaian</option></select></label>{form.limitType === "time" ? <label className="grid gap-1.5 text-sm font-medium text-naki-primary"><span className="inline-flex items-center gap-2"><CalendarClock size={15} />Berlaku sampai</span><input required className="h-11 rounded-lg border border-naki-steel px-3" type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label> : <label className="grid gap-1.5 text-sm font-medium text-naki-primary"><span className="inline-flex items-center gap-2"><Tag size={15} />Maksimal pemakaian</span><input required min={1} className="h-11 rounded-lg border border-naki-steel px-3" type="number" value={form.maxRedemptions} onChange={(event) => setForm({ ...form, maxRedemptions: Number(event.target.value) })} /></label>}</div><label className="flex items-center gap-3 text-sm font-medium text-naki-primary"><input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" />Aktifkan coupon</label><p className="text-xs text-naki-smoke">Jika memilih batas pemakaian, coupon akan habis saat jumlah pemakaian mencapai angka maksimum.</p></div><button className="mt-6 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan coupon"}</button></form></div> : null}
    </section>
  );
}
