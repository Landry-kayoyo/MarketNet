import Link from 'next/link';
import { notFound } from 'next/navigation';
import Topbar from '../../components/Topbar';
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

type Product = {
  id: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  images?: { url: string; isPrimary: boolean }[];
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0
  }).format(cents);

export default async function ShopDetailPage({ params }: { params: { id: string } }) {
  let shop: Shop | null = null;
  let products: Product[] = [];

  try {
    shop = await fetchPublicApi<Shop>(`/api/v1/shops/${params.id}`);
    products = await fetchPublicApi<Product[]>('/api/v1/products');
  } catch {
    notFound();
  }

  if (!shop) {
    notFound();
  }

  const shopProducts = products.filter((product) => product.shopId === shop.id && product.isPublished);
  
  const b = shop.branding || {};
  const primaryColor = b.primary || '#286b50';
  const secondaryColor = b.secondary || '#182b24';

  return (
    <div className="app public-app store-app">
      <header className="topbar">
        <Link href="/shops" className="btn">
          <i className="bi bi-arrow-left" />
        </Link>
        <button className="brand brand-btn">MarketNet</button>
        <nav className="public-nav">
          <button style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary-text)' }}>Boutique</button>
          <button>Produits</button>
          <button>À propos</button>
        </nav>
        <div className="top-actions">
          <button className="btn primary">
            <i className="bi bi-person-circle" />
            <span className="label">Espace commerçant</span>
          </button>
        </div>
      </header>

      <main 
        className="content store-themed" 
        data-card-style={b.cardStyle || 'soft'}
        style={{
          ['--shop-primary' as string]: primaryColor,
          ['--shop-secondary' as string]: secondaryColor,
          ['--shop-radius' as string]: b.radius || '17px',
          ['--shop-image-fit' as string]: b.imageFit || 'cover',
          ['--shop-logo-radius' as string]: b.logoShape === 'round' ? '50%' : b.logoShape === 'square' ? '8px' : '19px'
        }}
      >
        <section 
          className={`store-cover ${shop.coverUrl ? 'has-real-cover' : ''}`}
          style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}cc, ${secondaryColor}cc)` }}
        >
          {shop.coverUrl && (
            <>
              <div className="store-cover-media-backdrop" style={{ backgroundImage: `url(${shop.coverUrl})` }}></div>
              <img className="store-cover-media-main" src={shop.coverUrl} alt={`Couverture de ${shop.name}`} />
            </>
          )}
          <div className="store-cover-content">
            <div className="store-brand">
              <div className="store-logo">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt="Logo" />
                ) : (
                  <i className="bi bi-shop" />
                )}
              </div>
              <div>
                <h1>{shop.name}</h1>
                <p>{shop.slogan || 'Bienvenue dans notre boutique.'}</p>
                <small>marketnet.net/{shop.slug}</small>
              </div>
            </div>
            {shop.whatsapp && (
              <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn success">
                <i className="bi bi-whatsapp" /> Contacter
              </a>
            )}
          </div>
        </section>

        <div className="store-meta">
          <div>
            <i className="bi bi-box-seam store-meta-icon" />
            <strong>{shopProducts.length}</strong>
            <span>Produits</span>
          </div>
          <div>
            <i className="bi bi-grid store-meta-icon" />
            <strong>...</strong>
            <span>Catégories</span>
          </div>
          <div>
            <i className="bi bi-star-fill store-meta-icon" />
            <strong>★ 4.8</strong>
            <span>Avis</span>
          </div>
          <div>
            <i className="bi bi-geo-alt-fill store-meta-icon" />
            <strong>{shop.city || 'RDC'}</strong>
            <span>Localisation</span>
          </div>
        </div>

        <div className="store-toolbar">
          <div className="store-search">
            <i className="bi bi-search" />
            <input placeholder="Rechercher dans cette boutique..." />
          </div>
          <div className="pills">
            <button className="btn primary">Tous</button>
          </div>
        </div>

        <section id="storeProducts">
          <div className="section-head">
            <div>
              <span className="store-section-kicker">LA SÉLECTION</span>
              <h2>Nos produits</h2>
              <p>La sélection de {shop.name}.</p>
            </div>
          </div>
          <div className="store-products">
            {shopProducts.length === 0 ? (
              <div className="state-box" style={{ gridColumn: '1 / -1' }}>
                Cette boutique n’a pas encore de produits.
              </div>
            ) : (
              shopProducts.map((product) => {
                const imgSrc = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
                return (
                  <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <article className="product-card">
                      <div className="product-media" style={imgSrc ? { ['--media-bg' as string]: `url(${imgSrc})` } : {}}>
                        {imgSrc ? (
                          <img src={imgSrc} alt={product.name} loading="lazy" />
                        ) : (
                          <i className="bi bi-image" style={{ fontSize: 32, color: 'var(--color-text-disabled)' }} />
                        )}
                      </div>
                      <div className="product-body">
                        <span className="tag">Produit</span>
                        <h3>{product.name}</h3>
                        <div className="price">{formatPrice(product.priceCents)}</div>
                        <button className="btn store-product-action" style={{ width: '100%' }}>Voir le produit</button>
                      </div>
                    </article>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section id="aboutStore" className="store-about">
          <div className="panel">
            <span className="tag">À PROPOS</span>
            <h2>{shop.name}</h2>
            <p className="muted">{shop.description || 'Une boutique locale sur MarketNet.'}</p>
          </div>
          <div className="contact-card">
            <strong>Une question ?</strong>
            <p className="muted">Le contact WhatsApp reste accessible sans masquer le contenu.</p>
            {shop.whatsapp ? (
              <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn success" style={{ width: '100%' }}>
                <i className="bi bi-whatsapp" /> WhatsApp
              </a>
            ) : (
              <button className="btn success" style={{ width: '100%' }} disabled>
                <i className="bi bi-whatsapp" /> WhatsApp non renseigné
              </button>
            )}
          </div>
        </section>

        <footer className="store-footer">
          <div>
            <strong>{shop.name}</strong>
            <div style={{ opacity: .7, marginTop: 4 }}>{shop.description || 'Boutique locale MarketNet.'}</div>
          </div>
          <div className="actions" style={{ display: 'flex', gap: 8 }}>
            <button className="btn">
              <i className="bi bi-share" /> Partager
            </button>
            {shop.whatsapp && (
              <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn success">
                <i className="bi bi-whatsapp" /> Contacter
              </a>
            )}
          </div>
        </footer>
      </main>

      {shop.whatsapp && (
        <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="whatsapp-float">
          <i className="bi bi-whatsapp" /><span>WhatsApp</span>
        </a>
      )}

      <nav className="mobile-nav store-mobile-nav" aria-label="Navigation de la boutique">
        <button className="active">
          <i className="bi bi-shop-window" />
          <span>Boutique</span>
        </button>
        <button>
          <i className="bi bi-grid" />
          <span>Produits</span>
        </button>
        <button>
          <i className="bi bi-info-circle" />
          <span>À propos</span>
        </button>
        <button className="store-nav-contact">
          <i className="bi bi-whatsapp" />
          <span>WhatsApp</span>
        </button>
      </nav>
    </div>
  );
}
