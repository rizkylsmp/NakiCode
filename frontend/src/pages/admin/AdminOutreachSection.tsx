import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost, getApiErrorMessage } from "../../services/api-client";
import { getOutreachMapPoints } from "../../utils/outreach-map";
import { getOutreachNiche, matchRegisteredNiche } from "../../utils/outreach-niche";
import { OutreachDialog } from "./OutreachDialog";
import { WhatsAppBrandIcon } from "../../components/ui/BrandIcons";
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, MapPin, ContactRound, RefreshCw, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
type SortKey = "business" | "niche" | "status" | "whatsapp" | "city" | "score";
type TextViewer = { title: string; text: string };
const blank: LeadForm = { externalKey: "", businessName: "", category: "", city: "", sourceUrl: "", evidenceUrl: "", contactUrl: "", observation: "", opportunity: "", score: 0, draftMessage: "", notes: "" };
const statuses: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "Baru" }, { value: "reviewed", label: "Ditinjau" },
  { value: "sent", label: "Dihubungi" }, { value: "replied", label: "Membalas" },
  { value: "qualified", label: "Layak" }, { value: "won", label: "Deal" },
  { value: "lost", label: "Tidak lanjut" },
  { value: "do_not_contact", label: "Jangan hubungi" },
];
const statusBadges: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: "Baru", color: "bg-blue-100 text-blue-900 border-blue-300" },
  reviewed: { label: "Ditinjau", color: "bg-amber-100 text-amber-900 border-amber-300" },
  ready: { label: "Siap", color: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  sending: { label: "Dalam proses", color: "bg-orange-100 text-orange-900 border-orange-300" },
  sent: { label: "Dihubungi", color: "bg-violet-100 text-violet-900 border-violet-300" },
  replied: { label: "Membalas", color: "bg-cyan-100 text-cyan-900 border-cyan-300" },
  qualified: { label: "Layak", color: "bg-teal-100 text-teal-900 border-teal-300" },
  won: { label: "Deal", color: "bg-green-100 text-green-900 border-green-300" },
  lost: { label: "Tidak lanjut", color: "bg-slate-100 text-slate-900 border-slate-300" },
  failed: { label: "Gagal", color: "bg-red-100 text-red-900 border-red-300" },
  do_not_contact: { label: "Jangan hubungi", color: "bg-rose-100 text-rose-900 border-rose-300" },
};
function StatusBadge({ status }: { status: LeadStatus }) {
  const badge = statusBadges[status];
  return <span className={`naki-outreach-status inline-flex max-w-full items-center rounded-lg border px-2 py-1 text-xs font-semibold ${badge.color}`}>{badge.label}</span>;
}
function prospectWhatsAppUrl(number: string | null, message: string) {
  const normalized = (number ?? "").trim().replace(/[\s().-]/g, "").replace(/^\+/, "").replace(/^0/, "62");
  return /^[1-9]\d{7,14}$/.test(normalized) ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : undefined;
}
const inputClass = "min-h-11 w-full rounded-xl border border-naki-steel bg-white px-3 py-2 text-sm text-naki-primary";

