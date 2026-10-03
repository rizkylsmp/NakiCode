import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost, getApiErrorMessage } from "../../services/api-client";
import { getOutreachMapPoints } from "../../utils/outreach-map";
import { getOutreachNiche, matchRegisteredNiche } from "../../utils/outreach-niche";
const OutreachLeafletMap = lazy(() => import("./OutreachLeafletMap"));

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
  { value: "sent", label: "Dihubungi" }, { value: "replied", label: "Membalas" },
  { value: "qualified", label: "Layak" }, { value: "won", label: "Deal" },
  { value: "lost", label: "Tidak lanjut" },
  { value: "do_not_contact", label: "Jangan hubungi" },
];
const inputClass = "min-h-11 w-full rounded-xl border border-naki-steel bg-white px-3 py-2 text-sm text-naki-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary";

export function AdminOutreachSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [niches, setNiches] = useState<Array<{ name: string }>>([]);
  const [nicheRegistryFailed, setNicheRegistryFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState<LeadForm>(blank);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const nicheOptions = useMemo(() => {
    const choices = new Map<string, string>();
    for (const niche of niches) {
      const inferred = getOutreachNiche(niche.name);
      if (inferred) choices.set(inferred, matchRegisteredNiche(inferred, niches) ?? inferred);
    }
    for (const lead of leads) {
      const inferred = getOutreachNiche(lead.category);
      if (inferred) choices.set(inferred, matchRegisteredNiche(inferred, niches) ?? inferred);
    }
    return [...choices].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [leads, niches]);
  const visible = useMemo(() => leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    const inferred = getOutreachNiche(lead.category);
    return (filter === "all" || lead.status === filter) && (nicheFilter === "all" || (inferred ?? "unclassified") === nicheFilter) && (!q || [lead.business_name, lead.category, lead.city, inferred, matchRegisteredNiche(inferred, niches)].join(" ").toLowerCase().includes(q));
  }), [leads, search, filter, niches, nicheFilter]);
  const selected = visible.find((lead) => lead.id === selectedId) ?? null;
  function nicheLabel(lead: Lead) {
    const inferred = getOutreachNiche(lead.category);
    const registered = matchRegisteredNiche(inferred, niches);
    return <span className="mt-2 inline-flex max-w-full rounded-lg border border-naki-steel bg-naki-frost px-2 py-1 text-xs font-semibold text-naki-primary"><span>{registered ? "Niche:" : inferred ? "Usulan niche:" : "Niche:"}</span>&nbsp;<span data-no-translate>{registered ?? inferred ?? "Belum diklasifikasikan"}</span></span>;
  }
  const mapPoints = useMemo(() => getOutreachMapPoints(visible), [visible]);
  const selectLead = useCallback((id: number) => {
    if (busy) return;
    setSelectedId(id);
    setSelectionVersion((version) => version + 1);
  }, [busy]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ leads: Lead[] }>("/api/admin/outreach");
      setLeads(data.leads);
      setSelectedId((current) => current && data.leads.some((lead) => lead.id === current) ? current : data.leads[0]?.id ?? null);
      setMessage("");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal memuat prospek.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    let active = true;
    void apiGet<{ niches: Array<{ name: string }> }>("/api/categories/niches")
      .then(data => { if (active) setNiches(data.niches ?? []); })
      .catch(() => { if (active) setNicheRegistryFailed(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selected) return;
    setStatus(["ready", "sending", "failed"].includes(selected.status) ? "reviewed" : selected.status); setDraft(selected.draft_message); setNotes(selected.notes ?? "");
    setWhatsappNumber(selected.whatsapp_number ?? "");
  }, [selected]);

  async function save() {
    if (!selected) return;
    setBusy(true); setMessage("");
    try {
      const data = await apiPatch<{ lead: Lead }>(`/api/admin/outreach/${selected.id}`, {
        status, draftMessage: draft, notes,
        whatsappNumber: whatsappNumber.trim() || null,
      });
      setLeads((all) => all.map((lead) => lead.id === selected.id ? data.lead : lead));
      setMessage("Perubahan tersimpan.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menyimpan.")); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || !window.confirm(`Hapus ${selected.business_name} dari daftar prospek?`)) return;
    const id = selected.id;
    setBusy(true); setMessage("");
    try {
      await apiDelete(`/api/admin/outreach/${id}`);
      setLeads((all) => all.filter((lead) => lead.id !== id));
      setSelectedId(leads.find((lead) => lead.id !== id)?.id ?? null);
      setMessage("Prospek dihapus dari daftar.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menghapus prospek.")); }
    finally { setBusy(false); }
  }
  async function create() {
    setBusy(true); setMessage("");
    try {
      const data = await apiPost<{ lead: Lead | null }>("/api/admin/outreach", { ...newLead, checkedAt: new Date().toISOString().slice(0, 10) });
      if (!data.lead) { setMessage("Prospek sudah pernah dihapus."); return; }
      await load(); setSelectedId(data.lead.id); setCreating(false); setNewLead(blank);
      setMessage("Prospek ditambahkan.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menambah prospek.")); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-naki-primary">Client Outreach</h1><p className="mt-1 text-sm text-naki-smoke">Riset prospek, tinjau peluang, dan siapkan draf pesan.</p></div>
      <div className="flex gap-2"><button className="rounded-xl border border-naki-steel bg-white px-4 py-2 text-sm font-semibold text-naki-primary" disabled={busy || loading} onClick={() => void load()} type="button">Muat ulang</button><button className="rounded-xl bg-naki-primary px-4 py-2 text-sm font-semibold text-white" disabled={busy} onClick={() => setCreating((value) => !value)} type="button">{creating ? "Tutup formulir" : "Tambah manual"}</button></div>
    </header>
    {message && <p aria-live="polite" className="rounded-xl border border-naki-steel bg-white p-3 text-sm text-naki-primary">{message}</p>}
    {creating && <form className="grid gap-3 rounded-2xl border border-naki-steel bg-white p-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void create(); }}>
      {([ ["businessName", "Nama bisnis"], ["externalKey", "ID unik (domain/handle)"], ["category", "Kategori"], ["city", "Kota"], ["sourceUrl", "URL profil bisnis"], ["evidenceUrl", "URL bukti kebutuhan"], ["contactUrl", "URL kontak bisnis"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary" key={key}>{label}<input className={`${inputClass} mt-1`} required={!["category", "city"].includes(key)} type={key.endsWith("Url") ? "url" : "text"} value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      {([ ["observation", "Observasi faktual"], ["opportunity", "Peluang yang diusulkan"], ["draftMessage", "Draf pesan"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary sm:col-span-2" key={key}>{label}<textarea className={`${inputClass} mt-1 min-h-20`} required value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      <label className="text-xs font-semibold text-naki-primary">Skor 0–5<input className={`${inputClass} mt-1`} max={5} min={0} type="number" value={newLead.score} onChange={(event) => setNewLead((current) => ({ ...current, score: Number(event.target.value) }))} /></label>
      <div className="self-end"><button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">Simpan prospek</button></div>
    </form>}
    <div className="grid gap-4 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
      <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-naki-steel bg-white p-3 lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)] lg:self-start" aria-label="Daftar prospek">
        <label className="mb-2 grid gap-1 text-xs font-semibold text-naki-primary">Niche<select aria-label="Filter niche" className={inputClass} value={nicheFilter} onChange={event => setNicheFilter(event.target.value)}><option value="all">Semua niche</option>{nicheOptions.map(([value, label]) => <option key={value} value={value} data-no-translate>{label}</option>)}<option value="unclassified">Belum diklasifikasikan</option></select></label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><input aria-label="Cari prospek" className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Cari bisnis, kota, kategori" value={search} /><select aria-label="Filter status" className={inputClass} onChange={(event) => setFilter(event.target.value)} value={filter}><option value="all">Semua</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div aria-label="Daftar prospek yang dapat digulir" tabIndex={0} className="mt-3 min-h-0 max-h-[65dvh] flex-1 space-y-1 overflow-y-auto overscroll-contain pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary lg:max-h-none">{loading ? <p className="p-4 text-sm text-naki-smoke">Memuat prospek...</p> : visible.length === 0 ? <p className="p-4 text-sm text-naki-smoke">Belum ada prospek yang cocok dengan filter.</p> : visible.map((lead) => <button aria-pressed={selectedId === lead.id} className={`w-full rounded-xl p-3 text-left transition ${selectedId === lead.id ? "bg-naki-frost text-naki-primary" : "text-naki-primary hover:bg-naki-frost/60"}`} key={lead.id} disabled={busy} onClick={() => selectLead(lead.id)} type="button"><span className="block font-semibold">{lead.business_name}</span><span className="mt-1 block text-xs text-naki-smoke">{lead.city || "Kota belum dicatat"} · {statuses.find((item) => item.value === lead.status)?.label ?? "Ditinjau"} · Skor {lead.score}/5</span>{nicheLabel(lead)}</button>)}</div>
      </section>
      <div className="min-w-0 space-y-4">
        <section aria-label="Peta prospek" className="min-w-0 rounded-2xl border border-naki-steel bg-white p-3 sm:p-4">
          <h2 className="mb-2 text-lg font-semibold text-naki-primary">Peta prospek</h2>
          {loading ? <p role="status" className="py-6 text-sm text-naki-smoke">Memuat lokasi prospek...</p> : mapPoints.length ? <Suspense fallback={<p role="status" className="py-6 text-sm text-naki-smoke">Memuat peta...</p>}><OutreachLeafletMap points={mapPoints} selectedId={selectedId} selectionVersion={selectionVersion} onSelect={selectLead} /></Suspense> : <p className="py-6 text-sm text-naki-smoke">Belum ada lokasi dengan koordinat Google Maps pada prospek yang ditampilkan.</p>}
          {!loading && <p className="mt-3 text-xs text-naki-smoke"><span data-no-translate>{mapPoints.length} / {visible.length}</span> <span>prospek ditampilkan di peta. Pilih prospek atau marker untuk melihat lokasi dan detailnya.</span></p>}
        </section>
      <section className="min-w-0 rounded-2xl border border-naki-steel bg-white p-4 sm:p-5" aria-label="Detail prospek">{!selected ? <p className="text-sm text-naki-smoke">Pilih prospek untuk melihat detailnya.</p> : <div className="space-y-5">
        <div><h2 className="text-xl font-bold text-naki-primary">{selected.business_name}</h2><p className="text-sm text-naki-smoke">{selected.category} · {selected.city} · Skor {selected.score}/5</p>{nicheLabel(selected)}<p className="mt-2 text-xs text-naki-smoke">Label otomatis berdasarkan kategori usaha hasil riset. Usulan niche dapat ditambahkan melalui Admin → Kategori.</p>{nicheRegistryFailed && <p role="status" className="mt-1 text-xs text-naki-smoke">Daftar niche belum dapat dimuat; label sementara ditampilkan sebagai usulan.</p>}</div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-naki-secondary">{([ [selected.source_url, "Sumber"], [selected.evidence_url, "Bukti"], [selected.contact_url, "Kontak bisnis"] ] as const).map(([href, label]) => <a href={href} key={label} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{label}</a>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Observasi</h3><p className="mt-1 text-sm text-naki-primary">{selected.observation}</p></div><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Peluang</h3><p className="mt-1 text-sm text-naki-primary">{selected.opportunity}</p></div></div>
        <label className="block text-sm font-semibold text-naki-primary">Status<select className={`${inputClass} mt-1`} disabled={selected.status === "do_not_contact"} onChange={(event) => setStatus(event.target.value as LeadStatus)} value={status}>{statuses.filter((item) => item.value !== "sending").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block text-sm font-semibold text-naki-primary">Draf pesan<textarea className={`${inputClass} mt-1 min-h-28`} onChange={(event) => setDraft(event.target.value)} value={draft} /></label>
        <label className="block text-sm font-semibold text-naki-primary">Catatan<textarea className={`${inputClass} mt-1 min-h-20`} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <label className="block text-sm font-semibold text-naki-primary">Nomor WhatsApp<input className={`${inputClass} mt-1`} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="628..." type="tel" value={whatsappNumber} /></label>
        <div className="flex flex-wrap gap-2">
          <button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || loading} onClick={() => void save()} type="button">Simpan perubahan</button>
          <button className="min-h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={busy || loading} onClick={() => void remove()} type="button">Hapus prospek</button>
        </div>
      </div>}</section>
      </div>
    </div>
  </div>;
}
