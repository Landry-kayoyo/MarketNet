'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiLogin, saveTokens } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await apiLogin(email, password);
      saveTokens(tokens);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page login-page">

      {/* ── Colonne gauche — storytelling ── */}
      <div className="signup-story" aria-hidden="true">
        <Link href="/" className="signup-brand">MarketNet</Link>
        <span className="signup-kicker">Espace commerçant</span>
        <h1>Gérez votre boutique locale.</h1>
        <p>
          MarketNet vous donne les outils pour développer votre activité
          et toucher plus de clients dans votre ville.
        </p>
        <div className="signup-benefits">
          <div className="signup-benefit">
            <i className="bi bi-shop-window" aria-hidden="true" />
            Vendez vos produits en ligne sans frais fixes.
          </div>
          <div className="signup-benefit">
            <i className="bi bi-whatsapp" aria-hidden="true" />
            Recevez les commandes directement sur WhatsApp.
          </div>
          <div className="signup-benefit">
            <i className="bi bi-graph-up-arrow" aria-hidden="true" />
            Analysez vos visites et vos ventes.
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-10)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}>
          {[
            { value: '500+', label: 'Boutiques actives' },
            { value: '0 FC', label: 'Frais d\'inscription' },
            { value: '5 min', label: 'Pour démarrer' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extra)', fontSize: 'var(--text-2xl)', color: 'var(--emerald-300)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Colonne droite — formulaire ── */}
      <div className="signup-form-side">
        <div className="signup-card login-card">

          {/* Header */}
          <div className="signup-card-head">
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-muted)',
              color: 'var(--color-primary)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              marginBottom: 'var(--space-4)',
            }} aria-hidden="true">
              <i className="bi bi-shop-window" />
            </div>
            <h2>Connexion</h2>
            <p>Accédez à votre espace commerçant.</p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="signup-error is-visible" role="alert" aria-live="assertive">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
              {error}
            </div>
          )}

          <form
            className="signup-form"
            onSubmit={handleSubmit}
            style={{ marginTop: 'var(--space-5)' }}
            noValidate
          >
            <label htmlFor="login-email">
              Adresse e-mail
              <input
                id="login-email"
                type="email"
                placeholder="contact@maboutique.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                aria-required="true"
              />
            </label>

            <label htmlFor="login-password">
              Mot de passe
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  aria-required="true"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-3)',
                    cursor: 'pointer',
                    padding: 4,
                    fontSize: 16,
                  }}
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                </button>
              </div>
            </label>

            <button
              type="submit"
              className={`btn primary signup-submit${loading ? ' loading' : ''}`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Connexion…' : (
                <>
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="login-switch">
            <span>Vous n&apos;avez pas de compte ?</span>
            <Link href="/register" style={{ color: 'var(--color-primary-text)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semi)' }}>
              Créer ma boutique
            </Link>
          </div>

          <div className="login-demo-note" style={{ marginTop: 'var(--space-4)' }}>
            <i className="bi bi-info-circle-fill" aria-hidden="true" />
            <span>
              <strong>Compte démo :</strong> utilisez l&apos;adresse e-mail et le mot de passe fournis par votre administrateur MarketNet.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
