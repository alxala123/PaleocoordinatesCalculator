import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileUpload, FaSyncAlt, FaGlobeAmericas } from 'react-icons/fa';

const steps = [
  {
    icon: FaFileUpload,
    title: 'Data Input',
    desc: 'Upload your current coordinates from a CSV or Excel file to start the geological analysis.',
    timestamp: 'Present',
  },
  {
    icon: FaSyncAlt,
    title: 'Paleorotation',
    desc: 'We apply tectonic rotations to calculate the exact paleocoordinates in the past.',
    timestamp: '150 Mya',
  },
  {
    icon: FaGlobeAmericas,
    title: '3D Visualization',
    desc: 'Visualize your data on an interactive Jurassic globe to analyze its paleogeographic context.',
    timestamp: 'Jurassic',
  },
];

const HowItWorksTimeline = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (i: number) => {
    setExpanded(prev => (prev === i ? null : i));
  };

  return (
    <section className="max-w-6xl mx-auto px-6 mt-24">
      <div className="relative flex justify-between items-start pt-10">
        {steps.map((step, i) => {
          const isActive = expanded === i;
          const isLast = i === steps.length - 1;
          const Icon = step.icon;

          return (
            <div key={i} className="flex-1 relative text-center cursor-pointer" onClick={() => toggle(i)}>
              {/* Línea entre puntos */}
              {!isLast && (
                <div className="absolute top-7 left-1/2 w-full h-1 z-0">
                  <div className="w-full h-1 bg-gradient-to-r from-gray-300 to-gray-100"></div>
                </div>
              )}

              {/* Icono circular */}
              <div
                className={`relative z-10 mx-auto w-14 h-14 flex items-center justify-center rounded-full
                  ${isActive ? 'bg-[#1e293b]' : 'bg-gray-200'}`}
              >
                <Icon
                  className={`text-2xl ${
                    isActive ? 'text-gray-200' : 'text-[#1e293b]'
                  }`}
                />
              </div>

              {/* Título */}
              <h3 className={`mt-4 text-lg font-semibold ${isActive ? 'text-[#1e293b]' : 'text-gray-600'}`}>
                {step.title}
              </h3>

              {/* Timestamp */}
              <p className="text-sm text-gray-500 mt-1">{step.timestamp}</p>

              {/* Descripción expandida */}
              <AnimatePresence>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-4 text-gray-700 text-sm px-4"
                  >
                    {step.desc}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorksTimeline;
