'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken, clearTokens, apiLogout, TOKEN_KEY } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard',          icon: 'bi-grid-1x2-fill', label: 'Tableau de bord' },
  { href: '/dashboard/products', icon: 'bi-box-seam',      label: 'Produits' },
  { href: '/dashboard/orders',   icon: 'bi-bag-check',     label: 'Commandes' },
  { href: '/dashboard/messages', icon: 'bi-chat-dots',     label: 'Messages' },
  { href: '/dashboard/shop',     icon: 'bi-palette',       label: 'Ma boutique' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);

    // Sync theme
    const theme = localStorage.getItem('mn-theme');
    if (theme === 'dark' || theme === 'light') {
      setIsDark(theme === 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [router]);

  async function handleLogout() {
    const token = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem('mn_refresh');
    clearTokens();
    if (token) {
      try { await apiLogout(token, refresh ?? undefined); } catch { /* ignore */ }
    }
    router.push('/login');
  }

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

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-3)' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid var(--color-primary-muted)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app authenticated-app">
      {/* ── Topbar ── */}
      <header className="topbar">
        <Link href="/" className="brand" aria-label="MarketNet — Retour à l'accueil">
          <span className="brand-icon" aria-hidden="true">
            <i className="bi bi-shop-window" />
          </span>
          MarketNet
        </Link>

        <div className="public-nav" aria-hidden="true">
          <span style={{
            color: 'var(--color-text-3)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-medium)',
          }}>
            Espace commerçant
          </span>
        </div>

        <div className="top-actions">
          {/* Dark mode */}
          <button
            className="btn icon-only ghost"
            onClick={toggleTheme}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon'}`} aria-hidden="true" />
          </button>



          {/* Déconnexion */}
          <button className="btn" onClick={handleLogout} aria-label="Se déconnecter">
            <i className="bi bi-box-arrow-left" aria-hidden="true" />
            <span className="label">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="auth-layout">
        {/* ── Sidebar desktop ── */}
        <aside className="sidebar" aria-label="Navigation du tableau de bord">
          <span className="merchant-sidebar-label">Navigation</span>

          <nav className="nav" aria-label="Menu principal">
            {NAV_ITEMS.map(({ href, icon, label }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <button
                  className={isActive(href) ? 'active' : ''}
                  style={{ width: '100%' }}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  <i className={`bi ${icon}`} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              </Link>
            ))}
          </nav>

          <div className="nav-more">
            <button
              className="quick-logout"
              style={{ width: '100%' }}
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-left" aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <main className="auth-main" id="main-content" tabIndex={-1}>
          <div className="content">{children}</div>
        </main>
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav className="sidebar" aria-label="Navigation mobile" role="navigation">
        {/* La sidebar css se transforme en bottom nav à ≤1024px */}
        <div className="nav">
          {NAV_ITEMS.slice(0, 5).map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <button
                className={isActive(href) ? 'active' : ''}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <i className={`bi ${icon}`} aria-hidden="true" />
                <span>{label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
