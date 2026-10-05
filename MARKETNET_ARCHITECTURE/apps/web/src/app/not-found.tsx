import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page introuvable — MarketNet',
  description: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      background: 'var(--color-bg)',
      textAlign: 'center',
      gap: 'var(--space-6)',
    }}>
      {/* Illustration */}
      <div style={{
        position: 'relative',
        width: 120,
        height: 120,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--color-primary-muted)',
          animation: 'pulse 3s ease-in-out infinite',
        }} aria-hidden="true" />
        <div style={{
          position: 'relative',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'var(--color-primary-muted)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 52,
          color: 'var(--color-primary)',
        }}>
          <i className="bi bi-map" aria-hidden="true" />
        </div>
      </div>

      {/* Texte */}
      <div style={{ maxWidth: 480 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(72px, 12vw, 96px)',
          fontWeight: 'var(--fw-extra)',
          color: 'var(--color-primary)',
          lineHeight: 1,
          letterSpacing: 'var(--ls-tight)',
        }} aria-hidden="true">
          404
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(var(--text-xl), 3vw, var(--text-2xl))',
          fontWeight: 'var(--fw-extra)',
          color: 'var(--color-text)',
          margin: 'var(--space-2) 0 var(--space-3)',
        }}>
          Page introuvable
        </h1>
        <p style={{
          color: 'var(--color-text-3)',
          fontSize: 'var(--text-base)',
          lineHeight: 'var(--lh-relaxed)',
          margin: 0,
        }}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
          Vérifiez l&apos;adresse ou revenez à l&apos;accueil.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn primary lg">
          <i className="bi bi-house" aria-hidden="true" />
          Retour à l&apos;accueil
        </Link>
        <Link href="/products" className="btn lg">
          <i className="bi bi-grid" aria-hidden="true" />
          Voir les produits
        </Link>
      </div>

      {/* Aide */}
      <p style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-sm)' }}>
        Besoin d&apos;aide ?{' '}
        <a
          href="https://wa.me/243000000000"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary-text)', fontWeight: 'var(--fw-semi)' }}
        >
          Contactez-nous via WhatsApp
        </a>
      </p>
    </div>
  );
}
