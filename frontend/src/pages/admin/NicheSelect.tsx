import { useEffect, useState } from "react";
import { apiGet } from "../../services/api-client";
export type Niche = { id: number; name: string; designCount: number };
export function NicheSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      const result = await apiGet<{ niches: Niche[] }>(
        "/api/categories/niches",
      );
      setNiches(result.niches ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="space-y-1.5">
      <label className="grid gap-1.5 text-sm font-medium text-naki-primary">
        Niche
        <select
          className="min-h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || loading || failed}
        >
          <option value="">
            {loading ? "Memuat niche..." : "Tanpa niche"}
          </option>
          {value && !niches.some((niche) => niche.name === value) && (
            <option value={value} data-no-translate>
              {value}
            </option>
          )}
          {niches.map((niche) => (
            <option value={niche.name} key={niche.id} data-no-translate>
              {niche.name}
            </option>
          ))}
        </select>
      </label>
      {failed ? (
        <p role="status" className="text-xs text-red-700">
          Gagal memuat niche.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="underline"
          >
            Coba lagi
          </button>
        </p>
      ) : (
        !loading &&
        !niches.length && (
          <p className="text-xs text-naki-smoke">
            Tambahkan niche melalui Admin → Kategori.
          </p>
        )
      )}
    </div>
  );
}
