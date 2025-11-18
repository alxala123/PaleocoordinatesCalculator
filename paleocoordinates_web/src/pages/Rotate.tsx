import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion';
import { RotateCcw } from "lucide-react";
import GLBViewer from '../components/GLBViewer';
import { DataTable, Column } from '../components/DataTable';
import InstructionOverlay from '../components/InstructionsOverlay';
import Papa from 'papaparse';


export type ParsedPoint = Record<string, any>;

type Model = {
  label: string;
  value: string;
};

const MODELS: Model[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'MERDITH2021', value: 'MERDITH2021' },
  { label: 'TorsvikCocks2017', value: 'TorsvikCocks2017' },
  { label: 'MATTHEWS2016_pmag_ref', value: 'MATTHEWS2016_pmag_ref' },
  { label: 'GOLONKA', value: 'GOLONKA' },
  { label: 'PALEOMAP', value: 'PALEOMAP' },
];

type RotateResponse = any;

const Rotate: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalPoints, setOriginalPoints] = useState<ParsedPoint[]>([]);
  const [rotatedPoints, setRotatedPoints] = useState<ParsedPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('PaleoAtlas');
  const [modelUrl, setModelUrl] = useState<string>('/PaleoAtlas.glb');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [rotatedData, setRotatedData] = useState<any[]>([]);
  // Asegúrate de tener esto en tu componente
  const [fileLoaded, setFileLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [renderFinished, setRenderFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<RotateResponse[]>([]);
  const [points, setPoints] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const modelRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const selectFilRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const glbViewerRef = React.useRef<HTMLDivElement>(null);
  const [filteredPoints, setFilteredPoints] = useState<ParsedPoint[]>([]);
  const [availableCsvModels, setAvailableCsvModels] = useState<string[]>([]);  
  const [selectedCsvModel,  setSelectedCsvModel]  = useState<string>('');



const startProgressIncrement = (target: number) => {
  if (intervalRef.current) clearInterval(intervalRef.current);

  intervalRef.current = setInterval(() => {
    setProgress(prev => {
      if (prev >= target) {
        clearInterval(intervalRef.current!);
        return target;
      }
      // Incremento más pequeño y más lento
      const increment = Math.max(0.3, (target - prev) / 20); 
      return Math.min(prev + increment, target);
    });
  }, 150); // intervalo más lento (150ms)
};

useEffect(() => {
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, []);

const safeToFixed = (val: any): string => {
  if (val == null) return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);

  // Cadena compacta del número (sin ceros inútiles)
  const s = num.toString();          // p.ej "3.1" o "3.1234"
  const [, dec = ''] = s.split('.');

  // Entero o <=2 decimales → devuelvo tal cual
  if (!dec || dec.length <= 2) {
    return s;
  }

  // >2 decimales → redondeo a 2 y quito ceros sobrantes
  return num
    .toFixed(2)       // "3.12" o "3.10"
    .replace(/\.?0+$/,''); // "3.12" o "3.1"
};


const buildColumns = (rows: ParsedPoint[]): Column<ParsedPoint>[] => {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map(key => ({
    header: key,
    accessor: key,
    cell: (v) => safeToFixed(v),
  }));
};

const originalColumns = buildColumns(originalPoints);
const rotatedColumns  = buildColumns(rotatedPoints);

const handleReset = () => {
  setIsResetting(true); // activa animación de salida

  setTimeout(() => {
    // Resetea el estado
    setFileLoaded(false);
    setSelectedModel(MODELS[0].value);
    setLoading(false);
    setCompleted(false);
    setProgress(0);
    setError(null);

    // Limpia TODOS los puntos y datos relacionados
    setOriginalPoints([]);
    setRotatedPoints([]);
    setPoints([]);
    setRotatedData([]);
    setPeriods([]);
    setSelectedPeriod('');
    setModelUrl('/PaleoAtlas.glb');

    // Limpia también el select CSV Model
    setSelectedCsvModel('');
    setAvailableCsvModels([]);  // Si quieres que desaparezca porque el array queda vacío

    if (fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).value = '';
    }

    setTimeout(() => {
      setIsResetting(false);
    }, 300);
  }, 300);
};


// 1) Nuevo estado para los headers de CSV
const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);

