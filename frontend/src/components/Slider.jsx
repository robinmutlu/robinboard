import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const FALLBACK_SLIDE = {
  type: "image",
  url: "https://via.placeholder.com/800x600?text=RobinBoard",
  caption: "Hoş geldiniz",
};

const Slider = ({ socket = null }) => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get("/api/files");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSlides(res.data);
        setCurrentIndex((prev) => (prev >= res.data.length ? 0 : prev));
      } else {
        setSlides([FALLBACK_SLIDE]);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Slider verisi alınamadı:", err);
    }
  }, []);

  useEffect(() => {
    const immediateTimer = setTimeout(() => {
      fetchFiles();
    }, 0);
    const timer = setInterval(fetchFiles, 10 * 60 * 1000);
    return () => {
      clearTimeout(immediateTimer);
      clearInterval(timer);
    };
  }, [fetchFiles]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleMediaChanged = () => {
      fetchFiles();
    };

    socket.on("mediaChanged", handleMediaChanged);
    return () => {
      socket.off("mediaChanged", handleMediaChanged);
    };
  }, [socket, fetchFiles]);

  useEffect(() => {
    if (slides.length === 0) {
      return undefined;
    }

    const currentSlide = slides[currentIndex] || slides[0];
    const duration = currentSlide.type === "video" ? 20000 : 10000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  if (slides.length === 0) {
    return <div className="h-full bg-black flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  const slide = slides[currentIndex] || slides[0];
  const progressDuration = slide.type === "video" ? "20s" : "10s";

  return (
    <div key={slide.url} className="relative w-full h-full bg-black overflow-hidden">
      {slide.type === "video" ? (
        <video src={slide.url} className="w-full h-full object-contain" autoPlay muted loop />
      ) : (
        <img src={slide.url} className="w-full h-full object-contain" alt="slide" />
      )}

      {slide.caption && (
        <div className="absolute bottom-0 w-full bg-black/60 text-white p-4 text-center font-bold text-xl backdrop-blur-sm">
          {slide.caption}
        </div>
      )}

      <div
        className="absolute top-0 left-0 h-1 bg-emerald-500 z-10 animate-[sliderProgress_linear_forwards]"
        style={{ animationDuration: progressDuration }}
      />

      <style>{`
        @keyframes sliderProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Slider;
