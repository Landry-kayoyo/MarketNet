'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useState, useEffect } from 'react';

interface TopbarProps {
  activeNav?: 'home' | 'products' | 'shops';
}

export default function Topbar({ activeNav }: TopbarProps) {
  const { itemCount: count, setOpen } = useCart();
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('mn-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('mn-theme', 'light');
    }
  }

  return (
    <header className="topbar" style={scrolled ? { boxShadow: 'var(--shadow-md)' } : {}}>
      {/* Logo */}
      <Link href="/" className="brand" aria-label="MarketNet — Accueil">
        <span className="brand-icon" aria-hidden="true">
          <i className="bi bi-shop-window" />
        </span>
        MarketNet
      </Link>

      {/* Nav desktop */}
      <nav className="public-nav" aria-label="Navigation principale">
        <Link
          href="/"
          className={activeNav === 'home' ? 'active' : ''}
          aria-current={activeNav === 'home' ? 'page' : undefined}
        >
          Accueil
        </Link>
        <Link
          href="/products"
          className={activeNav === 'products' ? 'active' : ''}
          aria-current={activeNav === 'products' ? 'page' : undefined}
        >
          Produits
        </Link>
        <Link
          href="/shops"
          className={activeNav === 'shops' ? 'active' : ''}
          aria-current={activeNav === 'shops' ? 'page' : undefined}
        >
          Boutiques
        </Link>
      </nav>

      {/* Actions */}
      <div className="top-actions">
        {/* Dark mode toggle */}
        <button
          className="btn icon-only ghost"
          onClick={toggleTheme}
          aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon'}`} aria-hidden="true" style={{ fontSize: '15px' }} />
        </button>

        {/* Panier */}
        <button
          className="btn cart-pill"
          onClick={() => setOpen(true)}
          aria-label={`Ouvrir le panier${count > 0 ? ` (${count} article${count > 1 ? 's' : ''})` : ''}`}
        >
          <i className="bi bi-bag" aria-hidden="true" style={{ fontSize: '15px' }} />
          <span className="label">Panier</span>
          {count > 0 && (
            <span className="cart-count" aria-hidden="true">{count}</span>
          )}
        </button>

        {/* Espace commerçant */}
        <Link
          href="/login"
          className="btn topbar-login-btn"
          aria-label="Accéder à l'espace commerçant"
        >
          <span className="label">Mon espace</span>
        </Link>
      </div>
    </header>
  );
}