// 2) En lugar de tu parseCSVFile genérico, parsea aquí con Papa.parse:
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;

  Papa.parse<ParsedPoint>(f, {
    header: true,
    skipEmptyLines: true,
    complete: ({ data, meta }) => {
      // meta.fields es algo como ['lat','lng','period', ...]
      setOriginalHeaders(meta.fields || []);
      setOriginalPoints(data as ParsedPoint[]);
      setFile(f);
      setFileLoaded(true);
      setError(null);
    },
    error: (err) => setError('Error parsing CSV: ' + err.message)
  });
};

const buildOriginalColumns = (): Column<ParsedPoint>[] => {
  return originalHeaders.map(key => ({
    header: key,
    accessor: key,
    cell: v => safeToFixed(v),
  }));
};


const [animatingModel, setAnimatingModel] = React.useState(false);

const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setAnimatingModel(true);
  setTimeout(() => setAnimatingModel(false), 400); // duración animación total
  setSelectedModel(e.target.value);
};
const parseRotatedCSV = (text: string) => {
  Papa.parse<ParsedPoint>(text, {
    header: true,
    skipEmptyLines: true,
    complete: ({ data }: Papa.ParseResult<ParsedPoint>) => {
      try {
        const rotated: ParsedPoint[] = (data as ParsedPoint[])
          .map(raw => {
            // 1) Normaliza el period y el model
            const period = String(
              raw.period ?? raw.Period ?? ''
            ).trim();
            const model = String(
              raw.model  ?? raw.Model  ?? ''
            ).trim();

            // 2) Parse numéricos
            const lat   = parseFloat(raw.lat   as any);
            const lng   = parseFloat(raw.lng   as any);
            const p_lat = parseFloat(raw.p_lat as any);
            const p_lng = parseFloat(raw.p_lng as any);

            // 3) Reconstruye un objeto limpio
            const clean: any = {};
            for (const [k, v] of Object.entries(raw)) {
              if (/^periods?$/i.test(k) || /^models?$/i.test(k)) continue;
              clean[k] = v;
            }
            clean.lat    = lat;
            clean.lng    = lng;
            clean.p_lat  = p_lat;
            clean.p_lng  = p_lng;
            clean.period = period;
            clean.model  = model;
            return clean as ParsedPoint;
          })
          .filter(p =>
            !isNaN(p.lat) &&
            !isNaN(p.lng) &&
            !isNaN(p.p_lat) &&
            !isNaN(p.p_lng) &&
            p.period.length > 0 &&
            p.model.length  > 0
          );

        if (rotated.length === 0) {
          setError('No valid rotated points with period/model found in CSV.');
          setLoading(false);
          return;
        }

        // 4) Actualiza los puntos y extrae periodos
        setRotatedPoints(rotated);

        const uniquePeriods = Array.from(new Set(rotated.map(p => p.period)));
        setPeriods(uniquePeriods);
        setSelectedPeriod(uniquePeriods[0]);

        // 5) Extrae los modelos únicos y preselecciona el primero
        const uniqueModels = Array.from(new Set(rotated.map(p => p.model)));
        setAvailableCsvModels(uniqueModels);
        setSelectedCsvModel(uniqueModels[0]);

        // 6) Establece la URL 3D para el periodo inicial
        setModelUrl(`/mapas_3D/${uniquePeriods[0]}.glb`);

        setLoading(false);
      } catch (err) {
        setError('Error processing rotated CSV: ' + String(err));
        setLoading(false);
      }
    },
    error: (err: any) => {
      setError('Error parsing rotated CSV: ' + err.message);
      setLoading(false);
    },
  });
};




const handleFileSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();
  if (!file) {
    setError('Please select a CSV file first.');
    return;
  }

  setLoading(true);
  setCompleted(false);
  setProgress(0); // Iniciar desde 0%
  setError(null);
  setRotatedPoints([]);
  setSelectedPeriod('');
  setPeriods([]);
  setDataLoaded(false);

  // 📏 Determinar velocidad de progreso en función del tamaño del archivo
  const fileSizeKB = file.size / 1024;
  let intervalDelay: number;
  let incrementStep: number;

  if (fileSizeKB < 1) {
    intervalDelay = 80;
    incrementStep = 1.5;
  } else if (fileSizeKB < 100) {
    intervalDelay = 100;
    incrementStep = 1;
  } else if (fileSizeKB < 500) {
    intervalDelay = 120;
    incrementStep = 0.5;
  } else {
    intervalDelay = 150;
    incrementStep = 0.3;
  }

  const maxBeforeResponse = 90;

  // ⏳ Iniciar progreso simulado hasta justo antes de recibir la respuesta
  if (intervalRef.current) clearInterval(intervalRef.current);
  intervalRef.current = setInterval(() => {
    setProgress((prev) => {
      if (prev >= maxBeforeResponse) {
        clearInterval(intervalRef.current!);
        return prev;
      }
      return Math.min(prev + incrementStep, maxBeforeResponse);
    });
  }, intervalDelay);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    const response = await fetch('http://161.116.82.76:8080/api/rotate-file', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Error uploading or processing the file.');

    // 🟦 Transición suave al 100% al recibir la respuesta
    if (intervalRef.current) clearInterval(intervalRef.current);
    const smoothTo100 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(smoothTo100);
          return 100;
        }
        return prev + 1;
      });
    }, 40); // Más lento aún

    const csvText = await response.text();
    parseRotatedCSV(csvText);
    setDataLoaded(true);

  } catch (err: any) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLoading(false);
    setProgress(0);
    setError(err.message || 'Unknown error.');
  }
};

