'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ShopTopbarProps {
  shopName: string;
  logoUrl: string | null;
}

export default function ShopTopbar({ shopName, logoUrl }: ShopTopbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mn-theme');
    if (stored === 'dark' || stored === 'light') {
      setIsDark(stored === 'dark');
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('mn-theme', next ? 'dark' : 'light');
  }

  return (
    <header className={`shop-topbar${scrolled ? ' scrolled' : ''}`}>
      {/* Logo de la boutique */}
      <div className="shop-topbar-logo">
        {logoUrl ? (
          <img src={logoUrl} alt={shopName} />
        ) : (
          <span className="shop-topbar-logo-fallback">
            <i className="bi bi-shop" />
          </span>
        )}
      </div>

      {/* Nom */}
      <span className="shop-topbar-name">{shopName}</span>

      {/* Actions : dark mode seulement */}
      <div className="shop-topbar-actions">
        <button
          className="shop-topbar-icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon'}`} />
        </button>

        <Link href="/shops" className="shop-topbar-icon-btn" aria-label="Retour aux boutiques" title="Toutes les boutiques">
          <i className="bi bi-grid-3x3-gap" />
        </Link>
      </div>
    </header>
  );
}
