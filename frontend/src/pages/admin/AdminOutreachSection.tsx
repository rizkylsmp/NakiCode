import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost, getApiErrorMessage } from "../../services/api-client";
import { getOutreachWhatsAppLink } from "../../utils/outreach-whatsapp";

type LeadStatus = "new" | "reviewed" | "ready" | "sending" | "sent" | "replied" | "qualified" | "won" | "lost" | "failed" | "do_not_contact";
type Lead = {
  id: number;
  external_key: string;
  business_name: string;
  category: string;
  city: string;
  source_url: string;
  evidence_url: string;
  contact_url: string;
  observation: string;
  opportunity: string;
  score: number;
  draft_message: string;
  status: LeadStatus;
  whatsapp_number: string | null;
  opt_in_at: string | null;
  opt_in_source: string | null;
  sent_at: string | null;
  last_error: string | null;
  checked_at: string | null;
  notes: string | null;
  updated_at: string;
};
type LeadForm = {
  externalKey: string;
  businessName: string;
  category: string;
  city: string;
  sourceUrl: string;
  evidenceUrl: string;
  contactUrl: string;
  observation: string;
  opportunity: string;
  score: number;
  draftMessage: string;
  notes: string;
};
const blank: LeadForm = { externalKey: "", businessName: "", category: "", city: "", sourceUrl: "", evidenceUrl: "", contactUrl: "", observation: "", opportunity: "", score: 0, draftMessage: "", notes: "" };
const statuses: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "Baru" }, { value: "reviewed", label: "Ditinjau" },
  { value: "ready", label: "Siap kirim (opt-in)" }, { value: "sending", label: "Mengirim" },
  { value: "sent", label: "Diterima API" }, { value: "replied", label: "Membalas" },
  { value: "qualified", label: "Layak" }, { value: "won", label: "Deal" },
  { value: "lost", label: "Tidak lanjut" }, { value: "failed", label: "Gagal kirim" },
  { value: "do_not_contact", label: "Jangan hubungi" },
];
const inputClass = "min-h-11 w-full rounded-xl border border-naki-steel bg-white px-3 py-2 text-sm text-naki-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary";