async function rotateData(file: File): Promise<{ data: string }> {
  // Aquí tu fetch o axios para enviar el archivo y obtener la respuesta CSV
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/rotate', {
    method: 'POST',
    body: formData,
  });
  const data = await res.text();
  return { data };
}

const processRotatedData = async (csvData: string) => {
  const result = Papa.parse(csvData, { header: true });
  setRotatedData(result.data); // Si usas esto para mapa y tabla
};

useEffect(() => {
  if(points.length === 0) {
    // Aquí limpias tus marcadores o puntos del mapa
    // Por ejemplo, si usas Three.js o similar, elimina objetos de la escena
  } else {
    // Renderiza los puntos nuevos
  }
}, [points]);

useEffect(() => {
  return () => clearInterval(intervalRef.current!);
}, []);

// Cuando se completa visualización (último render)
const handleRenderFinish = () => {
  setRenderFinished(true);
};


const parseCSVFile = <T = any>(file: File): Promise<T[]> =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err) => reject(err),
    });
  });

useEffect(() => {
  let pts = rotatedPoints;
  if (selectedCsvModel) {
    pts = pts.filter(p => p.model === selectedCsvModel);
  }
  if (search) {
    const s = search.toLowerCase();
    pts = pts.filter(p =>
      Object.values(p).some(v => String(v).toLowerCase().includes(s))
    );
  }
  setFilteredPoints(pts);
}, [rotatedPoints, selectedCsvModel, search]);


  const downloadCSV = (data: ParsedPoint[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h as keyof ParsedPoint]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  };
useEffect(() => {
  if (progress === 100 && dataLoaded) {
    clearInterval(intervalRef.current!);
    setCompleted(true);
    setLoading(false);
  }
}, [progress, dataLoaded]);

useEffect(() => {
  if (dataLoaded && renderFinished) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    setCompleted(true);
    setLoading(false);
  }
}, [dataLoaded, renderFinished]);


useEffect(() => {
  const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
  if (!hasSeenInstructions) {
    setShowOverlay(true);
  }
}, []);
useEffect(() => {
  let pts = rotatedPoints;
  if (selectedCsvModel) {
    pts = pts.filter(p => p.model === selectedCsvModel);
  }
  if (search) {
    const s = search.toLowerCase();
    pts = pts.filter(p =>
      Object.values(p).some(v => String(v).toLowerCase().includes(s))
    );
  }
  setFilteredPoints(pts);
}, [rotatedPoints, selectedCsvModel, search]);

