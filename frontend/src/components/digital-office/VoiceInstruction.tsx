import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string };
          };
        };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function VoiceInstruction({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const ref = useRef<Recognition | null>(null);
  const currentValue = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    currentValue.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);
  useEffect(
    () => () => {
      if (ref.current) {
        ref.current.onend = null;
        ref.current.onerror = null;
        ref.current.onresult = null;
        ref.current.abort();
      }
    },
    [],
  );
  useEffect(() => {
    if (disabled) ref.current?.stop();
  }, [disabled]);
  const Constructor =
    (window as SpeechWindow).SpeechRecognition ||
    (window as SpeechWindow).webkitSpeechRecognition;
  function toggle() {
    if (listening) {
      ref.current?.stop();
      return;
    }
    if (!Constructor) return;
    const recognition = new Constructor();
    ref.current = recognition;
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        if (event.results[i].isFinal)
          text += `${event.results[i][0].transcript} `;
      const next = `${currentValue.current.trim()} ${text.trim()}`
        .trim()
        .slice(0, 3000);
      currentValue.current = next;
      onChangeRef.current(next);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setMessage(
        event.error === "not-allowed"
          ? "Izin mikrofon ditolak. Izinkan mikrofon di browser atau ketik instruksi."
          : "Suara belum tertangkap. Coba kembali atau ketik instruksi.",
      );
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
      setMessage("Mendengarkan. Tinjau teks sebelum membagikan tugas.");
    } catch {
      setMessage("Mikrofon belum dapat dimulai. Coba kembali.");
    }
  }
  return (
    <div className="office-voice">
      <button
        type="button"
        disabled={disabled || !Constructor || !window.isSecureContext}
        aria-pressed={listening}
        onClick={toggle}
      >
        {listening ? (
          <Square size={16} aria-hidden />
        ) : (
          <Mic size={16} aria-hidden />
        )}
        {listening ? "Hentikan mikrofon" : "Gunakan mikrofon"}
      </button>
      <small role="status">
        {!Constructor
          ? "Voice belum didukung browser ini. Gunakan Chrome atau Edge, atau ketik instruksi."
          : !window.isSecureContext
            ? "Mikrofon memerlukan HTTPS atau localhost."
            : message ||
              "Pengenalan suara browser dapat memakai layanan online. Instruksi tetap Anda tinjau sebelum dikirim."}
      </small>
    </div>
  );
}
