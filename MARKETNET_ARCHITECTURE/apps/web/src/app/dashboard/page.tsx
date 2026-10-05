import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord — MarketNet',
  description: 'Gérez votre boutique, vos produits et vos commandes depuis votre espace commerçant.',
};

const MOCK_PRODUCTS = [
  { name: 'Robe Élégance',   price: '45 000 FC', stock: 12, status: 'live' as const },
  { name: 'Sac Premium',     price: '35 000 FC', stock: 7,  status: 'live' as const },
  { name: 'Chaussures Cuir', price: '28 500 FC', stock: 3,  status: 'live' as const },
  { name: 'Montre Classic',  price: '62 000 FC', stock: 0,  status: 'hidden' as const },
];

const MOCK_MESSAGES = [
  { initials: 'AK', name: 'Aisha Kamara',  text: 'Je voudrais commander la robe rouge…', time: '2 min', color: '' },
  { initials: 'FM', name: 'Fatou M.',       text: 'Le sac est-il disponible en noir ?',   time: '15 min', color: 'var(--amber-100)' },
];

const KPI_DATA = [
  { label: 'Produits', value: '12', icon: 'bi-box-seam',  delta: '+2 ce mois', up: true },
  { label: 'En ligne',  value: '10', icon: 'bi-eye',       delta: '83% du catalogue', up: true },
  { label: 'Visites',   value: '184', icon: 'bi-graph-up', delta: '+24 cette semaine', up: true },
  { label: 'WhatsApp',  value: '37', icon: 'bi-whatsapp',  delta: '+8 aujourd\'hui', up: true },
];

export default function DashboardHomePage() {
  return (
    <>
      {/* ── En-tête ── */}
      <div className="page-head dashboard-head">
        <div>
          <h1>Bonjour</h1>
          <p>Ma Boutique · votre activité en un coup d&apos;œil.</p>
        </div>
        <Link href="/dashboard/products" className="btn primary">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          <span>Ajouter un produit</span>
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis" role="region" aria-label="Indicateurs clés">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.label} className="kpi">
            <span className="kpi-label">{kpi.label}</span>
            <strong className="kpi-value">{kpi.value}</strong>
            <div className={`kpi-delta ${kpi.up ? 'up' : 'down'}`}>
              <i className={`bi ${kpi.up ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`} aria-hidden="true" />
              {kpi.delta}
            </div>
            <div className="kpi-icon" aria-hidden="true">
              <i className={`bi ${kpi.icon}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Grille principale ── */}
      <div className="dash-grid">

        {/* Produits récents */}
        <section className="panel" aria-labelledby="recent-products-title">
          <div className="head">
            <div>
              <h3 id="recent-products-title">Produits récents</h3>
              <p>Les derniers articles de votre catalogue.</p>
            </div>
            <Link href="/dashboard/products" className="btn sm">
              Voir tout <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Produit</th>
                  <th scope="col">Prix</th>
                  <th scope="col">Stock</th>
                  <th scope="col">État</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PRODUCTS.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <strong style={{ color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                        {p.name}
                      </strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text)' }}>
                      {p.price}
                    </td>
                    <td>
                      <span style={{
                        color: p.stock === 0 ? 'var(--color-danger-text)' : p.stock < 5 ? 'var(--color-warning-text)' : 'var(--color-text-2)',
                        fontWeight: 'var(--fw-semi)',
                      }}>
                        {p.stock === 0 ? '— Rupture' : p.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${p.status}`}>
                        <span className={`badge-dot ${p.status === 'live' ? 'success' : 'neutral'}`} aria-hidden="true" />
                        {p.status === 'live' ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn sm ghost icon-only"
                        aria-label={`Modifier ${p.name}`}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Accès rapide + Messages */}
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>

          {/* Accès rapide */}
          <section className="panel" aria-labelledby="quick-access-title">
            <div className="head">
              <div>
                <h3 id="quick-access-title">Accès rapide</h3>
                <p>Navigation essentielle.</p>
              </div>
            </div>
            <div className="quick-actions">
              <Link href="/dashboard/messages" className="btn">
                <i className="bi bi-chat-dots" aria-hidden="true" />
                Messages
              </Link>
              <Link href="/dashboard/orders" className="btn">
                <i className="bi bi-bag-check" aria-hidden="true" />
                Commandes
              </Link>
              <Link href="/dashboard/shop" className="btn">
                <i className="bi bi-palette" aria-hidden="true" />
                Ma boutique
              </Link>
              <button className="btn" disabled>
                <i className="bi bi-bar-chart" aria-hidden="true" />
                Analyses
              </button>
            </div>
          </section>

          {/* Messages récents */}
          <section className="panel" aria-labelledby="messages-title">
            <div className="head">
              <div>
                <h3 id="messages-title">Messages récents</h3>
                <p>Demandes de vos clients.</p>
              </div>
              <Link href="/dashboard/messages" className="btn sm">
                Voir tout
              </Link>
            </div>
            <div role="list">
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.name} className="message" role="listitem">
                  <div
                    className="avatar"
                    style={msg.color ? { background: msg.color, color: 'var(--color-warning-text)' } : {}}
                    aria-hidden="true"
                  >
                    {msg.initials}
                  </div>
                  <div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                      {msg.name}
                    </strong>
                    <p style={{ margin: '3px 0 0' }}>{msg.text}</p>
                  </div>
                  <time
                    style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}
                    dateTime="2026-10-05"
                  >
                    {msg.time}
                  </time>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
