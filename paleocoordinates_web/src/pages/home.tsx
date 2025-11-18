import React, { useState, useEffect } from 'react';
import HowItWorksWithGlobe from '../components/HowItWorksSteps';
import AppIntroSection from '../components/AppIntroSection';
import GLBViewer from '../components/GLBViewer';
import LocationSidebar from '../components/LocationSidebar';
import Papa from 'papaparse';

const Home = () => {
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotatedCsvUrl, setRotatedCsvUrl] = useState<string | null>(null);
  const [rotatedPoints, setRotatedPoints] = useState<{ lat: number; lng: number }[]>([]);

  // Cuando cambie rotatedCsvUrl, parsear CSV para extraer puntos rotados
  useEffect(() => {
    if (!rotatedCsvUrl) {
      setRotatedPoints([]);
      return;
    }

    Papa.parse(rotatedCsvUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const points = (results.data as any[])
          .map(p => ({
            lat: parseFloat(p.p_lat),
            lng: parseFloat(p.p_lng),
          }))
          .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
        setRotatedPoints(points);
      },
      error: () => {
        setRotatedPoints([]);
        setError('Error parsing rotated CSV');
      }
    });
  }, [rotatedCsvUrl]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setInputLat(lat);
        setInputLng(lng);
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://161.116.82.76:8080';
        try {
          const response = await fetch(`${API_BASE_URL}/api/rotate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: parseFloat(lat),
              lng: parseFloat(lng),
            }),
          });

          if (!response.ok) throw new Error('API error');

          await response.json();
          // Añadimos timestamp para evitar cache
          setRotatedCsvUrl(`${API_BASE_URL}/results/rotated.csv?t=${Date.now()}`);
        } catch (err) {
          setError('Error calculating paleocoordinates. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setError('Permission denied. Please allow location access.');
        } else {
          setError('Could not retrieve your location.');
        }
        setLoading(false);
      }
    );
  };

  return (
    <main className="min-h-screen bg-white relative m-0 p-0">
      {/* Wrapper que quita el padding-top del body para el mapa */}
      <div style={{ marginTop: '-23px' }}>
        {/* 3D Map */}
        <section className="w-full mb-16">
          <div className="w-full h-[650px]">
          <GLBViewer
            modelUrl="/Jurassic-Cretaceous.glb"
            rotatedPoints={rotatedPoints}
            selectedPeriod="Jurassic-Cretaceous"
            exportEnabled={false}
          />
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <LocationSidebar
        onUseLocation={handleUseCurrentLocation}
        loading={loading}
        error={error}
      />

      {/* How it works steps */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <HowItWorksWithGlobe />
      </section>

      {/* Intro Section */}
      <section className="max-w-5xl mx-auto px-4 mb-24">
        <AppIntroSection />
      </section>
    </main>
  );
};

export default Home;
