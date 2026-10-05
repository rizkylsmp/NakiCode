import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/auth-context";
import { apiGet } from "../services/api-client";
import { applyTheme, resolveInitialTheme } from "../utils/theme";
import {
  LayoutDashboard,
  Sun,
  Moon,
  BriefcaseBusiness,
  Network,
  FileText,
  History,
  X,
  Monitor,
  Layers,
  Download,
  Play,
  Plug,
  RefreshCw,
  Move,
  Rotate3d,
  RotateCcw,
} from "lucide-react";
import { VoiceInstruction } from "../components/digital-office/VoiceInstruction";
import {
  loadOffice,
  createMission,
  actOnMission,
  pairWorker,
  disconnectWorker,
  type OfficeWorker,
} from "../services/digital-office";
import {
  officeAgents,
  type OfficeAgentId,
  type OfficeMission,
} from "../domain/digital-office";
import "./digital-office.css";
const OfficeScene = lazy(
  () => import("../components/digital-office/OfficeScene"),
);
const panelIcons = {
  ceo: BriefcaseBusiness,
  manager: Network,
  report: FileText,
  history: History,
};

type Panel = "ceo" | "manager" | "report" | "history" | OfficeAgentId;
const stateLabels = {
  queued: "Antrean",
  running: "Mengerjakan",
  done: "Selesai",
  planned: "Siap dijalankan",
  cancelled: "Dibatalkan",
  complete: "Siap ditinjau",
  reviewed: "Sudah ditinjau",
  failed: "Proses terhenti",
};
const panelTitles: Record<Panel, string> = {
  ceo: "CEO Office",
  manager: "AI Manager",
  report: "Laporan CEO",
  history: "Riwayat instruksi",
  strategy: "Strategy Agent",
  research: "Research Agent",
  creative: "Creative Agent",
  operations: "Operations Agent",
};