export function AdminOutreachSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState<LeadForm>(blank);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [optInAt, setOptInAt] = useState("");
  const [optInSource, setOptInSource] = useState("");
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const contactDirty = selected && (
    whatsappNumber !== (selected.whatsapp_number ?? "") ||
    optInSource !== (selected.opt_in_source ?? "") ||
    optInAt !== (selected.opt_in_at ? new Date(selected.opt_in_at).toISOString().slice(0, 16) : "") ||
    status !== selected.status
  );
  const manualWhatsApp = selected ? getOutreachWhatsAppLink(selected, draft) : null;
  const manualReason = contactDirty ? "Simpan perubahan kontak dan status sebelum membuka WhatsApp." : manualWhatsApp?.reason;
  const manualHref = !busy && !loading && !manualReason ? manualWhatsApp?.href : null;
  const visible = useMemo(() => leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    return (filter === "all" || lead.status === filter) && (!q || [lead.business_name, lead.category, lead.city].join(" ").toLowerCase().includes(q));
  }), [leads, search, filter]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ leads: Lead[]; whatsappConfigured: boolean }>("/api/admin/outreach");
      setLeads(data.leads);
      setWhatsappConfigured(data.whatsappConfigured);
      setSelectedId((current) => current && data.leads.some((lead) => lead.id === current) ? current : data.leads[0]?.id ?? null);
      setMessage("");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal memuat prospek.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status); setDraft(selected.draft_message); setNotes(selected.notes ?? "");
    setWhatsappNumber(selected.whatsapp_number ?? "");
    setOptInAt(selected.opt_in_at ? new Date(selected.opt_in_at).toISOString().slice(0, 16) : "");
    setOptInSource(selected.opt_in_source ?? "");
  }, [selected]);

  async function save() {
    if (!selected) return;
    setBusy(true); setMessage("");
    try {
      const data = await apiPatch<{ lead: Lead }>(`/api/admin/outreach/${selected.id}`, {
        status, draftMessage: draft, notes,
        whatsappNumber: whatsappNumber || null,
        optInAt: optInAt ? new Date(optInAt).toISOString() : null,
        optInSource: optInSource || null,
      });
      setLeads((all) => all.map((lead) => lead.id === selected.id ? data.lead : lead));
      setMessage("Perubahan tersimpan.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menyimpan.")); }
    finally { setBusy(false); }
  }
  async function send() {
    if (!selected || !window.confirm(`Kirim template WhatsApp resmi ke ${selected.business_name}?`)) return;
    setBusy(true); setMessage("");
    try {
      const data = await apiPost<{ lead: Lead }>(`/api/admin/outreach/${selected.id}/send`);
      setLeads((all) => all.map((lead) => lead.id === selected.id ? data.lead : lead));
      setMessage("Template diterima WhatsApp Cloud API.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Pengiriman gagal.")); await load(); }
    finally { setBusy(false); }
  }
  async function create() {
    setBusy(true); setMessage("");
    try {
      const data = await apiPost<{ lead: Lead }>("/api/admin/outreach", { ...newLead, checkedAt: new Date().toISOString().slice(0, 10) });
      await load(); setSelectedId(data.lead.id); setCreating(false); setNewLead(blank);
      setMessage("Prospek ditambahkan.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menambah prospek.")); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-naki-primary">Client Outreach</h1><p className="mt-1 text-sm text-naki-smoke">Riset prospek, tinjau peluang, dan kelola percakapan.</p></div>
      <div className="flex gap-2"><button className="rounded-xl border border-naki-steel bg-white px-4 py-2 text-sm font-semibold text-naki-primary" onClick={() => void load()} type="button">Muat ulang</button><button className="rounded-xl bg-naki-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => setCreating((value) => !value)} type="button">{creating ? "Tutup formulir" : "Tambah manual"}</button></div>
    </header>
    <div className="space-y-2 rounded-xl border border-naki-steel bg-naki-frost p-3 text-sm text-naki-primary"><p>Pencarian prospek, observasi, draf pesan personal, dan sinkronisasi ke sini dijadwalkan otomatis setiap hari kerja pukul 09.00 WIB. Formulir tambah manual hanya untuk kandidat tambahan.</p><p>Untuk kontak yang sudah menyetujui komunikasi, gunakan Buka WhatsApp untuk membuka draf pesan, lalu tekan Kirim di WhatsApp. Pilih status Ditinjau untuk alur manual. Status Siap kirim (opt-in) mengantrekan pengiriman melalui Cloud API.</p><p>{whatsappConfigured ? "Kredensial Cloud API terisi; aktivasi nomor dan persetujuan template tetap perlu diperiksa di Meta." : "Cloud API belum dikonfigurasi. Buka WhatsApp tetap tersedia untuk kontak yang sudah memberi persetujuan."}</p></div>
    {message && <p aria-live="polite" className="rounded-xl border border-naki-steel bg-white p-3 text-sm text-naki-primary">{message}</p>}
    {creating && <form className="grid gap-3 rounded-2xl border border-naki-steel bg-white p-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void create(); }}>
      {([ ["businessName", "Nama bisnis"], ["externalKey", "ID unik (domain/handle)"], ["category", "Kategori"], ["city", "Kota"], ["sourceUrl", "URL profil bisnis"], ["evidenceUrl", "URL bukti kebutuhan"], ["contactUrl", "URL kontak bisnis"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary" key={key}>{label}<input className={`${inputClass} mt-1`} required={!["category", "city"].includes(key)} type={key.endsWith("Url") ? "url" : "text"} value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      {([ ["observation", "Observasi faktual"], ["opportunity", "Peluang yang diusulkan"], ["draftMessage", "Draf pesan"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary sm:col-span-2" key={key}>{label}<textarea className={`${inputClass} mt-1 min-h-20`} required value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      <label className="text-xs font-semibold text-naki-primary">Skor 0–5<input className={`${inputClass} mt-1`} max={5} min={0} type="number" value={newLead.score} onChange={(event) => setNewLead((current) => ({ ...current, score: Number(event.target.value) }))} /></label>
      <div className="self-end"><button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">Simpan prospek</button></div>
    </form>}
    <div className="grid gap-4 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-naki-steel bg-white p-3" aria-label="Daftar prospek">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><input aria-label="Cari prospek" className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Cari bisnis, kota, kategori" value={search} /><select aria-label="Filter status" className={inputClass} onChange={(event) => setFilter(event.target.value)} value={filter}><option value="all">Semua</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="mt-3 max-h-[65vh] space-y-1 overflow-y-auto">{loading ? <p className="p-4 text-sm text-naki-smoke">Memuat prospek...</p> : visible.length === 0 ? <p className="p-4 text-sm text-naki-smoke">Belum ada prospek yang cocok dengan filter.</p> : visible.map((lead) => <button aria-pressed={selectedId === lead.id} className={`w-full rounded-xl p-3 text-left transition ${selectedId === lead.id ? "bg-naki-frost text-naki-primary" : "text-naki-primary hover:bg-naki-frost/60"}`} key={lead.id} onClick={() => setSelectedId(lead.id)} type="button"><span className="block font-semibold">{lead.business_name}</span><span className="mt-1 block text-xs text-naki-smoke">{lead.city || "Kota belum dicatat"} · {statuses.find((item) => item.value === lead.status)?.label} · Skor {lead.score}/5</span></button>)}</div>
      </section>
      <section className="min-w-0 rounded-2xl border border-naki-steel bg-white p-4 sm:p-5" aria-label="Detail prospek">{!selected ? <p className="text-sm text-naki-smoke">Pilih prospek untuk melihat detailnya.</p> : <div className="space-y-5">
        <div><h2 className="text-xl font-bold text-naki-primary">{selected.business_name}</h2><p className="text-sm text-naki-smoke">{selected.category} · {selected.city} · Skor {selected.score}/5</p></div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-naki-secondary">{([ [selected.source_url, "Sumber"], [selected.evidence_url, "Bukti"], [selected.contact_url, "Kontak bisnis"] ] as const).map(([href, label]) => <a href={href} key={label} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{label}</a>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Observasi</h3><p className="mt-1 text-sm text-naki-primary">{selected.observation}</p></div><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Peluang</h3><p className="mt-1 text-sm text-naki-primary">{selected.opportunity}</p></div></div>
        <label className="block text-sm font-semibold text-naki-primary">Status<select className={`${inputClass} mt-1`} disabled={selected.status === "do_not_contact"} onChange={(event) => setStatus(event.target.value as LeadStatus)} value={status}>{statuses.filter((item) => item.value !== "sending").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block text-sm font-semibold text-naki-primary">Draf pesan<textarea className={`${inputClass} mt-1 min-h-28`} onChange={(event) => setDraft(event.target.value)} value={draft} /></label>
        <label className="block text-sm font-semibold text-naki-primary">Catatan<textarea className={`${inputClass} mt-1 min-h-20`} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <fieldset className="grid gap-3 border-t border-naki-steel pt-4 sm:grid-cols-2"><legend className="text-sm font-bold text-naki-primary">Persetujuan WhatsApp</legend><p className="text-xs text-naki-smoke sm:col-span-2">Isi hanya jika penerima memberikan nomor dan setuju menerima pesan dari NAKI melalui WhatsApp. Simpan URL sumber persetujuannya.</p><label className="text-sm font-semibold text-naki-primary">Nomor WhatsApp<input className={`${inputClass} mt-1`} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="628..." value={whatsappNumber} /></label><label className="text-sm font-semibold text-naki-primary">Waktu persetujuan<input className={`${inputClass} mt-1`} onChange={(event) => setOptInAt(event.target.value)} type="datetime-local" value={optInAt} /></label><label className="text-sm font-semibold text-naki-primary sm:col-span-2">URL bukti persetujuan<input className={`${inputClass} mt-1`} onChange={(event) => setOptInSource(event.target.value)} placeholder="https://..." type="url" value={optInSource} /></label></fieldset>
        {selected.last_error && <p className="text-sm text-red-700">Pengiriman terakhir gagal: {selected.last_error}</p>}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => void save()} type="button">Simpan perubahan</button>
            {manualHref ? <a className="inline-flex min-h-11 items-center rounded-xl border border-naki-secondary px-5 text-sm font-semibold text-naki-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary" href={manualHref} target="_blank" rel="noopener noreferrer" onClick={() => setMessage("Draf dibuka di WhatsApp. Tekan Kirim di WhatsApp untuk mengirim pesan. Status prospek belum berubah.")}>Buka WhatsApp</a> : <button className="min-h-11 rounded-xl border border-naki-steel px-5 text-sm font-semibold text-naki-smoke opacity-50" disabled aria-describedby="manual-whatsapp-help" type="button">Buka WhatsApp</button>}
            <button className="min-h-11 rounded-xl border border-naki-secondary px-5 text-sm font-semibold text-naki-secondary disabled:opacity-50" disabled={busy || !whatsappConfigured || selected.status !== "ready" || status !== "ready"} onClick={() => void send()} type="button">Kirim template WhatsApp</button>
          </div>
          <p id="manual-whatsapp-help" className="text-xs text-naki-smoke">{manualReason || "Buka WhatsApp memakai draf di atas. Pembukaan draf tidak menandai pesan sebagai terkirim; catat hasil percakapan setelah mengirim."}</p>
        </div>
      </div>}</section>
    </div>
  </div>;
}
