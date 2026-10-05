import Link from 'next/link';
import Topbar from '../components/Topbar';
import { fetchPublicApi } from '@/lib/api';

type Shop = {
  id: string;
  name: string;
  slug: string;
  slogan: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
  branding?: {
    primary?: string;
    secondary?: string;
    radius?: string;
    imageFit?: string;
    logoShape?: string;
    cardStyle?: string;
  };
};

function getShopInitial(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default async function ShopsPage() {
  let shops: Shop[] = [];
  let error: string | null = null;

  try {
    shops = await fetchPublicApi<Shop[]>('/api/v1/shops');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Impossible de charger les boutiques.';
  }

  return (
    <div className="app public-app">
      <Topbar activeNav="shops" />

      <main className="content">
        <section className="section home-shops">
          <div className="section-head">
            <div>
              <span className="home-section-eyebrow">Les commerçants d&apos;ici</span>
              <h2>Boutiques à découvrir</h2>
              <p>Rencontrez les boutiques locales et trouvez votre prochain coup de cœur.</p>
            </div>
            <span className="home-shop-total">
              <i className="bi bi-shop-window" aria-hidden="true" /> {shops.length} boutiques
            </span>
          </div>

          {error ? (
            <div className="state-box">
              <i className="bi bi-exclamation-triangle" style={{ fontSize: 32, color: 'var(--color-danger)', marginBottom: 12, display: 'block' }} />
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6 }}>Erreur de chargement</strong>
              <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          ) : (
            <div className="home-shop-grid">
              {shops.length === 0 ? (
                <div className="state-box" style={{ gridColumn: '1 / -1' }}>
                  <i className="bi bi-shop" style={{ fontSize: 32, color: 'var(--color-text-disabled)', marginBottom: 12, display: 'block' }} />
                  <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6 }}>Aucune boutique publiée</strong>
                  <p style={{ margin: 0, fontSize: 13 }}>Les boutiques apparaîtront ici dès leur activation.</p>
                </div>
              ) : (
                shops.map((shop) => {
                  const coverImg = shop.coverUrl;
                  const logoImg = shop.logoUrl;
                  const shopColor = shop.branding?.primary || '#286b50';
                  
                  return (
                    <article key={shop.id} className="home-shop-card" style={{ ['--shop-accent' as string]: shopColor }}>
                      <div className="home-shop-media">
                        {coverImg && (
                          <img src={coverImg} alt={`Couverture de ${shop.name}`} loading="lazy" />
                        )}
                        <span className="home-shop-location">
                          <i className="bi bi-geo-alt-fill" aria-hidden="true" /> {shop.city ?? 'RDC'}
                        </span>
                        <span className="home-shop-logo">
                          {logoImg ? (
                            <img src={logoImg} alt={`Logo de ${shop.name}`} />
                          ) : (
                            <i className="bi bi-shop" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                      <div className="home-shop-content">
                        <div className="home-shop-heading">
                          <h3>{shop.name}</h3>
                        </div>
                        <p>{shop.slogan ?? shop.description ?? 'Une boutique locale à découvrir.'}</p>
                        <div className="home-shop-bottom">
                          <div className="home-shop-tags">
                            <span>{getShopInitial(shop.name)}</span>
                          </div>
                          <Link href={`/shops/${shop.id}`} className="home-shop-link">
                            Découvrir <i className="bi bi-arrow-up-right" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Navigation mobile">
        <Link href="/">
          <i className="bi bi-house-fill" aria-hidden="true" />
          <span>Accueil</span>
        </Link>
        <Link href="/products">
          <i className="bi bi-grid" aria-hidden="true" />
          <span>Produits</span>
        </Link>
        <Link href="/shops" className="active" aria-current="page">
          <i className="bi bi-shop" aria-hidden="true" />
          <span>Boutiques</span>
        </Link>
        <Link href="/login">
          <i className="bi bi-person-circle" aria-hidden="true" />
          <span>Marchand</span>
        </Link>
      </nav>
    </div>
  );
}
