/** @jsxImportSource react */
import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3, Quaternion, MOUSE, TOUCH } from "three";
import {
  Html,
  OrbitControls,
  OrthographicCamera,
  RoundedBox,
} from "@react-three/drei";
import type { OfficeMission } from "../../domain/digital-office";

export type StationId =
  | "ceo"
  | "manager"
  | "strategy"
  | "research"
  | "creative"
  | "operations";
const stations: {
  id: StationId;
  label: string;
  position: [number, number, number];
  color: string;
}[] = [
  {
    id: "ceo",
    label: "CEO Office",
    position: [-3, 3.4, -2.5],
    color: "#b68142",
  },
  {
    id: "manager",
    label: "AI Manager",
    position: [0.5, 3.4, -2.5],
    color: "#496588",
  },
  {
    id: "strategy",
    label: "Strategy Agent",
    position: [-3, 0, 0],
    color: "#496588",
  },
  {
    id: "research",
    label: "Research Agent",
    position: [0.5, 0, 0],
    color: "#4a8070",
  },
  {
    id: "creative",
    label: "Creative Agent",
    position: [-3, 0, 2.5],
    color: "#a2768c",
  },
  {
    id: "operations",
    label: "Operations Agent",
    position: [0.5, 0, 2.5],
    color: "#697b92",
  },
];
function Box({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function Avatar({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#dbbd9d" />
      </mesh>
      <mesh position={[0, 0.93, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.38, 4, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Box
        position={[-0.13, 0.34, 0]}
        size={[0.15, 0.6, 0.18]}
        color="#324254"
      />
      <Box
        position={[0.13, 0.34, 0]}
        size={[0.15, 0.6, 0.18]}
        color="#324254"
      />
      <Box position={[-0.3, 0.86, 0]} size={[0.12, 0.47, 0.15]} color={color} />
      <Box position={[0.3, 0.86, 0]} size={[0.12, 0.47, 0.15]} color={color} />
    </group>
  );
}
function Rail({
  from,
  to,
  radius = 0.035,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
}) {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const direction = b.clone().sub(a);
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh
      position={a.add(b).multiplyScalar(0.5)}
      quaternion={rotation}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, direction.length(), 8]} />
      <meshStandardMaterial color="#60788b" metalness={0.35} roughness={0.5} />
    </mesh>
  );
}
function Staircase() {
  return (
    <group>
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          position={[
            5.65,
            ((12 - i) * 3.24) / 12 - 0.07,
            -1.35 + (i * 3.5) / 11,
          ]}
          size={[1.5, 0.14, 0.36]}
          color="#c0b29e"
        />
      ))}
      {[5.03, 6.27].map((x) => (
        <group key={x}>
          <Rail from={[x, 0.05, 2.35]} to={[x, 3.07, -1.5]} radius={0.065} />
          <Rail from={[x, 1.32, 2.15]} to={[x, 4.29, -1.35]} />
          {[0, 3, 6, 9, 11].map((i) => (
            <Rail
              key={i}
              from={[x, ((12 - i) * 3.24) / 12, -1.35 + (i * 3.5) / 11]}
              to={[x, ((12 - i) * 3.24) / 12 + 1.05, -1.35 + (i * 3.5) / 11]}
              radius={0.025}
            />
          ))}
        </group>
      ))}
      <Box
        position={[5.65, 3.16, -1.835]}
        size={[1.5, 0.16, 0.63]}
        color="#dce3e8"
      />
    </group>
  );
}
function ManagerAvatar({ mission }: { mission: OfficeMission | null }) {
  const ref = useRef<Group>(null);
  const route = useRef<Vector3[]>([]);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const activeAgent =
    mission?.tasks.find((task) => task.status === "running")?.agentId ||
    mission?.tasks.find((task) => task.status !== "done")?.agentId;
  const status = mission?.status;
  useEffect(() => {
    const manager = ref.current;
    if (!manager) return;
    const start = new Vector3(0.5, 3.4, -1.35);
    const approach = new Vector3(4.5, 3.4, -1.85);
    const landing = new Vector3(5.65, 3.24, -1.835);
    const upper = new Vector3(5.65, 3.24, -1.35);
    const lower = new Vector3(5.65, 0.27, 2.15);
    const ground = new Vector3(5.65, 0, 2.55);
    const station = stations.find((item) => item.id === activeAgent);
    const working = status === "queued" || status === "running";
    const target =
      working && station
        ? new Vector3(station.position[0] + 1.45, 0, station.position[2] + 0.65)
        : start;
    if (reducedMotion) {
      manager.position.copy(target);
      route.current = [];
      invalidate();
      return;
    }
    if (working)
      route.current =
        manager.position.y > 1
          ? [
              approach,
              landing,
              upper,
              lower,
              ground,
              new Vector3(3, 0, 2.55),
              target,
            ]
          : [new Vector3(3, 0, manager.position.z), target];
    else
      route.current =
        manager.position.y < 1
          ? [
              new Vector3(3, 0, manager.position.z),
              ground,
              lower,
              upper,
              landing,
              approach,
              start,
            ]
          : [start];
    invalidate();
  }, [activeAgent, status, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    const manager = ref.current;
    const next = route.current[0];
    if (!manager || !next) return;
    const direction = next.clone().sub(manager.position);
    const distance = direction.length();
    if (distance < 0.08) {
      manager.position.copy(next);
      route.current.shift();
    } else {
      manager.rotation.y = Math.atan2(direction.x, direction.z);
      manager.position.addScaledVector(
        direction.normalize(),
        Math.min(distance, delta * 2.4),
      );
    }
    if (route.current.length) invalidate();
  });
  return (
    <group ref={ref} position={[0.5, 3.4, -1.35]}>
      <Avatar color="#496588" />
      <Html position={[0, 1.85, 0]} center zIndexRange={[18, 0]}>
        <span className="office-avatar-label">Manager</span>
      </Html>
    </group>
  );
}
function Station({
  station,
  selected,
  status,
  onOpen,
}: {
  station: (typeof stations)[number];
  selected: boolean;
  status?: string;
  onOpen: (id: StationId) => void;
}) {
  const activeColor =
    status === "running"
      ? "#e5a93c"
      : status === "done"
        ? "#55a88e"
        : station.color;
  return (
    <group position={station.position}>
      <RoundedBox
        args={[2.35, 0.18, 1.3]}
        radius={0.07}
        position={[0, 1, 0]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onOpen(station.id);
        }}
      >
        <meshStandardMaterial
          color={selected ? "#e7b76b" : "#c6aa89"}
          roughness={0.6}
        />
      </RoundedBox>
      {[-0.94, 0.94].flatMap((x) =>
        [-0.43, 0.43].map((z) => (
          <Box
            key={`${x}-${z}`}
            position={[x, 0.5, z]}
            size={[0.09, 1, 0.09]}
            color="#455162"
          />
        )),
      )}
      <Box
        position={[0, 1.18, -0.3]}
        size={[0.13, 0.35, 0.13]}
        color="#334255"
      />
      <RoundedBox
        args={[1.1, 0.67, 0.1]}
        radius={0.035}
        position={[0, 1.65, -0.32]}
        castShadow
      >
        <meshStandardMaterial color="#263347" />
      </RoundedBox>
      <Box
        position={[0, 1.65, -0.255]}
        size={[0.98, 0.55, 0.015]}
        color={activeColor}
      />
      <Box
        position={[0, 1.105, 0.28]}
        size={[0.7, 0.035, 0.25]}
        color="#e7e9ec"
      />
      <RoundedBox
        args={[0.8, 0.17, 0.75]}
        radius={0.1}
        position={[0, 0.65, 1]}
        castShadow
      >
        <meshStandardMaterial color={station.color} />
      </RoundedBox>
      <RoundedBox
        args={[0.8, 0.95, 0.12]}
        radius={0.07}
        position={[0, 1.05, 1.34]}
        castShadow
      >
        <meshStandardMaterial color={station.color} />
      </RoundedBox>
      <Box position={[0, 0.3, 1]} size={[0.12, 0.6, 0.12]} color="#536070" />
      {station.id !== "manager" && (
        <group position={[0, 0.08, 1]} scale={0.75}>
          <Avatar color={station.color} />
        </group>
      )}
      <Html position={[0, 2.15, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          className={`office-station-label ${selected ? "selected" : ""}`}
          aria-label={`Buka ${station.label}`}
          aria-pressed={selected}
          onClick={() => onOpen(station.id)}
        >
          <strong>{station.label}</strong>
          <small>
            {status === "running"
              ? "Mengerjakan"
              : status === "done"
                ? "Selesai"
                : "Buka ruang kerja"}
          </small>
        </button>
      </Html>
    </group>
  );
}
function Fallback({ onOpen }: { onOpen: (id: StationId) => void }) {
  return (
    <div className="office-scene-fallback">
      <p>
        Tampilan 3D tidak tersedia pada perangkat ini. Semua ruang kerja tetap
        dapat dibuka.
      </p>
      {stations.map((station) => (
        <button key={station.id} onClick={() => onOpen(station.id)}>
          {station.label}
        </button>
      ))}
    </div>
  );
}
function Camera({
  flat,
  pan,
  reset,
}: {
  flat: boolean;
  pan: boolean;
  reset: number;
}) {
  const size = useThree((state) => state.size);
  const zoom = Math.max(9, Math.min(size.width / 20, size.height / 14, 58));
  return (
    <>
      <OrthographicCamera
        key={`${flat ? "flat" : "3d"}-${reset}`}
        makeDefault
        position={flat ? [0, 20, 0.01] : [14, 16, 19]}
        zoom={zoom}
        near={0.1}
        far={100}
      />
      <OrbitControls
        key={`${flat ? "flat-controls" : "3d-controls"}-${reset}`}
        makeDefault
        enablePan
        screenSpacePanning
        mouseButtons={{
          LEFT: pan || flat ? MOUSE.PAN : MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
        touches={{
          ONE: pan || flat ? TOUCH.PAN : TOUCH.ROTATE,
          TWO: TOUCH.DOLLY_PAN,
        }}
        enableRotate={!flat}
        minZoom={zoom * 0.7}
        maxZoom={zoom * 2}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.6}
        target={[0, 1.7, 0]}
      />
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function OfficeScene({
  panel,
  mission,
  dark,
  flat,
  pan,
  reset,
  onOpen,
}: {
  panel: string | null;
  mission: OfficeMission | null;
  dark: boolean;
  flat: boolean;
  pan: boolean;
  reset: number;
  onOpen: (id: StationId) => void;
}) {
  const fallback = <Fallback onOpen={onOpen} />;
  return (
    <SceneBoundary fallback={fallback}>
      <Suspense
        fallback={<p className="office-scene-loading">Menyiapkan kantor 3D…</p>}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          frameloop="demand"
          fallback={fallback}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[dark ? "#172334" : "#eef1f5"]} />
          <Camera flat={flat} pan={pan} reset={reset} />
          <ambientLight intensity={1.1} />
          <directionalLight
            position={[4, 12, 8]}
            intensity={2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={9}
            shadow-camera-bottom={-9}
          />
          <Box
            position={[0, -0.12, 0]}
            size={[13.4, 0.25, 8.8]}
            color={dark ? "#2f4053" : "#cbd4dc"}
          />
          <Box
            position={[0, 3, -4.1]}
            size={[13.4, 6, 0.16]}
            color={dark ? "#405166" : "#d8e2e9"}
          />
          <Box
            position={[-6.6, 2.9, -2.2]}
            size={[0.16, 5.8, 4]}
            color={dark ? "#35475c" : "#e4e9ee"}
          />
          <Box
            position={[0, 5.5, -3.99]}
            size={[3.2, 0.85, 0.04]}
            color="#354c68"
          />
          <Html
            position={[0, 5.5, -3.95]}
            center
            className="office-wall-brand"
            zIndexRange={[2, 0]}
          >
            NAKI / DIGITAL OFFICE
          </Html>
          <Box
            position={[-0.9, 3.28, -2.5]}
            size={[11.6, 0.24, 3.2]}
            color={dark ? "#526279" : "#dce3e8"}
          />
          <Box
            position={[5.8, 3.28, -3.125]}
            size={[1.8, 0.24, 1.95]}
            color={dark ? "#526279" : "#dce3e8"}
          />
          <Box
            position={[6.55, 3.28, -1.525]}
            size={[0.3, 0.24, 1.25]}
            color={dark ? "#526279" : "#dce3e8"}
          />
          {[-4.8, -0.4, 3.9].map((x) => (
            <Box
              key={x}
              position={[x, 1.6, -3.6]}
              size={[0.15, 3.2, 0.15]}
              color="#65798e"
            />
          ))}
          <Staircase />
          <Box
            position={[-0.65, 4.35, -0.87]}
            size={[11.1, 0.06, 0.06]}
            color="#8195a7"
          />
          {[-6.15, -4.3, -2.5, -0.7, 1.1, 2.9, 4.9].map((x) => (
            <Box
              key={x}
              position={[x, 3.87, -0.87]}
              size={[0.055, 1, 0.055]}
              color="#8195a7"
            />
          ))}
          <Html position={[-4.9, 4.3, -1.4]} zIndexRange={[5, 0]}>
            <span className="office-floor-label">02 / CEO & Manager</span>
          </Html>
          <Html position={[-4.9, 0.5, 3.8]} zIndexRange={[5, 0]}>
            <span className="office-floor-label">01 / AI Agents</span>
          </Html>
          <ManagerAvatar mission={mission} />
          {stations.map((station) => (
            <Station
              key={station.id}
              station={station}
              selected={panel === station.id}
              status={
                mission?.tasks.find((task) => task.agentId === station.id)
                  ?.status
              }
              onOpen={onOpen}
            />
          ))}
        </Canvas>
      </Suspense>
    </SceneBoundary>
  );
}
