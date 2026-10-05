import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ma boutique — MarketNet',
  description: 'Personnalisez l\'apparence et les informations de votre vitrine MarketNet.',
};

export default function DashboardShopPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <span className="merchant-page-eyebrow">Personnalisation</span>
          <h1>Ma boutique</h1>
          <p>Personnalisez l&apos;apparence de votre vitrine.</p>
        </div>
        <button className="btn primary" type="button">
          <i className="bi bi-check-lg" aria-hidden="true" /> Enregistrer
        </button>
      </div>

      <div className="builder-v26">
        <section aria-labelledby="shop-settings-title">
          <h2 id="shop-settings-title" className="sr-only">Paramètres de la boutique</h2>

          {/* Informations générales */}
          <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="head">
              <div>
                <h3>Informations générales</h3>
                <p>Nom, slogan et description de votre boutique.</p>
              </div>
            </div>
            <div className="form">
              <label>
                Nom de la boutique
                <input type="text" defaultValue="Ma Boutique" placeholder="Ex. : Boutique Élégance" />
              </label>
              <label>
                Slogan
                <input type="text" placeholder="Qualité et confiance depuis 2020" />
              </label>
              <label>
                Description
                <textarea placeholder="Décrivez votre boutique en quelques phrases pour attirer vos clients…" />
              </label>
              <div className="form-grid">
                <label>
                  Ville
                  <input type="text" placeholder="Kinshasa" />
                </label>
                <label>
                  Pays
                  <input type="text" placeholder="RDC" />
                </label>
              </div>
            </div>
          </div>

          {/* Médias */}
          <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="head">
              <div>
                <h3>Médias</h3>
                <p>Logo et bannière de couverture de votre vitrine.</p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Logo (format carré)
                <div
                  className="upload-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Cliquer pour importer votre logo"
                >
                  <i className="bi bi-image" aria-hidden="true" />
                  <span>Cliquer pour importer</span>
                  <small style={{ fontSize: 10, marginTop: 4, color: 'var(--color-text-disabled)' }}>
                    PNG, JPG · max 2 Mo
                  </small>
                </div>
              </label>
              <label>
                Bannière de couverture
                <div
                  className="upload-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Cliquer pour importer votre bannière"
                >
                  <i className="bi bi-panorama" aria-hidden="true" />
                  <span>Cliquer pour importer</span>
                  <small style={{ fontSize: 10, marginTop: 4, color: 'var(--color-text-disabled)' }}>
                    PNG, JPG · 1600×400 recommandé
                  </small>
                </div>
              </label>
            </div>
          </div>

          {/* Contact */}
          <div className="panel">
            <div className="head">
              <div>
                <h3>Contact & réseaux</h3>
                <p>Comment vos clients peuvent vous joindre.</p>
              </div>
            </div>
            <div className="form">
              <label>
                Numéro WhatsApp
                <input type="tel" placeholder="+243 81 234 5678" />
              </label>
              <label>
                Adresse physique (optionnel)
                <input type="text" placeholder="Avenue du Commerce, Kinshasa" />
              </label>
            </div>
          </div>
        </section>

        {/* Aperçu live */}
        <aside aria-label="Aperçu de votre vitrine">
          <div
            className="live-preview"
            role="img"
            aria-label="Aperçu de votre boutique telle qu'elle apparaît aux clients"
          >
            <div
              className="live-preview-cover"
              style={{ background: 'linear-gradient(145deg, var(--stone-800), var(--emerald-800))' }}
            >
              <div
                className="live-preview-logo"
                style={{
                  background: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'var(--fw-extra)',
                  fontSize: 18,
                }}
                aria-hidden="true"
              >
                MB
              </div>
              <span className="live-preview-name">Ma Boutique</span>
            </div>
            <div className="live-preview-body">
              <h3>Ma Boutique</h3>
              <p style={{ margin: '4px 0 0' }}>Qualité et confiance depuis 2020</p>
              <div className="preview-products" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => <span key={i} />)}
              </div>
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-subtle)',
                border: 'var(--border)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <i className="bi bi-eye" aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                Aperçu en temps réel
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
