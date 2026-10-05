'use client';

import { useEffect, useState } from 'react';

const SLIDES = [
  { src: '/hero-bg.jpg',  caption: 'Marché local animé' },
  { src: '/hero-bg2.jpg', caption: 'Boutique mode africaine' },
  { src: '/hero-bg3.jpg', caption: 'Marché au coucher du soleil' },
  { src: '/hero-bg4.jpg', caption: 'Artisanat et bijoux' },
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrev(current);
      setTransitioning(true);
      setCurrent((c) => (c + 1) % SLIDES.length);
      // reset transition flag after animation
      setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, 1200);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  function goTo(idx: number) {
    if (idx === current || transitioning) return;
    setPrev(current);
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, 1200);
  }

  return (
    <div className="hero-slideshow" aria-hidden="true">
      {/* Previous slide fading out */}
      {prev !== null && (
        <div
          className="hero-slide hero-slide-out"
          style={{ backgroundImage: `url(${SLIDES[prev].src})` }}
        />
      )}
      {/* Current slide fading in */}
      <div
        className={`hero-slide hero-slide-in${transitioning ? ' transitioning' : ''}`}
        style={{ backgroundImage: `url(${SLIDES[current].src})` }}
      />
      {/* Dark overlay */}
      <div className="hero-slideshow-overlay" />
      {/* Dots indicators */}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