export function AdminOutreachSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [niches, setNiches] = useState<Array<{ name: string }>>([]);
  const [nicheRegistryFailed, setNicheRegistryFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const tableRef = useRef<HTMLTableElement>(null);
  const [rowHeight, setRowHeight] = useState<number>();
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState<TextViewer | null>(null);
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
  const filtered = useMemo(() => leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    const inferred = getOutreachNiche(lead.category);
    return (filter === "all" || lead.status === filter) && (nicheFilter === "all" || (inferred ?? "unclassified") === nicheFilter) && (!q || [lead.business_name, lead.category, lead.city, inferred, matchRegisteredNiche(inferred, niches)].join(" ").toLowerCase().includes(q));
  }), [leads, search, filter, niches, nicheFilter]);
  const visible = useMemo(() => {
    if (!sort) return filtered;
    const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });
    const value = (lead: Lead): string | number => {
      switch (sort.key) {
        case "business": return lead.business_name;
        case "niche": { const inferred = getOutreachNiche(lead.category); return matchRegisteredNiche(inferred, niches) ?? inferred ?? ""; }
        case "status": return statusBadges[lead.status].label;
        case "whatsapp": return lead.whatsapp_number ?? "";
        case "city": return lead.city;
        case "score": return lead.score;
      }
    };
    return [...filtered].sort((a, b) => {
      const left = value(a), right = value(b);
      if (left === "" || right === "") return left === right ? 0 : left === "" ? 1 : -1;
      const compared = typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left), String(right));
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [filtered, sort, niches]);
  function sortHeader(label: string, key: SortKey) {
    const active = sort?.key === key;
    const Icon = active ? sort.direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
    return <th className="whitespace-nowrap px-3 py-3 font-semibold" scope="col" aria-sort={active ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><button type="button" aria-label={`Urutkan ${label}`} title={`Urutkan ${label}`} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-naki-primary" disabled={busy || loading} onClick={() => { setSort(current => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" })); setPage(1); }}>{label}<Icon size={14} aria-hidden="true" /></button></th>;
  }
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const paginatedVisible = useMemo(() => visible.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, visible]);
  useLayoutEffect(() => {
    const contents = Array.from(tableRef.current?.querySelectorAll<HTMLElement>("tbody [data-outreach-row-content]") ?? []);
    if (!contents.length) return;
    const measure = () => {
      const height = Math.ceil(Math.max(...contents.map(content => {
        const cell = content.parentElement!;
        const style = getComputedStyle(cell);
        return content.getBoundingClientRect().height + (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + 1;
      })));
      setRowHeight(current => current === height ? current : height);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    contents.forEach(content => observer.observe(content));
    return () => observer.disconnect();
  }, [paginatedVisible, loading]);
  const selected = visible.find((lead) => lead.id === selectedId) ?? null;
  function nicheLabel(lead: Lead) {
    const inferred = getOutreachNiche(lead.category);
    const registered = matchRegisteredNiche(inferred, niches);
    return <span className="mt-2 inline-flex max-w-full rounded-lg border border-naki-steel bg-naki-frost px-2 py-1 text-xs font-semibold text-naki-primary"><span data-no-translate>{registered ?? inferred ?? "Belum diklasifikasikan"}</span></span>;
  }
  const mapPoints = useMemo(() => getOutreachMapPoints(visible), [visible]);
  const selectLead = useCallback((id: number) => {
    if (busy) return;
    setSelectedId(id);
    const selectedIndex = visible.findIndex((lead) => lead.id === id);
    if (selectedIndex >= 0) setPage(Math.floor(selectedIndex / pageSize) + 1);
    setSelectionVersion((version) => version + 1);
  }, [busy, pageSize, visible]);

  async function load() {
    setLoading(true);
    setPage(1);
    try {
      const data = await apiGet<{ leads: Lead[] }>("/api/admin/outreach");
      setLeads(data.leads);
      setSelectedId((current) => current && data.leads.some((lead) => lead.id === current) ? current : data.leads[0]?.id ?? null);
      setMessage("");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal memuat prospek.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [search, filter, nicheFilter]);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
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
      setEditing(false);
      setMessage("Perubahan tersimpan.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal menyimpan.")); }
    finally { setBusy(false); }
  }
  async function updateStatus(lead: Lead, nextStatus: LeadStatus) {
    if (busy || lead.status === nextStatus) return;
    setBusy(true); setMessage("");
    try {
      const data = await apiPatch<{ lead: Lead }>(`/api/admin/outreach/${lead.id}`, { status: nextStatus });
      setLeads((all) => all.map((item) => item.id === lead.id ? data.lead : item));
      setMessage("Status diperbarui.");
    } catch (error) { setMessage(getApiErrorMessage(error, "Gagal memperbarui status.")); }
    finally { setBusy(false); }
  }
  async function remove(lead: Lead) {
    if (!window.confirm(`Hapus ${lead.business_name} dari daftar prospek?`)) return;
    const id = lead.id;
    setBusy(true); setMessage("");
    try {
      await apiDelete(`/api/admin/outreach/${id}`);
      setLeads((all) => all.filter((lead) => lead.id !== id));
      setSelectedId(leads.find((lead) => lead.id !== id)?.id ?? null);
      setEditing(false);
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

  const viewClass = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-naki-steel p-0 text-xs font-semibold sm:h-8 sm:w-8 text-naki-secondary hover:bg-naki-frost disabled:opacity-50";
  function textCell(lead: Lead, title: string, text: string) {
    return <button className={viewClass} aria-label={`Lihat ${title.toLowerCase()} ${lead.business_name}`} title={`Lihat ${title.toLowerCase()}`} disabled={!text} onClick={() => setViewer({ title: `${title} — ${lead.business_name}`, text })} type="button"><Eye size={16} aria-hidden="true" /></button>;
  }
  return <div className="naki-outreach min-w-0 space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-naki-primary">Client Outreach</h1><p className="mt-1 text-sm text-naki-smoke">Riset prospek, tinjau peluang, dan siapkan draf pesan.</p></div>
      <div className="flex gap-2"><button aria-label="Muat ulang" title="Muat ulang" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-naki-steel bg-white text-naki-primary disabled:opacity-50" disabled={busy || loading} onClick={() => void load()} type="button"><RefreshCw size={18} aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} /></button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-naki-primary px-4 py-2 text-sm font-semibold text-white" disabled={busy} onClick={() => setCreating(true)} type="button"><Plus size={18} aria-hidden="true" />Tambah manual</button></div>
    </header>
    {message && <p aria-live="polite" className="rounded-xl border border-naki-steel bg-white p-3 text-sm text-naki-primary">{message}</p>}
    {creating && <OutreachDialog title="Tambah prospek" busy={busy} onClose={() => setCreating(false)}><form className="grid gap-3 rounded-2xl border border-naki-steel bg-white p-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void create(); }}>
      {([ ["businessName", "Nama bisnis"], ["externalKey", "ID unik (domain/handle)"], ["category", "Kategori"], ["city", "Kota"], ["sourceUrl", "URL profil bisnis"], ["evidenceUrl", "URL bukti kebutuhan"], ["contactUrl", "URL kontak bisnis"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary" key={key}>{label}<input className={`${inputClass} mt-1`} required={!["category", "city"].includes(key)} type={key.endsWith("Url") ? "url" : "text"} value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      {([ ["observation", "Observasi faktual"], ["opportunity", "Peluang yang diusulkan"], ["draftMessage", "Draf pesan"], ["notes", "Catatan"] ] as const).map(([key, label]) => <label className="text-xs font-semibold text-naki-primary sm:col-span-2" key={key}>{label}<textarea className={`${inputClass} mt-1 min-h-20`} required={key !== "notes"} value={newLead[key]} onChange={(event) => setNewLead((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      <label className="text-xs font-semibold text-naki-primary">Skor 0–5<input className={`${inputClass} mt-1`} max={5} min={0} type="number" value={newLead.score} onChange={(event) => setNewLead((current) => ({ ...current, score: Number(event.target.value) }))} /></label>
      <div className="self-end"><button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">Simpan prospek</button></div>
      {message && <p role="status" className="text-sm text-naki-primary sm:col-span-2">{message}</p>}
    </form></OutreachDialog>}
    <div className="min-w-0 space-y-4">
      <section aria-label="Peta prospek" className="min-w-0 rounded-2xl border border-naki-steel bg-white p-3 sm:p-4">
        <h2 className="mb-2 text-lg font-semibold text-naki-primary">Peta prospek</h2>
        {loading ? <p role="status" className="py-6 text-sm text-naki-smoke">Memuat lokasi prospek...</p> : mapPoints.length ? <Suspense fallback={<p role="status" className="py-6 text-sm text-naki-smoke">Memuat peta...</p>}><OutreachLeafletMap points={mapPoints} selectedId={selectedId} selectionVersion={selectionVersion} onSelect={selectLead} /></Suspense> : <p className="py-6 text-sm text-naki-smoke">Belum ada lokasi dengan koordinat Google Maps pada prospek yang ditampilkan.</p>}
        {!loading && <p className="mt-3 text-xs text-naki-smoke"><span data-no-translate>{mapPoints.length} / {visible.length}</span> <span>prospek ditampilkan di peta. Pilih prospek atau marker untuk melihat lokasi dan detailnya.</span></p>}
      </section>
      <section aria-label="Daftar prospek" className="min-w-0 rounded-2xl border border-naki-steel bg-white p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold text-naki-primary">Daftar prospek</h2><p className="text-xs text-naki-smoke"><span data-no-translate>{visible.length}</span> prospek cocok dengan filter</p></div><p className="text-xs font-semibold text-naki-smoke"><span data-no-translate>{loading || visible.length === 0 ? 0 : page}</span> / <span data-no-translate>{loading || visible.length === 0 ? 0 : pageCount}</span></p></div>
      <div aria-label="Filter prospek" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] sm:items-end">
          <label className="grid gap-1 text-xs font-semibold text-naki-primary">Niche<select aria-label="Filter niche" className={inputClass} value={nicheFilter} onChange={event => setNicheFilter(event.target.value)}><option value="all">Semua niche</option>{nicheOptions.map(([value, label]) => <option key={value} value={value} data-no-translate>{label}</option>)}<option value="unclassified">Belum diklasifikasikan</option></select></label>
          <label className="grid gap-1 text-xs font-semibold text-naki-primary">Cari prospek<input aria-label="Cari prospek" className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Cari bisnis, kota, kategori" value={search} /></label>
          <label className="grid gap-1 text-xs font-semibold text-naki-primary">Status<select aria-label="Filter status" className={inputClass} onChange={(event) => setFilter(event.target.value)} value={filter}><option value="all">Semua status</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>
      </div>

        {loading ? <p role="status" className="p-4 text-sm text-naki-smoke">Memuat prospek...</p> : visible.length === 0 ? <p className="p-4 text-sm text-naki-smoke">Belum ada prospek yang cocok dengan filter.</p> : <div aria-label="Tabel prospek, geser horizontal untuk melihat semua kolom" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-naki-steel"><table ref={tableRef} className="w-full min-w-[101rem] table-fixed border-collapse text-left text-sm"><caption className="sr-only">Daftar prospek client outreach</caption><colgroup>{[15, 10, 10, 12, 7, 7, 6, 7, 15, 5, 7].map((width, index) => <col key={index} style={{ width: `${width}rem` }} />)}</colgroup><thead className="bg-naki-frost text-xs uppercase tracking-wide text-naki-smoke"><tr>{sortHeader("Bisnis", "business")}{sortHeader("Niche", "niche")}{sortHeader("Status", "status")}{sortHeader("WhatsApp", "whatsapp")}<th className="whitespace-nowrap px-3 py-3 text-center font-semibold" scope="col">Draf pesan</th><th className="whitespace-nowrap px-3 py-3 text-center font-semibold" scope="col">Informasi</th><th className="whitespace-nowrap px-3 py-3 text-center font-semibold" scope="col">Catatan</th><th className="whitespace-nowrap px-3 py-3 font-semibold" scope="col">Tautan</th>{sortHeader("Kota", "city")}{sortHeader("Skor", "score")}<th className="sticky right-0 z-20 bg-naki-frost whitespace-nowrap px-3 py-3 font-semibold shadow-[-4px_0_8px_-4px_rgb(15_23_42_/_0.2)]" scope="col">Aksi</th></tr></thead><tbody>{paginatedVisible.map((lead) => <tr style={{ height: rowHeight }} aria-selected={selectedId === lead.id} onClick={event => { if (!(event.target as HTMLElement).closest("button, select, a, input, textarea")) selectLead(lead.id); }} className={`cursor-pointer border-t border-naki-steel hover:bg-naki-frost ${selectedId === lead.id ? "bg-naki-frost" : ""}`} key={lead.id}><td className="px-3 py-2 align-middle"><div data-outreach-row-content className="flow-root"><button aria-pressed={selectedId === lead.id} className="text-left font-semibold text-naki-primary underline-offset-2 hover:underline" disabled={busy} onClick={() => selectLead(lead.id)} type="button">{lead.business_name}</button><p className="mt-1 max-w-sm text-xs text-naki-smoke">{lead.category || "Kategori belum dicatat"}</p></div></td><td className="px-3 py-2 align-middle"><div data-outreach-row-content className="flow-root">{nicheLabel(lead)}</div></td><td className="px-3 py-2 align-middle"><div data-outreach-row-content className="flow-root"><select aria-label={`Status ${lead.business_name}`} className={`naki-outreach-status min-h-9 w-full max-w-44 rounded-lg border px-2 py-1 text-xs font-semibold ${statusBadges[lead.status].color}`} disabled={busy || loading || lead.status === "do_not_contact"} value={lead.status} onChange={event => void updateStatus(lead, event.target.value as LeadStatus)}>{!statuses.some(item => item.value === lead.status) && <option value={lead.status}>{statusBadges[lead.status].label}</option>}{statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></td><td className="px-3 py-2 align-middle text-xs text-naki-primary" data-no-translate><div data-outreach-row-content className="flow-root">{prospectWhatsAppUrl(lead.whatsapp_number, lead.draft_message) ? <a aria-label={`Chat WhatsApp ${lead.business_name}`} title="Buka chat WhatsApp dengan draf pesan" href={prospectWhatsAppUrl(lead.whatsapp_number, lead.draft_message)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-naki-secondary underline underline-offset-2"><WhatsAppBrandIcon className="size-4 shrink-0" />{lead.whatsapp_number}</a> : lead.whatsapp_number || "—"}</div></td><td className="px-3 py-2 text-center align-middle"><div data-outreach-row-content className="flow-root">{textCell(lead, "Draf pesan", lead.draft_message)}</div></td><td className="px-3 py-2 text-center align-middle"><div data-outreach-row-content className="flow-root"><button className={viewClass} aria-label={`Lihat observasi dan peluang ${lead.business_name}`} onClick={() => setViewer({title: `Observasi dan peluang — ${lead.business_name}`, text: `Observasi\n${lead.observation}\n\nPeluang\n${lead.opportunity}`})} type="button"><Eye size={16} aria-hidden="true" /></button></div></td><td className="px-3 py-2 text-center align-middle"><div data-outreach-row-content className="flow-root">{textCell(lead, "Catatan", lead.notes || "")}</div></td><td className="px-3 py-2 align-middle"><div data-outreach-row-content className="flow-root"><div className="flex gap-2">{([{ url: lead.source_url, label: "Sumber", Icon: MapPin }, { url: lead.contact_url, label: "Kontak bisnis", Icon: ContactRound }]).map(({ url, label, Icon }) => <a key={label} href={url} aria-label={`${label} ${lead.business_name}`} title={label} rel="noopener noreferrer" target="_blank" className={viewClass}><Icon size={16} aria-hidden="true" /></a>)}</div></div></td><td className="px-3 py-2 align-middle text-naki-primary"><div data-outreach-row-content className="flow-root">{lead.city || "Kota belum dicatat"}</div></td><td className="px-3 py-2 align-middle text-naki-primary"><div data-outreach-row-content className="flow-root">{lead.score}/5</div></td><td className={`sticky right-0 z-10 px-3 py-2 align-middle shadow-[-4px_0_8px_-4px_rgb(15_23_42_/_0.2)] ${selectedId === lead.id ? "bg-naki-frost" : "bg-white"}`}><div data-outreach-row-content className="flow-root"><div className="flex gap-2"><button type="button" aria-label={`Edit ${lead.business_name}`} className={viewClass} disabled={busy || loading} onClick={() => { selectLead(lead.id); setDraft(lead.draft_message); setNotes(lead.notes ?? ""); setWhatsappNumber(lead.whatsapp_number ?? ""); setStatus(["ready", "sending", "failed"].includes(lead.status) ? "reviewed" : lead.status); setMessage(""); setEditing(true); }} title="Edit prospek"><Pencil size={15} aria-hidden="true" /></button><button type="button" aria-label={`Hapus ${lead.business_name}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 p-0 text-red-700 disabled:opacity-50 sm:h-8 sm:w-8" disabled={busy || loading} onClick={() => void remove(lead)} title="Hapus prospek"><Trash2 size={15} aria-hidden="true" /></button></div></div></td></tr>)}</tbody></table></div>}
        {!loading && visible.length > 0 && <nav aria-label="Pagination prospek" className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-naki-smoke">Menampilkan <span data-no-translate>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)}</span> dari <span data-no-translate>{visible.length}</span></p><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs text-naki-smoke">Data per halaman<select aria-label="Data per halaman" className="h-8 rounded-lg border border-naki-steel bg-white px-2 py-0 text-xs text-naki-primary" disabled={busy} value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}</select></label><div className="flex shrink-0 items-center gap-2"><button aria-label="Halaman sebelumnya" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-naki-steel bg-white text-naki-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={page === 1 || busy} onClick={() => setPage((current) => Math.max(1, current - 1))} title="Halaman sebelumnya" type="button"><ChevronLeft size={16} aria-hidden="true" /></button><span aria-label="Halaman saat ini" aria-live="polite" className="min-w-12 text-center text-xs font-semibold tabular-nums text-naki-primary" data-no-translate>{page} / {pageCount}</span><button aria-label="Halaman berikutnya" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-naki-steel bg-white text-naki-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={page >= pageCount || busy} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} title="Halaman berikutnya" type="button"><ChevronRight size={16} aria-hidden="true" /></button></div></div></nav>}
      </section>
      {editing && selected && <OutreachDialog title={`Edit ${selected.business_name}`} busy={busy} onClose={() => setEditing(false)}><section className="min-w-0 rounded-2xl border border-naki-steel bg-white p-4 sm:p-5" aria-label="Detail prospek">{!selected ? <p className="text-sm text-naki-smoke">Pilih prospek untuk melihat detailnya.</p> : <div className="space-y-5">
        <div><h2 className="text-xl font-bold text-naki-primary">{selected.business_name}</h2><p className="text-sm text-naki-smoke">{selected.category} · {selected.city} · Skor {selected.score}/5</p><div className="mt-2"><StatusBadge status={selected.status} /></div>{nicheLabel(selected)}<p className="mt-2 text-xs text-naki-smoke">Label otomatis berdasarkan kategori usaha hasil riset. Usulan niche dapat ditambahkan melalui Admin → Kategori.</p>{nicheRegistryFailed && <p role="status" className="mt-1 text-xs text-naki-smoke">Daftar niche belum dapat dimuat; label sementara ditampilkan sebagai usulan.</p>}</div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-naki-secondary">{([ [selected.source_url, "Sumber"], [selected.evidence_url, "Bukti"], [selected.contact_url, "Kontak bisnis"] ] as const).map(([href, label]) => <a href={href} key={label} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{label}</a>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Observasi</h3><p className="mt-1 text-sm text-naki-primary">{selected.observation}</p></div><div><h3 className="text-xs font-semibold uppercase text-naki-smoke">Peluang</h3><p className="mt-1 text-sm text-naki-primary">{selected.opportunity}</p></div></div>
        <label className="block text-sm font-semibold text-naki-primary">Status<select className={`${inputClass} mt-1`} disabled={selected.status === "do_not_contact"} onChange={(event) => setStatus(event.target.value as LeadStatus)} value={status}>{statuses.filter((item) => item.value !== "sending").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block text-sm font-semibold text-naki-primary">Draf pesan<textarea className={`${inputClass} mt-1 min-h-28`} onChange={(event) => setDraft(event.target.value)} value={draft} /></label>
        <label className="block text-sm font-semibold text-naki-primary">Catatan<textarea className={`${inputClass} mt-1 min-h-20`} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <label className="block text-sm font-semibold text-naki-primary">Nomor WhatsApp<input className={`${inputClass} mt-1`} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="628..." type="tel" value={whatsappNumber} /></label>
        <div className="flex flex-wrap gap-2">
          <button className="min-h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || loading} onClick={() => void save()} type="button">Simpan perubahan</button>
          <button className="min-h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={busy || loading} onClick={() => void remove(selected)} type="button">Hapus prospek</button>
        </div>
      {message && <p role="status" className="text-sm text-naki-primary">{message}</p>}
      </div>}</section></OutreachDialog>}
    </div>
    {viewer && <OutreachDialog title={viewer.title} onClose={() => setViewer(null)}><p className="whitespace-pre-wrap break-words text-sm leading-6 text-naki-primary" data-no-translate>{viewer.text}</p></OutreachDialog>}
  </div>;
}
