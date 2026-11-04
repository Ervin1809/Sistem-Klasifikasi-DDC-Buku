import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ClassifierSection from './components/ClassifierSection';
import DDCGuideSection from './components/DDCGuideSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import { checkBackendHealth } from './services/api';

export default function App() {
  const [serverStatus, setServerStatus] = useState({ status: 'checking', model_ready: false });
  const [isDDCGuideOpen, setIsDDCGuideOpen] = useState(false);

  // Periksa konektivitas backend saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    async function verifyHealth() {
      const data = await checkBackendHealth();
      if (isMounted) {
        setServerStatus(data);
      }
    }

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000); // Polling status setiap 15 detik

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartClick = () => {
    const el = document.getElementById('klasifikasi');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGuideClick = () => {
    setIsDDCGuideOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f6fb] text-slate-800">
      
      {/* 1. Header & Navigasi */}
      <Navbar
        serverStatus={serverStatus}
        onOpenDDCGuide={handleGuideClick}
      />

      {/* 2. Hero Section (Desain Template Elegan Terbuka) */}
      <Hero
        onStartClick={handleStartClick}
        onGuideClick={handleGuideClick}
      />

      {/* 3. Area Kerja Klasifikasi DDC (Alur Jalur 1 & Jalur 2) */}
      <ClassifierSection />

      {/* 4. Penjelasan Arsitektur & Keamanan Zero Persistence */}
      <AboutSection />

      {/* 5. Footer */}
      <Footer
        onOpenDDCGuide={handleGuideClick}
      />

      {/* 6. Modal Bagan Panduan 10 Kelas DDC */}
      <DDCGuideSection
        isOpen={isDDCGuideOpen}
        onClose={() => setIsDDCGuideOpen(false)}
      />

    </div>
  );
}
