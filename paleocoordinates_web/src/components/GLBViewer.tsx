import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { animated as a } from '@react-spring/three';  
import { animated as a3, useTransition, useSpring, config } from '@react-spring/web';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import './GLBViewer.css';

export type ParsedPoint = Record<string, any>;

interface GLBViewerProps {
  modelUrl: string;
  originalPoints?: ParsedPoint[];
  rotatedPoints?: ParsedPoint[] | null;
  selectedPeriod?: string | null;
  exportEnabled?: boolean;
}

const SCALE = 0.6;


function latLngToXYZ(lat: number, lng: number, radius = 1): [number, number, number] {
  // Invertimos la longitud para que los puntos queden en el lado correcto
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (-lng * Math.PI) / 180; // <--- invertimos la longitud
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);
  return [x, y, z];
}


// Pegar justo debajo de latLngToXYZ
function parseLatLngFromPoint(p: any): { lat: number; lng: number } {
  const rawLat = p.p_lat ?? p.pLat ?? p.lat ?? p.Lat ?? p.latitude ?? p.Latitude ?? '';
  const rawLng = p.p_lng ?? p.pLng ?? p.lng ?? p.Lng ?? p.longitude ?? p.Longitude ?? '';

  const lat = Number(String(rawLat).trim().replace(',', '.'));
  const lng = Number(String(rawLng).trim().replace(',', '.'));

  // Si no hay p_lat/p_lng y lat parece estar invertido (ej. > 180), intenta swap heurístico:
  if (!isNaN(lat) && !isNaN(lng)) {
    if (Math.abs(lat) > 180 && Math.abs(lng) <= 90) {
      // probablemente están invertidos lat<->lng
      return { lat: lng, lng: lat };
    }
  }

  return { lat: Number.isFinite(lat) ? lat : NaN, lng: Number.isFinite(lng) ? lng : NaN };
}


function PulsingHalo({
  position,
  scale = 1,
  visible = true,
  color = 'red',
}: {
  position: [number, number, number];
  scale?: number;
  visible?: boolean;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { opacity } = useSpring({
    opacity: visible ? 0.3 : 0,
    config: { tension: 80, friction: 20 },
  });

  useFrame(({ clock }) => {
    const baseScale = 0.03 + 0.01 * Math.sin(clock.getElapsedTime() * 4);
    if (meshRef.current) {
      meshRef.current.scale.set(baseScale * scale, baseScale * scale, baseScale * scale);
    }
  });

  return (
    <a.mesh position={position} ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <a.meshBasicMaterial color={color} transparent opacity={opacity} />
    </a.mesh>
  );
}

function AnimatedPoint({
  lat,
  lng,
  visible = true,
  color = 'red',
  size = 0.015 * SCALE,
  showHalo = true,
}: {
  lat: number;
  lng: number;
  visible?: boolean;
  color?: string;
  size?: number;
  showHalo?: boolean;
}) {
  const position = latLngToXYZ(lat, lng, SCALE * 1.01);

  const { scale, opacity } = useSpring({
    scale: visible ? 1 : 0.2,
    opacity: visible ? 1 : 0,
    config: { tension: 150, friction: 22 },
  });

  return (
    <>
      <a.mesh position={position} scale={scale.to((s) => [s * size, s * size, s * size])}>
        <sphereGeometry args={[1, 64, 64]} />
        <a.meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={opacity}
        />
      </a.mesh>
      {showHalo && <PulsingHalo position={position} scale={SCALE} visible={visible} color={color} />}
    </>
  );
}

// Pegar justo antes de: const GLBViewer: React.FC<GLBViewerProps> = ({
function SceneExporter({ onExport, selectedPeriod }: {
  onExport: (success: boolean, message: string) => void;
  selectedPeriod?: string | null;
}) {
  const { scene } = useThree();
  const hasExported = useRef(false);
  
  function getDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const fileName = `${selectedPeriod || 'map'}_${getDateStr()}.glb`;

  useEffect(() => {
    if (hasExported.current) return;
    hasExported.current = true;
    // ... resto de exportación igual que ahora ...
    const exporter = new GLTFExporter();
    const options = {
      binary: true,
      maxTextureSize: 4096,
      includeCustomExtensions: false,
    };
    exporter.parse(
      scene,
      result => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;

          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 100);
          if (onExport) onExport(true, 'Modelo 3D exportado exitosamente');
        } else {
          if (onExport) onExport(false, 'Exportación: tipo de resultado inesperado');
        }
      },
      err => {
        if (onExport) onExport(false, 'Error al exportar el modelo 3D');
      },
      options
    );
  }, [scene, onExport]);
  return null;
}



