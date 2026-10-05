import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System — MarketNet',
  description: 'Référence vivante du design system MarketNet : tokens, composants, patterns.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--fw-bold)',
        color: 'var(--color-text)',
        paddingBottom: 'var(--space-3)',
        borderBottom: 'var(--border)',
        marginBottom: 'var(--space-6)',
        letterSpacing: 'var(--ls-snug)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TokenSwatch({ name, bg, text }: { name: string; bg: string; text?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        height: 56,
        borderRadius: 'var(--radius-md)',
        background: bg,
        border: 'var(--border)',
        marginBottom: 'var(--space-2)',
      }} />
      <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontWeight: 'var(--fw-semi)' }}>{name}</div>
      {text && <div style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{text}</div>}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-8) var(--space-5) var(--space-16)' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <Link href="/" style={{ color: 'var(--color-primary-text)', fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
          <i className="bi bi-arrow-left" aria-hidden="true" /> Retour à l&apos;accueil
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--fw-extra)', letterSpacing: 'var(--ls-tight)', margin: 0 }}>
              MarketNet Design System
            </h1>
            <p style={{ color: 'var(--color-text-3)', margin: '8px 0 0' }}>
              Référence vivante · V2.0 · Octobre 2026
            </p>
          </div>
          <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: 'var(--text-sm)' }}>
            <i className="bi bi-circle-fill" style={{ fontSize: 7 }} aria-hidden="true" />
            Actif
          </span>
        </div>
      </div>

      {/* ── 1. Couleurs ── */}
      <Section title="1 · Couleurs">
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>

          {/* Brand Emerald */}
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-3)' }}>
              Brand Primary — Émeraude
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 'var(--space-2)' }}>
              {[50,100,200,300,400,500,600,700,800,900].map(n => (
                <TokenSwatch key={n} name={`${n}`} bg={`var(--emerald-${n})`} />
              ))}
            </div>
          </div>

          {/* Accent Amber */}
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-3)' }}>
              Brand Accent — Ambre
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 'var(--space-2)' }}>
              {[50,100,200,300,400,500,600,700,800,900].map(n => (
                <TokenSwatch key={n} name={`${n}`} bg={`var(--amber-${n})`} />
              ))}
            </div>
          </div>

          {/* Alias sémantiques */}
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-3)' }}>
              Alias sémantiques (s&apos;adaptent au thème)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
              <TokenSwatch name="--color-bg" bg="var(--color-bg)" text="Fond page" />
              <TokenSwatch name="--color-surface" bg="var(--color-surface)" text="Fond carte" />
              <TokenSwatch name="--color-surface-2" bg="var(--color-surface-2)" text="Fond subtil" />
              <TokenSwatch name="--color-border" bg="var(--color-border)" text="Bordures" />
              <TokenSwatch name="--color-primary" bg="var(--color-primary)" text="Primaire" />
              <TokenSwatch name="--color-primary-muted" bg="var(--color-primary-muted)" text="Primaire atténué" />
              <TokenSwatch name="--color-accent" bg="var(--color-accent)" text="Accent" />
              <TokenSwatch name="--color-success" bg="var(--color-success)" text="Succès" />
              <TokenSwatch name="--color-warning" bg="var(--color-warning)" text="Alerte" />
              <TokenSwatch name="--color-danger" bg="var(--color-danger)" text="Erreur" />
              <TokenSwatch name="--color-info" bg="var(--color-info)" text="Info" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Typographie ── */}
      <Section title="2 · Typographie">
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {[
            { label: 'text-5xl · 60px', size: 'var(--text-5xl)', fw: 'var(--fw-extra)', family: 'var(--font-display)', text: 'MarketNet' },
            { label: 'text-4xl · 48px', size: 'var(--text-4xl)', fw: 'var(--fw-extra)', family: 'var(--font-display)', text: 'Votre boutique locale' },
            { label: 'text-3xl · 36px', size: 'var(--text-3xl)', fw: 'var(--fw-bold)', family: 'var(--font-display)', text: 'Produits à découvrir' },
            { label: 'text-2xl · 30px', size: 'var(--text-2xl)', fw: 'var(--fw-bold)', family: 'var(--font-display)', text: 'Tableau de bord' },
            { label: 'text-xl · 24px',  size: 'var(--text-xl)',  fw: 'var(--fw-bold)', family: 'var(--font-display)', text: 'Mes produits' },
            { label: 'text-lg · 20px',  size: 'var(--text-lg)',  fw: 'var(--fw-semi)', family: 'var(--font-body)', text: 'Accès rapide' },
            { label: 'text-base · 16px', size: 'var(--text-base)', fw: 'var(--fw-normal)', family: 'var(--font-body)', text: 'Texte de contenu principal. MarketNet connecte les commerçants locaux avec leurs clients.' },
            { label: 'text-sm · 14px',  size: 'var(--text-sm)',  fw: 'var(--fw-normal)', family: 'var(--font-body)', text: 'Texte secondaire, labels de formulaire et descriptions.' },
            { label: 'text-xs · 12px',  size: 'var(--text-xs)',  fw: 'var(--fw-normal)', family: 'var(--font-body)', text: 'Métadonnées, badges, timestamps et eyebrows.' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)', padding: 'var(--space-3)', borderBottom: 'var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-disabled)', minWidth: 120, fontFamily: 'monospace' }}>{t.label}</span>
              <span style={{ fontSize: t.size, fontWeight: t.fw, fontFamily: t.family, lineHeight: 1.2, color: 'var(--color-text)' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 3. Boutons ── */}
      <Section title="3 · Boutons">
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>

          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-4)' }}>
              Variantes
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn primary">Primary</button>
              <button className="btn">Secondary</button>
              <button className="btn accent">Accent</button>
              <button className="btn success">Success</button>
              <button className="btn danger">Danger</button>
              <button className="btn ghost">Ghost</button>
              <button className="btn" disabled>Disabled</button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-4)' }}>
              Tailles
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn primary sm">Small</button>
              <button className="btn primary">Medium (défaut)</button>
              <button className="btn primary lg">Large</button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', marginBottom: 'var(--space-4)' }}>
              Avec icône · État loading
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn primary">
                <i className="bi bi-plus-lg" aria-hidden="true" /> Ajouter un produit
              </button>
              <button className="btn success">
                <i className="bi bi-whatsapp" aria-hidden="true" /> WhatsApp
              </button>
              <button className="btn primary loading" disabled aria-busy="true">
                Chargement…
              </button>
              <button className="btn icon-only" aria-label="Modifier">
                <i className="bi bi-pencil" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. Badges ── */}
      <Section title="4 · Badges & Statuts">
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge badge-primary">Primaire</span>
          <span className="badge badge-accent">Accent</span>
          <span className="badge badge-success"><span className="badge-dot success" aria-hidden="true" />En ligne</span>
          <span className="badge badge-warning"><span className="badge-dot warning" aria-hidden="true" />En attente</span>
          <span className="badge badge-danger">Rupture</span>
          <span className="badge badge-info">Info</span>
          <span className="badge badge-neutral">Hors ligne</span>
          <span className="tag">Catégorie</span>
          <span className="status live"><span className="badge-dot success" aria-hidden="true" />En ligne</span>
          <span className="status hidden"><span className="badge-dot neutral" aria-hidden="true" />Hors ligne</span>
          <span className="status draft"><span className="badge-dot warning" aria-hidden="true" />Brouillon</span>
        </div>
      </Section>

      {/* ── 5. Formulaires ── */}
      <Section title="5 · Formulaires">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          <label className="form-label">
            Nom de la boutique
            <input className="form-input" type="text" placeholder="Ex. : Boutique Élégance" />
            <span className="form-hint">Ce nom sera visible par vos clients.</span>
          </label>
          <label className="form-label">
            Champ en erreur
            <input className="form-input error" type="text" defaultValue="valeur incorrecte" aria-invalid="true" />
            <span className="form-error"><i className="bi bi-exclamation-circle" aria-hidden="true" />Ce champ est obligatoire.</span>
          </label>
          <label className="form-label">
            Prix (FC)
            <input className="form-input" type="number" placeholder="0" />
          </label>
          <div className="search-field">
            <i className="bi bi-search" aria-hidden="true" />
            <input type="search" placeholder="Rechercher un produit…" aria-label="Recherche" />
          </div>
          <label className="form-label">
            Zone d&apos;upload
            <div className="upload-zone" role="button" tabIndex={0} aria-label="Importer une image">
              <i className="bi bi-image" aria-hidden="true" />
              <span>Glisser-déposer ou cliquer</span>
            </div>
          </label>
          <label className="form-label">
            Description
            <textarea className="form-textarea" placeholder="Décrivez votre produit…" />
          </label>
        </div>
      </Section>

      {/* ── 6. KPI Cards ── */}
      <Section title="6 · KPI Cards">
        <div className="kpis">
          {[
            { label: 'Produits', value: '124', icon: 'bi-box-seam', delta: '+12 ce mois', up: true },
            { label: 'En ligne',  value: '98',  icon: 'bi-eye',     delta: '79% du catalogue', up: true },
            { label: 'Visites',   value: '2 847', icon: 'bi-graph-up', delta: '+18% cette semaine', up: true },
            { label: 'WhatsApp',  value: '341', icon: 'bi-whatsapp', delta: '-3 aujourd\'hui', up: false },
          ].map(k => (
            <div key={k.label} className="kpi">
              <span className="kpi-label">{k.label}</span>
              <strong className="kpi-value">{k.value}</strong>
              <div className={`kpi-delta ${k.up ? 'up' : 'down'}`}>
                <i className={`bi ${k.up ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`} aria-hidden="true" />
                {k.delta}
              </div>
              <div className="kpi-icon" aria-hidden="true"><i className={`bi ${k.icon}`} /></div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7. Alerts ── */}
      <Section title="7 · Alertes">
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div className="alert alert-success"><i className="bi bi-check-circle-fill" aria-hidden="true" /><span><strong>Succès :</strong> Votre produit a été publié avec succès.</span></div>
          <div className="alert alert-info"><i className="bi bi-info-circle-fill" aria-hidden="true" /><span><strong>Info :</strong> Une mise à jour de MarketNet est disponible.</span></div>
          <div className="alert alert-warning"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /><span><strong>Attention :</strong> Votre stock est inférieur à 5 unités.</span></div>
          <div className="alert alert-error"><i className="bi bi-x-circle-fill" aria-hidden="true" /><span><strong>Erreur :</strong> Impossible de sauvegarder. Vérifiez votre connexion.</span></div>
        </div>
      </Section>

      {/* ── 8. Skeleton ── */}
      <Section title="8 · Skeleton Loaders">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
              <div className="skeleton skeleton-image" style={{ height: 140 }} />
              <div className="skeleton skeleton-title" style={{ width: '70%' }} />
              <div className="skeleton skeleton-text" style={{ width: '90%' }} />
              <div className="skeleton skeleton-text" style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 9. États vides ── */}
      <Section title="9 · États vides">
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-box-seam" aria-hidden="true" />
            </div>
            <p className="empty-state-title">Aucun produit</p>
            <p className="empty-state-desc">
              Commencez par ajouter votre premier produit pour remplir votre boutique.
            </p>
            <button className="btn primary">
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Ajouter un produit
            </button>
          </div>
        </div>
      </Section>

      {/* ── 10. Radius & Shadows ── */}
      <Section title="10 · Radius & Ombres">
        <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { name: 'xs · 4px',  r: 'var(--radius-xs)',  s: 'var(--shadow-xs)' },
            { name: 'sm · 8px',  r: 'var(--radius-sm)',  s: 'var(--shadow-sm)' },
            { name: 'md · 12px', r: 'var(--radius-md)',  s: 'var(--shadow-md)' },
            { name: 'lg · 16px', r: 'var(--radius-lg)',  s: 'var(--shadow-lg)' },
            { name: 'xl · 20px', r: 'var(--radius-xl)',  s: 'var(--shadow-xl)' },
            { name: '2xl · 24px', r: 'var(--radius-2xl)', s: 'var(--shadow-xl)' },
          ].map(({ name, r, s }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90,
                background: 'var(--color-surface)',
                borderRadius: r,
                boxShadow: s,
                border: 'var(--border)',
              }} />
              <div style={{ marginTop: 'var(--space-2)', fontSize: 10, color: 'var(--color-text-3)' }}>{name}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 11. Tokens animation ── */}
      <Section title="11 · Tokens Durée & Mouvement">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { name: '--duration-fast',   val: '120ms', note: 'micro-interactions' },
            { name: '--duration-base',   val: '180ms', note: 'transitions standard' },
            { name: '--duration-slow',   val: '280ms', note: 'modales, drawers' },
            { name: '--duration-slower', val: '400ms', note: 'animations complexes' },
          ].map(d => (
            <div key={d.name} className="panel" style={{ padding: 'var(--space-3)' }}>
              <code style={{ fontSize: 11, color: 'var(--color-primary-text)', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>{d.name}</code>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extra)', color: 'var(--color-text)' }}>{d.val}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>{d.note}</div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
