'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRegister, saveTokens } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

const STEPS = [
  { id: 1, label: 'Identité' },
  { id: 2, label: 'Sécurité' },
  { id: 3, label: 'Boutique' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    shopName: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }

    setError('');
    setLoading(true);
    try {
      const tokens = await apiRegister({
        email: form.email,
        password: form.password,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone || undefined,
      });
      saveTokens(tokens);
      
      // CREATE THE SHOP
      if (form.shopName) {
        await fetch(`${API_BASE}/api/v1/shops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`
          },
          body: JSON.stringify({
            name: form.shopName,
            city: form.city || undefined,
            slug: form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            status: 'PUBLISHED',
          })
        });
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      {/* ── Colonne gauche ── */}
      <div className="signup-story" aria-hidden="true">
        <Link href="/" className="signup-brand">MarketNet</Link>
        <span className="signup-kicker">Rejoignez-nous</span>
        <h1>Vendez localement. Développez votre boutique.</h1>
        <p>
          Ouvrez votre vitrine en quelques minutes, sans frais cachés.
          Des milliers de clients locaux vous attendent.
        </p>
        <div className="signup-benefits">
          <div className="signup-benefit">
            <i className="bi bi-shop" aria-hidden="true" />
            Une boutique en ligne à votre image
          </div>
          <div className="signup-benefit">
            <i className="bi bi-geo-alt" aria-hidden="true" />
            Attirez des clients de votre ville
          </div>
          <div className="signup-benefit">
            <i className="bi bi-whatsapp" aria-hidden="true" />
            Recevez vos commandes sur WhatsApp
          </div>
        </div>
        <div style={{
          marginTop: 'var(--space-10)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
        }}>
          Inscription gratuite · Sans carte bancaire · Annulez à tout moment
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="signup-form-side">
        <div className="signup-card">

          {/* Stepper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 'var(--space-6)',
          }} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Étape ${step} sur 3`}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 'var(--fw-bold)',
                    fontFamily: 'var(--font-display)',
                    background: step > s.id
                      ? 'var(--color-primary)'
                      : step === s.id
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-3)',
                    color: step >= s.id ? '#fff' : 'var(--color-text-3)',
                    transition: 'all var(--duration-base)',
                  }}>
                    {step > s.id
                      ? <i className="bi bi-check2" aria-hidden="true" />
                      : s.id}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 'var(--fw-semi)',
                    color: step >= s.id ? 'var(--color-primary-text)' : 'var(--color-text-disabled)',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    margin: '-16px var(--space-2) 0',
                    background: step > s.id ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'background var(--duration-slow)',
                    borderRadius: 2,
                  }} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          {/* Header dynamique */}
          <div className="signup-card-head">
            <h2>
              {step === 1 && 'Créer mon compte'}
              {step === 2 && 'Sécuriser mon compte'}
              {step === 3 && 'Ma boutique'}
            </h2>
            <p>
              {step === 1 && 'Renseignez vos informations personnelles.'}
              {step === 2 && 'Choisissez un mot de passe sécurisé.'}
              {step === 3 && 'Donnez un nom à votre boutique.'}
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="signup-error is-visible" role="alert" aria-live="assertive">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
              {error}
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit} noValidate style={{ marginTop: 'var(--space-4)' }}>

            {/* Étape 1 — Identité */}
            {step === 1 && (
              <>
                <div className="form-row">
                  <label htmlFor="reg-firstname">
                    Prénom
                    <input id="reg-firstname" type="text" placeholder="Marie" value={form.firstName} onChange={set('firstName')} required disabled={loading} autoFocus />
                  </label>
                  <label htmlFor="reg-lastname">
                    Nom
                    <input id="reg-lastname" type="text" placeholder="Mbeki" value={form.lastName} onChange={set('lastName')} required disabled={loading} />
                  </label>
                </div>
                <label htmlFor="reg-email">
                  Adresse e-mail
                  <input id="reg-email" type="email" placeholder="marie@maboutique.com" value={form.email} onChange={set('email')} required autoComplete="email" disabled={loading} />
                </label>
                <label htmlFor="reg-phone">
                  Téléphone <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optionnel)</span>
                  <input id="reg-phone" type="tel" placeholder="+243 81 234 5678" value={form.phone} onChange={set('phone')} disabled={loading} />
                </label>
              </>
            )}

            {/* Étape 2 — Mot de passe */}
            {step === 2 && (
              <>
                <label htmlFor="reg-password">
                  Mot de passe
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="8 car. min · Majuscule + chiffre"
                      value={form.password}
                      onChange={set('password')}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      disabled={loading}
                      style={{ paddingRight: 44 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? 'Masquer' : 'Afficher'}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 4, fontSize: 16 }}
                    >
                      <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                    </button>
                  </div>
                </label>
                {/* Force indicator */}
                {form.password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: -8 }}>
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: form.password.length >= lvl * 2
                          ? lvl <= 2 ? 'var(--color-warning)' : 'var(--color-success)'
                          : 'var(--color-border)',
                        transition: 'background var(--duration-base)',
                      }} aria-hidden="true" />
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.
                </p>
              </>
            )}

            {/* Étape 3 — Boutique */}
            {step === 3 && (
              <>
                <label htmlFor="reg-shopname">
                  Nom de votre boutique
                  <input id="reg-shopname" type="text" placeholder="Ex. : Boutique Élégance" value={form.shopName} onChange={set('shopName')} disabled={loading} autoFocus />
                </label>
                <label htmlFor="reg-city">
                  Votre ville
                  <input id="reg-city" type="text" placeholder="Kinshasa, Goma, Lubumbashi…" value={form.city} onChange={set('city')} disabled={loading} />
                </label>
                <div className="alert alert-info" style={{ fontSize: 'var(--text-xs)' }}>
                  <i className="bi bi-info-circle-fill" aria-hidden="true" />
                  <span>Vous pourrez personnaliser votre boutique depuis votre tableau de bord après l&apos;inscription.</span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              {step > 1 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  style={{ flex: '0 0 auto' }}
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" /> Retour
                </button>
              )}
              <button
                type="submit"
                className={`btn primary signup-submit${loading ? ' loading' : ''}`}
                disabled={loading}
                aria-busy={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Inscription…' : step < 3 ? (
                  <>Continuer <i className="bi bi-arrow-right" aria-hidden="true" /></>
                ) : (
                  <><i className="bi bi-person-plus" aria-hidden="true" /> Créer mon espace commerçant</>
                )}
              </button>
            </div>
          </form>

          <div className="signup-footer">
            <span>Vous avez déjà un compte ?</span>
            <Link href="/login">Se connecter</Link>
          </div>

          <p className="signup-note">
            En vous inscrivant, vous acceptez nos{' '}
            <a href="#" style={{ color: 'var(--color-primary-text)' }}>conditions d&apos;utilisation</a>{' '}
            et notre{' '}
            <a href="#" style={{ color: 'var(--color-primary-text)' }}>politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
