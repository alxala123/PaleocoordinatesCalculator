import React from 'react';
import { FaMapMarkerAlt, FaSyncAlt } from 'react-icons/fa';

interface LocationSidebarProps {
  onUseLocation: () => void;
  loading: boolean;
  error: string | null;
}

const LocationSidebar: React.FC<LocationSidebarProps> = ({ onUseLocation, loading, error }) => {
  return (
    <>
      <aside
        className="absolute top-4 left-4 h-[620px] w-72 bg-gradient-to-b from-cyan-900/80 via-slate-900/70 to-cyan-900/80
          backdrop-blur-lg border border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.7)] rounded-3xl
          text-white p-6 flex flex-col justify-between z-30 animate-fadeIn"
      >
        <div>
          <h2 className="text-2xl font-bold mb-4 tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] flex items-center gap-2">
            <FaMapMarkerAlt className="text-cyan-300" />
            Cretaceous Locator
          </h2>
          <p className="text-sm leading-snug tracking-wide text-cyan-200">
            Begin a geospatial analysis of your current GPS coordinates to reveal your location on Earth during the
            <span className="text-cyan-400 font-semibold"> Cretaceous Period</span>, between 145 and 66 million years ago.
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <button
            onClick={onUseLocation}
            disabled={loading}
            className={`w-full py-2 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 
              hover:from-cyan-400 hover:to-blue-500 active:scale-95 
              transition-transform duration-200 shadow-[0_0_20px_rgba(6,182,212,0.7)]
              font-semibold text-base tracking-wide flex items-center justify-center gap-2
              ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            <FaSyncAlt className={`text-md text-white ${loading ? 'animate-spin' : 'animate-pulse-slow'}`} />
            {loading ? 'Running geolocation analysis...' : 'Rotate My Location'}
          </button>

          {error && (
            <div className="text-red-400 text-xs bg-red-900/60 rounded-md py-2 px-3 border border-red-700 shadow-md animate-shake">
              {error}
            </div>
          )}
        </div>

        {/* subtle grid lines background overlay with subtle animation */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(6,182,212,0.07)_11px)] animate-moveGrid"></div>
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,rgba(6,182,212,0.07)_11px)] animate-moveGridReverse"></div>
      </aside>

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
      `}</style>
    </>
  );
};

export default LocationSidebar;