const GLBViewer: React.FC<GLBViewerProps> = ({
  modelUrl,
  originalPoints = [],
  rotatedPoints = null,
  selectedPeriod = null,
  exportEnabled = true
}) => {
  const [activeUrl, setActiveUrl] = useState(modelUrl);
  const [previousPoints, setPreviousPoints] = useState<ParsedPoint[]>([]);
  const [currentPoints, setCurrentPoints] = useState<ParsedPoint[]>([]);
  const [showCurrentPoints, setShowCurrentPoints] = useState(true);

  // controles
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [showHalo, setShowHalo] = useState(true);
  const [pointColor, setPointColor] = useState('#ff0000');
  const [pointSize, setPointSize] = useState(0.015 * SCALE);
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.3);

  // control de visibilidad del panel de ajustes
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Justo después de: const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    useGLTF.preload(modelUrl);
  }, [modelUrl]);

  const filterPoints = (pts: ParsedPoint[]) => {
    if (selectedPeriod && pts.every((p) => p.period)) {
      return pts.filter((p) => p.period === selectedPeriod);
    }
    return pts;
  };

  useEffect(() => {
    const newPoints = rotatedPoints && rotatedPoints.length > 0 ? rotatedPoints : originalPoints;

    if (modelUrl !== activeUrl) {
      setPreviousPoints(currentPoints);
      setShowCurrentPoints(false);

      setTimeout(() => {
        setActiveUrl(modelUrl);
        if (newPoints.length === 0) {
          setCurrentPoints([]);
          setPreviousPoints([]);
        } else {
          setCurrentPoints(filterPoints(newPoints));
        }
      }, 400);
    } else {
      if (newPoints.length === 0) {
        setCurrentPoints([]);
        setPreviousPoints([]);
      } else {
        setCurrentPoints(filterPoints(newPoints));
      }
    }
  }, [modelUrl, originalPoints, rotatedPoints, selectedPeriod]);

  useEffect(() => {
    if (modelUrl === activeUrl) {
      const timer = setTimeout(() => {
        setShowCurrentPoints(true);
        if (currentPoints.length === 0) {
          setPreviousPoints([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPoints, modelUrl, activeUrl]);

  const modelTransition = useTransition(activeUrl, {
    from: { opacity: 0, scale: 0.4, position: [0, -0.2, 0] },
    enter: { opacity: 1, scale: 1, position: [0, 0, 0] },
    leave: { opacity: 0, scale: 0.4, position: [0, 0.2, 0] },
    config: config.slow,
  });

  // Después de: const modelTransition = useTransition(...)

const handleExport3DModel = () => {
  setExporting(true);
  setExportMessage({ type: 'success', text: 'Preparando exportación...' });
};

const handleExportComplete = (success: boolean, message: string) => {
  setExportMessage({ type: success ? 'success' : 'error', text: message });
  setExporting(false);
  setTimeout(() => {
    setExportMessage(null);
  }, 3000);
};


const settingsRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
      setSettingsOpen(false);
    }
  }

  if (settingsOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [settingsOpen]);


const panelAnimation = useSpring({
  opacity: settingsOpen ? 1 : 0,
  transform: settingsOpen ? 'translateY(0%)' : 'translateY(20%)',
  config: { tension: 250, friction: 25 },
});

const settingsTransition = useTransition(settingsOpen, {
  from: { opacity: 0, transform: 'translateY(20%)' },
  enter: { opacity: 1, transform: 'translateY(0%)' },
  leave: { opacity: 0, transform: 'translateY(20%)' },
  config: { tension: 250, friction: 25 },
});


 return (
    <div className="glb-viewer-container relative" style={{ width: '100%', height: '100%' }}>
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 3], fov: 45 }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={45} />
          <ambientLight intensity={ambientLightIntensity} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <OrbitControls
            enableZoom={zoomEnabled}
            autoRotate={autoRotateEnabled}
            autoRotateSpeed={rotationSpeed}
            enablePan={false}
          />

          {modelTransition((style, url) => {
            const { scene } = useGLTF(url);
            return (
              <a.group
                key={url}
                scale={style.scale.to((s) => [s * SCALE, s * SCALE, s * SCALE])}
                position={style.position.to((x, y, z) => [x, y, z])}
              >
                <primitive object={scene} />
              </a.group>
            );
          })}

          {previousPoints.map((p, idx) => {
  const { lat, lng } = parseLatLngFromPoint(p);
  if (isNaN(lat) || isNaN(lng)) return null;
  return (
    <AnimatedPoint
      key={`prev-${idx}`}
      lat={lat}
      lng={lng}
      visible={false}
      color={pointColor}
      size={pointSize}
      showHalo={showHalo}
    />
  );
})}

{currentPoints.map((p, idx) => {
  const { lat, lng } = parseLatLngFromPoint(p);
  if (isNaN(lat) || isNaN(lng)) return null;
  return (
    <AnimatedPoint
      key={`curr-${idx}`}
      lat={lat}
      lng={lng}
      visible={showCurrentPoints}
      color={pointColor}
      size={pointSize}
      showHalo={showHalo}
    />
  );
})}
      {exportEnabled && exporting &&  (
     <SceneExporter onExport={handleExportComplete} selectedPeriod={selectedPeriod} />
  )}
        </Suspense>
      </Canvas>

{exportEnabled && (
<div className="absolute bottom-4 left-4 z-30">
  <button
    onClick={handleExport3DModel}
    aria-label="Export 3D model map"
    title="Download 3D model map (.glb)"
    className="p-2 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
      />
    </svg>
    <span className="text-sm font-medium">Export 3D model</span>
  </button>
</div>
)}

      <div className="map-caption" style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
        {selectedPeriod && <p>3D Map of the Earth during the {selectedPeriod} Period</p>}
      </div>

      {/* Settings button */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="relative inline-block">
         <button
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Toggle settings"
            className="p-1 text-white hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white rounded transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 settings-icon ${settingsOpen ? 'open' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.18a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

{settingsTransition((style, item) =>
  item ? (
<a3.div
  ref={settingsRef}
  style={{
    ...style,
    pointerEvents: item ? 'auto' : 'none',
    visibility: item ? 'visible' : 'hidden',
  }}
  className="
    absolute bottom-12 right-0 p-4 w-64
    rounded-xl border border-cyan-600
    bg-gradient-to-b from-cyan-900/80 via-slate-900/70 to-cyan-900/80
    backdrop-blur-lg
    text-white shadow-lg transition-all
  "
>
  <h3 className="text-lg font-semibold mb-4 text-cyan-200">Settings</h3>

  {/* Viewer settings */}
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-cyan-300 mb-2 uppercase tracking-wide">Viewer</h4>

    <div className="flex justify-between items-center mb-3">
      <label htmlFor="autoRotate" className="text-sm text-cyan-100">Auto Rotate</label>
      <input
        id="autoRotate"
        type="checkbox"
        checked={autoRotateEnabled}
        onChange={(e) => setAutoRotateEnabled(e.target.checked)}
        className="w-5 h-5 rounded-md border border-cyan-400 bg-white checked:bg-cyan-600 checked:border-cyan-600 transition-all cursor-pointer shadow"
      />
    </div>

    <div className="flex justify-between items-center mb-3">
      <label htmlFor="zoom" className="text-sm text-cyan-100">Zoom Enabled</label>
      <input
        id="zoom"
        type="checkbox"
        checked={zoomEnabled}
        onChange={(e) => setZoomEnabled(e.target.checked)}
        className="w-5 h-5 rounded-md border border-cyan-400 bg-white checked:bg-cyan-600 checked:border-cyan-600 transition-all cursor-pointer shadow"
      />
    </div>

    {autoRotateEnabled && (
      <div className="flex justify-between items-center mb-3">
        <label htmlFor="rotationSpeed" className="text-sm text-cyan-100">Rotation Speed</label>
        <input
          id="rotationSpeed"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={rotationSpeed}
          onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
          className="w-32 accent-cyan-600 cursor-pointer"
        />
      </div>
    )}

    <div className="flex justify-between items-center mb-1">
      <label htmlFor="ambientLight" className="text-sm text-cyan-100">Ambient Light</label>
      <input
        id="ambientLight"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={ambientLightIntensity}
        onChange={(e) => setAmbientLightIntensity(parseFloat(e.target.value))}
        className="w-32 accent-cyan-600 cursor-pointer"
      />
    </div>
  </div>

  {/* Points settings */}
  <div>
    <h4 className="text-sm font-semibold text-cyan-300 mb-2 uppercase tracking-wide">Points</h4>

    <div className="flex justify-between items-center mb-3">
      <label htmlFor="pointColor" className="text-sm text-cyan-100">Point Color</label>
      <div className="relative">
        <input
          type="color"
          id="pointColor"
          value={pointColor}
          onChange={(e) => setPointColor(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div
          className="w-6 h-6 rounded-full border border-cyan-300 shadow-inner"
          style={{ backgroundColor: pointColor }}
          title={pointColor}
        />
      </div>
    </div>

    <div className="flex justify-between items-center mb-3">
      <label htmlFor="pointSize" className="text-sm text-cyan-100">Point Size</label>
      <input
        id="pointSize"
        type="range"
        min="0.005"
        max="0.05"
        step="0.001"
        value={pointSize}
        onChange={(e) => setPointSize(parseFloat(e.target.value))}
        className="w-32 accent-cyan-600 cursor-pointer"
      />
    </div>

    <div className="flex justify-between items-center mb-3">
      <label htmlFor="showHalo" className="text-sm text-cyan-100">Show Halo</label>
      <input
        id="showHalo"
        type="checkbox"
        checked={showHalo}
        onChange={(e) => setShowHalo(e.target.checked)}
        className="w-5 h-5 rounded-md border border-cyan-400 bg-white checked:bg-cyan-600 checked:border-cyan-600 transition-all cursor-pointer shadow"
      />
    </div>
  </div>
</a3.div>

      ) : null
    )}
        </div>
      </div>
    </div>
  );
};

export default GLBViewer;