export function DigitalOfficePage() {
  const auth = useAuth();
  const [access, setAccess] = useState<
    "checking" | "allowed" | "denied" | "error"
  >("checking");
  const [accessAttempt, setAccessAttempt] = useState(0);
  const [panel, setPanel] = useState<Panel | null>("ceo");
  const [instruction, setInstruction] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [mission, setMission] = useState<OfficeMission | null>(null);
  const [history, setHistory] = useState<OfficeMission[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Klik meja CEO untuk memberi instruksi.",
  );
  const [flat, setFlat] = useState(false);
  const [pan, setPan] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [dark, setDark] = useState(() => resolveInitialTheme() === "dark");
  const [workers, setWorkers] = useState<OfficeWorker[]>([]);
  const [busy, setBusy] = useState(false);
  const [officeLoaded, setOfficeLoaded] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const missionRef = useRef<OfficeMission | null>(null);
  const running = mission?.status === "running" || mission?.status === "queued";

  useEffect(() => {
    let active = true;
    apiGet<{ user: { role?: string } }>("/api/auth/user/me")
      .then((data) => {
        if (active)
          setAccess(data.user.role === "admin" ? "allowed" : "denied");
      })
      .catch(() => {
        if (active) setAccess("error");
      });
    return () => {
      active = false;
    };
  }, [accessAttempt]);
  useEffect(() => {
    if (access !== "allowed") return;
    let active = true;
    let loading = false;
    async function poll() {
      if (loading) return;
      loading = true;
      try {
        const data = await loadOffice();
        if (!active) return;
        setWorkers(data.workers);
        setHistory(data.missions);
        setOfficeLoaded(true);
        setError((current) =>
          current ===
          "Antrean belum dapat dimuat. Periksa koneksi; kantor akan mencoba kembali."
            ? ""
            : current,
        );
        const current = missionRef.current;
        const next = current
          ? data.missions.find((item) => item.id === current.id)
          : data.missions[0];
        if (next) {
          missionRef.current = next;
          setMission(next);
          if (
            next.status === "complete" &&
            (current?.status === "running" || current?.status === "queued")
          ) {
            setPanel("report");
            setMessage("Hasil Codex selesai. Laporan kembali ke CEO Office.");
          } else if (next.status === "queued")
            setMessage(
              "Instruksi dalam antrean. Menunggu worker Codex di komputer.",
            );
          else if (next.status === "running")
            setMessage(
              "Codex mengerjakan instruksi. Hasil agent tersimpan bertahap.",
            );
        }
      } catch {
        if (active)
          setError(
            "Antrean belum dapat dimuat. Periksa koneksi; kantor akan mencoba kembali.",
          );
      } finally {
        loading = false;
      }
    }
    void poll();
    const timer = window.setInterval(() => void poll(), 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [access]);
  useEffect(() => {
    if (!panel) return;
    panelRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [panel]);

  function openPanel(next: Panel) {
    triggerRef.current = document.activeElement as HTMLElement;
    setPanel(next);
  }
  function closePanel() {
    setPanel(null);
    triggerRef.current?.focus();
  }
  function save(next: OfficeMission) {
    missionRef.current = next;
    setMission(next);
    setHistory((items) =>
      items.some((item) => item.id === next.id)
        ? items.map((item) => (item.id === next.id ? next : item))
        : [...items, next],
    );
  }
  async function plan(event: FormEvent) {
    event.preventDefault();
    if (running || busy) return;
    if (instruction.trim().length < 15) {
      setError("Tulis instruksi minimal 15 karakter.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { mission: next } = await createMission(instruction, priority);
      save(next);
      setMessage(
        next.tasks.length +
          " tugas dibagi. Hasil akan dikerjakan Codex setelah dijalankan.",
      );
      openPanel("manager");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Instruksi belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function action(kind: "run" | "cancel" | "review") {
    const current = missionRef.current;
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      const { mission: next } = await actOnMission(current.id, kind);
      save(next);
      setMessage(
        kind === "run"
          ? "Instruksi dalam antrean. Menunggu worker Codex di komputer."
          : kind === "cancel"
            ? "Proses dibatalkan. Hasil parsial tetap tersimpan."
            : "Laporan sudah ditinjau CEO.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Aksi belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { worker } = await pairWorker();
      const apiUrl = (import.meta.env.VITE_API_URL || window.location.origin)
        .replace(/\/+$/, "")
        .replace(/\/api(?:\/v1)?$/i, "");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify({ apiUrl, token: worker.token }, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "worker.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setWorkers((items) => [
        { id: worker.id, name: worker.name, online: false },
        ...items,
      ]);
      setMessage(
        "Konfigurasi worker diunduh. Ikuti panduan menghubungkan komputer.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Pairing belum tersedia.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!mission?.report) return;
    const url = URL.createObjectURL(
      new Blob([mission.report], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-ceo-${mission.id.slice(0, 8)}.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const selectedAgent = officeAgents.find((agent) => agent.id === panel);
  const selectedTask = mission?.tasks.find((task) => task.agentId === panel);

  return (
    <div className="digital-office">
      <Helmet>
        <title>Kantor Digital | NAKI CODE</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="office-toolbar">
        <div className="office-brand">
          <img src="/logo.png" alt="NAKI" className="naki-logo-image" />
          <div>
            <h1>Kantor Digital</h1>
            <span>CEO Office / {auth.username}</span>
          </div>
        </div>
        <nav aria-label="Navigasi kantor">
          <Link to="/admin/dashboard">
            <LayoutDashboard size={17} aria-hidden />
            Dashboard admin
          </Link>
          <button
            type="button"
            onClick={() => {
              applyTheme(dark ? "light" : "dark");
              setDark(!dark);
            }}
          >
            {dark ? (
              <Sun size={17} aria-hidden />
            ) : (
              <Moon size={17} aria-hidden />
            )}
            {dark ? "Mode terang" : "Mode gelap"}
          </button>
        </nav>
      </header>
      {access !== "allowed" ? (
        <main className="office-access">
          <h2>
            {access === "checking"
              ? "Memeriksa akses kantor…"
              : access === "denied"
                ? "Kantor hanya untuk admin"
                : "Akses belum dapat diperiksa"}
          </h2>
          <p>
            {access === "error"
              ? "Periksa koneksi lalu coba kembali. Instruksi belum dijalankan."
              : "Kantor Digital mengikuti sesi admin NAKI CODE."}
          </p>
          {access === "error" && (
            <button
              type="button"
              onClick={() => {
                setAccess("checking");
                setAccessAttempt((attempt) => attempt + 1);
              }}
            >
              Coba lagi
            </button>
          )}
          <Link to="/admin/dashboard">Kembali ke dashboard</Link>
        </main>
      ) : (
        <>
          <main className={`office-main ${panel ? "has-panel" : ""}`}>
            <section className="office-world" aria-label="Kantor digital 3D">
              <div className="office-world-heading">
                <div>
                  <strong>Ruang kerja NAKI</strong>
                  <p>CEO → Manager → Agents → Laporan</p>
                </div>
                <div className="office-scene-controls">
                  <button
                    type="button"
                    aria-pressed={flat}
                    onClick={() => setFlat(!flat)}
                  >
                    {flat ? (
                      <Monitor size={16} aria-hidden />
                    ) : (
                      <Layers size={16} aria-hidden />
                    )}
                    {flat ? "Tampilan 3D" : "Tampilan datar"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={pan}
                    onClick={() => setPan(!pan)}
                  >
                    {pan ? (
                      <Rotate3d size={16} aria-hidden />
                    ) : (
                      <Move size={16} aria-hidden />
                    )}
                    {pan ? "Putar kantor" : "Geser posisi"}
                  </button>
                  <button
                    type="button"
                    aria-label="Reset kamera"
                    title="Reset kamera"
                    onClick={() => setCameraReset((value) => value + 1)}
                  >
                    <RotateCcw size={16} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="office-scene office-webgl">
                <Suspense
                  fallback={
                    <p className="office-scene-loading">
                      Menyiapkan kantor 3D…
                    </p>
                  }
                >
                  <OfficeScene
                    panel={panel}
                    mission={mission}
                    dark={dark}
                    flat={flat}
                    pan={pan}
                    reset={cameraReset}
                    onOpen={openPanel}
                  />
                </Suspense>
              </div>
              <div className="office-world-note">
                <strong>Kantor 3D / Codex</strong>
                <p>
                  Pilih meja untuk membuka ruang kerja. Drag untuk memutar, drag
                  kanan untuk menggeser, scroll untuk zoom. Mobile: satu jari
                  memutar, dua jari menggeser atau zoom.
                </p>
              </div>
            </section>
            {panel && (
              <aside
                className="office-panel"
                aria-label={panelTitles[panel]}
                tabIndex={-1}
                ref={panelRef}
              >
                <div className="office-panel-heading">
                  <div>
                    <span>Ruang kerja</span>
                    <h2>{panelTitles[panel]}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="Tutup panel"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
                <div className="office-panel-body">
                  {panel === "ceo" && (
                    <>
                      <p>
                        Berikan arah. Manager akan membagi pekerjaan ke agent
                        yang sesuai.
                      </p>
                      <form onSubmit={plan}>
                        <label htmlFor="office-instruction">
                          Instruksi CEO
                        </label>
                        <textarea
                          id="office-instruction"
                          value={instruction}
                          onChange={(event) => {
                            setInstruction(event.target.value);
                            setError("");
                          }}
                          maxLength={3000}
                          rows={7}
                          placeholder="Susun rencana peluncuran website, riset pelanggan, dan arah konten promosi."
                          aria-describedby="office-instruction-help office-error"
                          disabled={running || busy}
                        />
                        <VoiceInstruction
                          value={instruction}
                          onChange={setInstruction}
                          disabled={running || busy}
                        />
                        <small id="office-instruction-help">
                          Minimum 15 karakter · {instruction.length} / 3.000
                        </small>
                        <label htmlFor="office-priority">Prioritas</label>
                        <select
                          id="office-priority"
                          value={priority}
                          onChange={(event) => setPriority(event.target.value)}
                          disabled={running || busy}
                        >
                          <option>Normal</option>
                          <option>Tinggi</option>
                          <option>Mendesak</option>
                        </select>
                        <button
                          type="submit"
                          className="office-primary"
                          disabled={running || busy}
                        >
                          <Network size={16} aria-hidden />
                          Bagikan tugas
                        </button>
                      </form>
                      <button
                        type="button"
                        disabled={running || busy}
                        onClick={() => {
                          setInstruction(
                            "Susun rencana peluncuran website NAKI, riset kebutuhan pelanggan, dan buat arah konten promosi.",
                          );
                          setError("");
                        }}
                      >
                        Isi contoh brief
                      </button>
                      <p className="office-fineprint">
                        Brief dan hasil tersimpan pada akun admin Anda. Voice
                        hanya mengisi teks; tinjau instruksi sebelum mengirim.
                      </p>
                    </>
                  )}
                  {panel === "manager" && (
                    <>
                      <section
                        className="office-worker-status"
                        aria-label="Koneksi Codex"
                      >
                        <strong>
                          <Plug size={16} aria-hidden />{" "}
                          {workers.some((worker) => worker.online)
                            ? "Codex terhubung"
                            : "Worker Codex offline"}
                        </strong>
                        <p>
                          Komputer harus menyala dan worker aktif untuk
                          mengerjakan antrean.
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void connect()}
                        >
                          <Download size={16} aria-hidden />
                          Hubungkan komputer
                        </button>
                        <a
                          href="/digital-office-worker-guide.md"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Panduan worker
                        </a>
                        {workers.map((worker) => (
                          <div key={worker.id}>
                            <small>
                              {worker.name} /{" "}
                              {worker.online ? "Online" : "Offline"}
                            </small>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setBusy(true);
                                void disconnectWorker(worker.id)
                                  .then(() =>
                                    setWorkers((items) =>
                                      items.filter(
                                        (item) => item.id !== worker.id,
                                      ),
                                    ),
                                  )
                                  .catch(() =>
                                    setError("Koneksi belum dapat dicabut."),
                                  )
                                  .finally(() => setBusy(false));
                              }}
                            >
                              Putuskan
                            </button>
                          </div>
                        ))}
                      </section>
                      {!officeLoaded && (
                        <p role="status">Memuat antrean kantor…</p>
                      )}
                      {mission?.error && (
                        <p className="office-error" role="alert">
                          {mission.error}
                        </p>
                      )}
                      {mission ? (
                        <>
                          <div className="office-mission">
                            <span>
                              {stateLabels[mission.status]} / {mission.priority}
                            </span>
                            <p data-no-translate>{mission.instruction}</p>
                          </div>
                          {mission.tasks.map((task) => (
                            <article className="office-task" key={task.agentId}>
                              <div>
                                <strong>
                                  {
                                    officeAgents.find(
                                      (agent) => agent.id === task.agentId,
                                    )?.name
                                  }
                                </strong>
                                <span>{stateLabels[task.status]}</span>
                              </div>
                              <p>{task.title}</p>
                              <button
                                type="button"
                                onClick={() => openPanel(task.agentId)}
                              >
                                Buka workstation
                              </button>
                            </article>
                          ))}
                          {!["complete", "reviewed"].includes(
                            mission.status,
                          ) && (
                            <button
                              type="button"
                              className="office-primary"
                              disabled={running || busy}
                              onClick={() => void action("run")}
                            >
                              <Play size={16} aria-hidden />
                              {mission.status === "cancelled" ||
                              mission.status === "failed"
                                ? "Lanjutkan agents"
                                : "Jalankan agents"}
                            </button>
                          )}
                          {running && (
                            <button
                              type="button"
                              onClick={() => void action("cancel")}
                              disabled={busy}
                            >
                              Batalkan proses
                            </button>
                          )}
                          {mission.report && (
                            <button
                              type="button"
                              className="office-primary"
                              onClick={() => openPanel("report")}
                            >
                              Buka laporan CEO
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="office-empty">
                          <h3>Belum ada pembagian tugas</h3>
                          <p>Mulai dari meja CEO untuk mengirim instruksi.</p>
                          <button
                            type="button"
                            onClick={() => openPanel("ceo")}
                          >
                            Buka CEO Office
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {selectedAgent && (
                    <>
                      <p>
                        {selectedAgent.role}. Codex menyiapkan hasil sesuai
                        brief dan perannya.
                      </p>
                      {selectedTask ? (
                        <article className="office-task">
                          <span>{stateLabels[selectedTask.status]}</span>
                          <h3>{selectedTask.title}</h3>
                          {selectedTask.steps.length ? (
                            <ul>
                              {selectedTask.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>
                              {selectedTask.status === "running"
                                ? "Draft sedang disiapkan…"
                                : "Draft muncul setelah manager menjalankan agent."}
                            </p>
                          )}
                        </article>
                      ) : (
                        <div className="office-empty">
                          <h3>Belum ditugaskan</h3>
                          <p>
                            Manager memilih agent berdasarkan kata kunci dalam
                            brief.
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => openPanel("manager")}
                      >
                        Kembali ke manager
                      </button>
                    </>
                  )}
                  {panel === "report" && (
                    <>
                      {mission?.report ? (
                        <>
                          <pre data-no-translate>{mission.report}</pre>
                          <button
                            type="button"
                            className="office-primary"
                            onClick={download}
                          >
                            <Download size={16} aria-hidden />
                            Unduh laporan .md
                          </button>
                          <button
                            type="button"
                            disabled={busy || mission.status === "reviewed"}
                            onClick={() => void action("review")}
                          >
                            Tandai sudah ditinjau
                          </button>
                          {mission.status === "reviewed" && (
                            <p>Draft sudah ditinjau CEO.</p>
                          )}
                        </>
                      ) : (
                        <div className="office-empty">
                          <h3>Belum ada laporan</h3>
                          <p>
                            Laporan dikumpulkan setelah seluruh agent selesai.
                          </p>
                          <button
                            type="button"
                            onClick={() => openPanel("manager")}
                          >
                            Lihat progres manager
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {panel === "history" && (
                    <>
                      <p>Instruksi dan hasil tersimpan pada akun admin Anda.</p>
                      {history.length ? (
                        history.map((item) => (
                          <button
                            type="button"
                            className="office-history-item"
                            key={item.id}
                            disabled={running || busy}
                            onClick={() => {
                              missionRef.current = item;
                              setMission(item);
                              setInstruction(item.instruction);
                              setPriority(item.priority);
                              setError("");
                              openPanel("manager");
                            }}
                          >
                            <strong data-no-translate>
                              {item.instruction}
                            </strong>
                            <small>
                              {stateLabels[item.status]} / {item.priority}
                            </small>
                          </button>
                        ))
                      ) : (
                        <div className="office-empty">
                          <h3>Belum ada instruksi</h3>
                          <p>Mulai satu brief dari CEO Office.</p>
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void loadOffice()
                            .then((data) => setHistory(data.missions))
                            .catch(() =>
                              setError("Riwayat belum dapat dimuat."),
                            );
                        }}
                      >
                        <RefreshCw size={16} aria-hidden />
                        Muat ulang riwayat
                      </button>
                    </>
                  )}
                  {error && (
                    <p className="office-error" id="office-error" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </aside>
            )}
          </main>
          <footer className="office-command-bar">
            <nav aria-label="Panel kantor">
              {(["ceo", "manager", "report", "history"] as Panel[]).map(
                (id) => {
                  const Icon = panelIcons[id as keyof typeof panelIcons];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openPanel(id)}
                      aria-pressed={panel === id}
                    >
                      <Icon size={19} aria-hidden />
                      {panelTitles[id]}
                    </button>
                  );
                },
              )}
            </nav>
            <p role="status" aria-live="polite">
              {message}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
