import { GlobeAltIcon } from '@heroicons/react/24/outline';
import React from 'react';
const AppIntroSection = () => {
  return (
    <section className="flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-8 max-w-4xl w-full">
        <div className="flex items-center gap-3 mb-4">
          <GlobeAltIcon className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Paleocoordinates Calculator
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6">
          A scientific tool for reconstructing the paleogeographic positions of present-day coordinates using tectonic rotation models.
        </p>

        <div className="space-y-5 text-base text-gray-800 leading-relaxed">
          <p>
            The <strong>Paleocoordinates Calculator</strong> estimates the ancient position of any modern geographic location, using latitude and longitude inputs. These reconstructions are based on rotation models derived from paleomagnetic and geophysical datasets.
          </p>

          <p>
            It is designed to support research in tectonic plate motion, paleoclimate studies, and biogeography. The tool applies rotation parameters to generate high-resolution continental reconstructions across geological timescales.
          </p>

          <p>
            Outputs are presented via an interactive 3D globe and can be exported for use in GIS platforms or scientific workflows.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AppIntroSection;
