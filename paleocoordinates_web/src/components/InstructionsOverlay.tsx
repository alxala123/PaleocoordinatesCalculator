import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstructionOverlayProps {
  onClose: () => void;
  refs: {
    model: React.RefObject<HTMLElement | null>;
    button: React.RefObject<HTMLButtonElement | null>;
    reset: React.RefObject<SVGSVGElement | null>;
    selectFil: React.RefObject<HTMLElement | null>;
    glbViewer: React.RefObject<HTMLElement | null>;
  };
}

type DOMRectType = {
  top: number;
  left: number;
  width: number;
  height: number;
};


const InstructionOverlay: React.FC<InstructionOverlayProps> = ({ onClose, refs }) => {
  const [positions, setPositions] = useState<{
    model: DOMRectType;
    button: DOMRectType;
    reset: DOMRectType;
    selectFil: DOMRectType;
    glbViewer: DOMRectType;
    tooltips: { top: number; left: number; position: 'bottom' | 'right' }[];
  }>({
    model: { top: 0, left: 0, width: 0, height: 0 },
    button: { top: 0, left: 0, width: 0, height: 0 },
    reset: { top: 0, left: 0, width: 0, height: 0 },
    selectFil: { top: 0, left: 0, width: 0, height: 0 },
    glbViewer: { top: 0, left: 0, width: 0, height: 0 },
    tooltips: new Array(5).fill({ top: 0, left: 0, position: 'right' }),
  });
  const [visibleTooltip, setVisibleTooltip] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const Mx = 8;
  const My = 8;

  const iconOffsets: [number, number][] = [
    [0, -12],
    [27.5, 15],
    [0, -12],
    [0, -12],
    [-37.5, -55],
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tooltip-button') && !target.closest('.tooltip-box')) {
        setVisibleTooltip(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
useEffect(() => {
  const originalOverflow = document.body.style.overflow;

  const getPositions = () => {
    const modelRect = refs.model.current?.getBoundingClientRect();
    const buttonRect = refs.button.current?.getBoundingClientRect();
    const resetRect = refs.reset.current?.getBoundingClientRect();
    const selectFilRect = refs.selectFil.current?.getBoundingClientRect();
    const glbRect = refs.glbViewer.current?.getBoundingClientRect();

    if (modelRect && buttonRect && resetRect && selectFilRect && glbRect) {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      const elems = [
        modelRect,
        buttonRect,
        resetRect,
        selectFilRect,
        glbRect,
      ].map(rect => ({
        top: rect.top + scrollY,
        left: rect.left + scrollX,
        width: rect.width,
        height: rect.height,
      }));

      const tooltipsPos = elems.map((elem, idx) => {
        const { top, left, width, height } = elem;
        const position: 'bottom' | 'right' = (idx === 1 || idx === 4) ? 'bottom' : 'right';
        return position === 'right'
          ? { position, top: top + height * 0.5, left: left + width + Mx }
          : { position, top: top + height + My, left: left + width * 0.5 };
      });

      setPositions({
        model: elems[0],
        button: elems[1],
        reset: elems[2],
        selectFil: elems[3],
        glbViewer: elems[4],
        tooltips: tooltipsPos,
      });
    }
  };

  getPositions();
  window.addEventListener('resize', getPositions);

  return () => {

    window.removeEventListener('resize', getPositions);
  };
}, [refs]);

  const bottomCenter = (rect: DOMRectType) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height });
  const rightCenter = (rect: DOMRectType) => ({ x: rect.left + rect.width, y: rect.top + rect.height / 2 });
  const topCenter = (tooltip: { top: number; left: number }) => ({ x: tooltip.left, y: tooltip.top });
  const leftCenter = (tooltip: { top: number; left: number }) => ({ x: tooltip.left, y: tooltip.top });

  const createPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0) return `M${start.x},${start.y} V${end.y}`;
    if (dy === 0) return `M${start.x},${start.y} H${end.x}`;
    return `M${start.x},${start.y} L${end.x},${end.y}`;
  };

  const renderLine = (
    startPos: DOMRectType,
    tooltipPos: { top: number; left: number; position: 'bottom' | 'right' }
  ) => {
    const start = tooltipPos.position === 'bottom' ? bottomCenter(startPos) : rightCenter(startPos);
    const end = tooltipPos.position === 'bottom' ? topCenter(tooltipPos) : leftCenter(tooltipPos);
    const path = createPath(start, end);
    return (
      <g key={`${start.x}-${start.y}-${end.x}-${end.y}`}>
        <path d={path} stroke="#06b6d4" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={start.x} cy={start.y} r={4} fill="#06b6d4" />
        <circle cx={end.x} cy={end.y} r={4} fill="#06b6d4" />
      </g>
    );
  };