return (
<>
<AnimatePresence>
  {showOverlay && (
    <InstructionOverlay
      onClose={() => setShowOverlay(false)}
      refs={{
        model: modelRef,
        button: buttonRef,
        reset: svgRef,
        selectFil: selectFilRef,
        glbViewer: glbViewerRef,
      }}
    />
  )}
</AnimatePresence>

    {/* 3D Map */}
    <section className="w-full mb-16" style={{ marginTop: '-23px' }}>
      <div ref={glbViewerRef} className="w-full h-[650px]">
        <GLBViewer
          modelUrl={modelUrl}
          originalPoints={originalPoints}
          rotatedPoints={filteredPoints}
          selectedPeriod={selectedPeriod}
          exportEnabled={true}
        />
      </div>
    </section>

{/* Tablas */}
{originalPoints.length > 0 && rotatedPoints && (
  <section className="max-w-7xl mx-auto px-4 py-12 space-y-16">
    {/* Tabla Original */}
      <DataTable
        data={originalPoints}
        columns={originalColumns}
        search=""                  
        title="Original Points"    
      />


    {/* Tabla Rotada */}
    <div>
      <div className="mb-4 relative max-w-sm">
        <input
          type="text"
          placeholder="Search rotated points..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
          aria-label="Search rotated points"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <DataTable
        data={rotatedPoints}
        columns={rotatedColumns}
        search={search}
        onDownload={(data) => {
          const now = new Date();
          const timestamp = now.toISOString().replace(/[:.-]/g, '_'); 
          const filename = `rotated_points_${timestamp}.csv`;
          downloadCSV(data, filename);
        }}
        title={`Rotated Points`}
      />

    </div>
  </section>
)}

    {/* Sidebar */}
<aside
  className="
    absolute top-20 left-4 z-10 w-80 max-h-[95vh] overflow-y-auto
    bg-gradient-to-b from-cyan-900/80 via-slate-900/70 to-cyan-900/80
    backdrop-blur-lg border border-cyan-600 rounded-3xl p-6
    text-white shadow-lg space-y-6 animate-fadeIn
  "
  aria-label="Sidebar for uploading and rotating files"
>
  <h2 className="text-3xl font-bold tracking-wide text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]">
    Upload & Rotate
  </h2>

<form
  onSubmit={handleFileSubmit}
  className={`space-y-5 transition-all duration-300 ease-in-out transform
    ${isResetting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
  `}
>
  {/* Archivo CSV */}
  <div className="space-y-2">
    <label htmlFor="csvfile" className="block text-sm font-medium text-cyan-200">
      Upload file (lat,lng)
    </label>

   <div ref={selectFilRef} className="relative">
    <input
      ref={fileInputRef}
      id="csvfile"
      type="file"
      accept=".csv,text/csv"
      onChange={handleFileChange}
      className="sr-only"
      required
    />
      <label
        htmlFor="csvfile"
        className="
          flex items-center justify-between px-4 py-2 bg-gradient-to-br from-cyan-800/90 to-cyan-900/90
          rounded-xl border border-cyan-600 cursor-pointer text-sm font-medium text-cyan-100
          shadow-[0_0_15px_rgba(6,182,212,0.4)]
          hover:from-cyan-700 hover:to-cyan-800 active:scale-[0.97]
          transition-all duration-300 ease-in-out
        "
      >
        {/* Contenedor de texto */}
        <div className="relative w-[120px] overflow-hidden">
          <span
            className={`
              block transition-all duration-500 ease-in-out
              ${fileLoaded ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
            `}
            style={{ transformOrigin: 'left center' }}
          >
            Select File
          </span>
          <span
            className={`
              absolute top-0 left-0 block transition-all duration-500 ease-in-out
              ${fileLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}
            style={{ transformOrigin: 'left center' }}
          >
            File Loaded
          </span>
        </div>

        {/* Icono */}
        <span className="flex-shrink-0">
          {fileLoaded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-400 animate-pulse-scale"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-cyan-300 animate-pulse-slow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16V4H4zm4 4h8m-8 4h8m-8 4h4" />
            </svg>
          )}
        </span>
      </label>
    </div>
  </div>

  {/* Modelo */}
      <div className="space-y-2">
        <label htmlFor="model-select" className="block text-sm font-medium text-cyan-200">
          Select rotation model
        </label>
        <div
          ref={modelRef} 
          className="relative"
        >
          <select
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            className="
              w-full rounded-xl border border-cyan-700 bg-cyan-900
              text-transparent text-sm px-3 py-2 appearance-none
              focus:outline-none focus:ring-2 focus:ring-cyan-500
              shadow-[0_0_12px_rgba(6,182,212,0.7)]
              transition-all cursor-pointer
            "
          >
            {MODELS.map(({ label, value }) => (
              <option key={value} value={value} className="text-cyan-100">
                {label}
              </option>
            ))}
          </select>
          <span
            key={selectedModel}
            className="absolute top-2 left-3 pointer-events-none text-cyan-100 text-sm select-none animate-slideFadeIn"
          >
            {MODELS.find((m) => m.value === selectedModel)?.label}
          </span>
        </div>
      </div>

      {/* Botón Rotate */}
      <div className="flex flex-row items-center gap-2">
        <button
          ref={buttonRef} // ref aquí para el tooltip
          type="submit"
          disabled={loading}
          className={`
            relative overflow-hidden w-[280px] rounded-xl py-2 px-4 text-lg font-semibold text-white
            hover:from-cyan-400 hover:to-blue-500 active:scale-95
            disabled:cursor-wait
            shadow-[0_0_20px_rgba(6,182,212,0.8)]
            transition-all duration-200
            flex justify-center items-center gap-2
            ${progress >= 100 || completed ? 'bg-blue-500' : 'bg-cyan-500'}
          `}
        >
          {loading && (
            <span
              className="absolute left-0 top-0 h-full bg-blue-500 z-0 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 justify-center w-full">
            <span
              style={{
                opacity: loading && !completed ? 1 : 0,
                transition: 'opacity 800ms ease 150ms',
                position: loading && !completed ? 'static' : 'absolute',
                pointerEvents: loading && !completed ? 'auto' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Rotating...
            </span>
            <span
              style={{
                opacity: completed ? 1 : 0,
                transition: 'opacity 1000ms ease 300ms',
                position: completed ? 'static' : 'absolute',
                pointerEvents: completed ? 'auto' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Completed
            </span>
            {!loading && !completed && 'Rotate Coordinates'}
          </span>
        </button>


      {/* Icono Reset */}
      <svg
      ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        role="button"
        tabIndex={0}
        aria-label="Reset algorithm"
        onClick={handleReset}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleReset();
          }
        }}
        className="
          w-7 h-7
          text-white
          cursor-pointer
          transition-transform duration-500 ease-in-out
          hover:rotate-180
          hover:text-cyan-400
        "
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m-15.357-2a8.001 8.001 0 0015.356 2"
        />
      </svg>
    </div>

  {/* Error */}
  {error && (
    <p className="mt-3 text-red-400 font-semibold animate-shake">{error}</p>
  )}

  {/* Period Selector */}
  {periods.length > 0 && (
    <div className="space-y-2">
      <label htmlFor="period-select" className="block text-sm font-medium text-cyan-200">
        Select Period
      </label>
      <select
        id="period-select"
        value={selectedPeriod}
        onChange={(e) => {
          const period = e.target.value;
          setSelectedPeriod(period);
          setModelUrl(`/mapas_3D/${period}.glb`);
        }}
        className="
          w-full rounded-xl border border-cyan-700 bg-cyan-900
          text-cyan-100 text-sm px-3 py-2 appearance-none
          focus:outline-none focus:ring-2 focus:ring-cyan-500
          shadow-[0_0_12px_rgba(6,182,212,0.7)]
          transition-all
        "
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  )}
  {availableCsvModels.length > 1 && (
  <div className="space-y-2">
    <label htmlFor="csv-model-select" className="block text-sm font-medium text-cyan-200">
      Select Model
    </label>
    <select
      id="csv-model-select"
      value={selectedCsvModel}
      onChange={e => setSelectedCsvModel(e.target.value)}
      className="
        w-full rounded-xl border border-cyan-700 bg-cyan-900
        text-cyan-100 text-sm px-3 py-2 appearance-none
        focus:outline-none focus:ring-2 focus:ring-cyan-500
        shadow-[0_0_12px_rgba(6,182,212,0.7)]
        transition-all
      "
    >
      {availableCsvModels.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
)}

</form>

  {/* Grid animado */}
  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(6,182,212,0.07)_11px)] animate-moveGrid"></div>
  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,rgba(6,182,212,0.07)_11px)] animate-moveGridReverse"></div>


  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.8s ease forwards;
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 3s ease-in-out infinite;
    }

    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .animate-pulse-scale {
      animation: pulse-scale 1.5s ease-in-out infinite;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.4s ease-in-out 2;
    }

    @keyframes moveGrid {
      0% { background-position: 0 0; }
      100% { background-position: 0 20px; }
    }
    .animate-moveGrid {
      animation: moveGrid 10s linear infinite;
    }

    @keyframes moveGridReverse {
      0% { background-position: 0 0; }
      100% { background-position: 20px 0; }
    }
    .animate-moveGridReverse {
      animation: moveGridReverse 12s linear infinite;
    }

    @keyframes fadeText {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeText {
      animation: fadeText 0.4s ease forwards;
    }
    @keyframes fadeTextSmooth {
      0% {
        opacity: 0;
        transform: translateY(6px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fadeTextSmooth {
      animation: fadeTextSmooth 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes fadeSelect {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0;
        transform: scale(0.95);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes slideFadeIn {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      50% {
        opacity: 0.7;
        transform: translateY(3px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slideFadeIn {
      animation: slideFadeIn 0.8s ease-out forwards;
    }

    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spinSlow 2s linear infinite;
    }

  `}</style>
</aside>
 </>
 );
};

export default Rotate;
