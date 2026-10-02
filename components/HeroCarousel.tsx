'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: string;
  src: string;
  alt: string;
}

interface HeroCarouselProps {
  children?: React.ReactNode;
}

export function HeroCarousel({ children }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const slideDuration = 5000; // 5 seconds
  const stepInterval = 50; // 50ms interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] = [
    {
      id: 'slide-1',
      src: '/carousel1.png',
      alt: 'Students taking examinations in digital laboratory',
    },
    {
      id: 'slide-2',
      src: '/carousel2.jpg',
      alt: 'Classroom with computer terminals and interactive presentation',
    },
    {
      id: 'slide-3',
      src: '/carousel3.png',
      alt: 'Instructor presenting academic learning objectives',
    },
    {
      id: 'slide-4',
      src: '/carousel4.jpg',
      alt: 'Modern classroom with Google Classroom digital learning tools',
    },
  ];

  // 5-second auto-cycle
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + (stepInterval / slideDuration) * 100;
      });
    }, stepInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  const handleManualSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlide((curr) => (curr - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentSlide((curr) => (curr + 1) % slides.length);
    setProgress(0);
  };

  return (
    <div
      className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] overflow-hidden bg-slate-900 border-b border-slate-200 flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Full-Width Background Carousel Images with Smooth Crossfade */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center transform scale-110 blur-[4px] sm:blur-[6px] transition-all duration-1000"
              />
            </div>
          );
        })}
      </div>


      {/* 2. White Overlay Fading from Left to Right (+15% Opacity) */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/55 pointer-events-none z-[1]" />

      {/* 3. Subtle ambient light orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#9CC7E6]/20 rounded-full blur-3xl pointer-events-none z-[2]" />

      {/* 4. Centered Foreground Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 sm:pt-16 sm:pb-8 text-center flex-1 flex flex-col justify-center">
        {children}
      </div>

      {/* 5. Centered Carousel Controls & 5-Second Progress Indicators */}
      <div className="relative z-20 pb-8 sm:pb-10 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-md">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full hover:bg-slate-100 text-[#0B1D39] transition-transform active:scale-95 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Slide Indicator Pills */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={s.id}
                  onClick={() => handleManualSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    isActive ? 'w-8 bg-slate-200' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {isActive && (
                    <div
                      className="absolute inset-y-0 left-0 bg-[#123A63] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="p-1 rounded-full hover:bg-slate-100 text-[#0B1D39] transition-transform active:scale-95 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