const texts = [
  'Select a rotation model here.',
  'Use this button to apply the rotation.',
  'Reset the rotation to its initial state.',
  'Apply custom filters here.',
  'Interact with your 3D model in this area.',
];


  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  const handleClose = () => setIsVisible(false);

  return (
     <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-auto overflow-hidden"
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={def => def === 'exit' && onClose()}
        >
          <button
            onClick={handleClose}
            className="absolute top-20 right-6 z-50 text-white text-3xl font-bold pointer-events-auto hover:text-cyan-300 transition-colors"
          >
            &times;
          </button>

          {/* Aquí va el resto de tu código SVG y overlays sin cambios */}
          <svg className="fixed inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="mask" maskUnits="userSpaceOnUse">
                   <rect width="100%" height="100%" fill="white" />
                {[positions.model, positions.button, positions.reset, positions.selectFil].map((pos, i) => (
                  <rect
                    key={i}
                    x={pos.left}
                    y={pos.top}
                    width={pos.width}
                    height={pos.height}
                    fill="black"
                    rx={6}
                    ry={6}
                  />
                ))}
                {(() => {
                  const pos = positions.glbViewer;
                  const cx = pos.left + pos.width / 2;
                  const cy = pos.top + pos.height / 2;
                  const r = (Math.min(pos.width, pos.height) / 2) * 0.76;
                  return <circle key="glb" cx={cx} cy={cy} r={r} fill="black" />;
                })()}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
          </svg>

          {[positions.model, positions.button, positions.reset, positions.selectFil, positions.glbViewer].map(
            (pos, i) => {
              const isGlb = i === 4;
              const cx = pos.left + pos.width / 2;
              const cy = pos.top + pos.height / 2;
              const r = (Math.min(pos.width, pos.height) / 2) * 0.76;

              return isGlb ? (
                <div
                  key={`box-${i}`}
                  className="pointer-events-none border border-cyan-400"
                  style={{
                    position: 'absolute',
                    top: cy - r,
                    left: cx - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: '9999px',
                    zIndex: 50,
                    backgroundColor: 'transparent',
                  }}
                />
              ) : (
                <div
                  key={`box-${i}`}
                  className="pointer-events-none rounded-lg border border-cyan-400"
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    width: pos.width,
                    height: pos.height,
                    zIndex: 50,
                    backgroundColor: 'transparent',
                  }}
                />
              );
            }
          )}

          {positions.tooltips.map((tip, i) => {
            const isBtn = i === 1;
            const [dx, dy] = iconOffsets[i] || [0, 0];
            const iconX = (isBtn ? tip.left - 36 : tip.left + 30) + dx;
            const iconY = tip.top + dy;

            return (
              <div key={`tt-${i}`}>
                <AnimatePresence>
                  {visibleTooltip === i ? (
                    <motion.div
                      layoutId={`tooltip-${i}`}
                      className="absolute z-50 tooltip-button group"
                      style={{
                        top: iconY,
                        left: iconX,
                        transform: 'translate(-50%, -50%)',
                        transformOrigin: 'center center',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisibleTooltip(null);
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        borderRadius: 12,
                        width: 220,
                        height: 'auto',
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        borderRadius: 999,
                        width: 24,
                        height: 24,
                      }}
                      transition={{
                        type: 'tween',
                        ease: 'easeInOut',
                        duration: 0.35,
                      }}
                    >
                      <div className="tooltip-box bg-white border border-cyan-400 text-cyan-700 text-sm rounded-lg shadow-lg px-3 py-2">
                        {texts[i]}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      layoutId={`tooltip-${i}`}
                      className="absolute z-50 tooltip-button group"
                      style={{
                        top: iconY,
                        left: iconX,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisibleTooltip(i);
                      }}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 group-hover:bg-cyan-500 transition-colors duration-200 shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                          />
                        </svg>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {renderLine(
                  [positions.model, positions.button, positions.reset, positions.selectFil, positions.glbViewer][i],
                  tip
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstructionOverlay;
