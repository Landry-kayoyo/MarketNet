import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublicApi } from '@/lib/api';
import ScrollReveal from '../../components/ScrollReveal';
import ShopTopbar from '../../components/ShopTopbar';
import ShopShareButton from '../../components/ShopShareButton';

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
    accent?: string;
    radius?: string;
    imageFit?: string;
    logoShape?: string;
    cardStyle?: string;
    fontStyle?: string;
  };
};

type Product = {
  id: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
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
    maximumFractionDigits: 0,
  }).format(cents / 100);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const shop = await fetchPublicApi<Shop>(`/api/v1/shops/${id}`);
    return {
      title: `${shop.name} — MarketNet`,
      description: shop.slogan ?? shop.description ?? `Découvrez ${shop.name} sur MarketNet.`,
    };
  } catch {
    return { title: 'Boutique — MarketNet' };
  }
}

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let shop: Shop | null = null;
  let products: Product[] = [];

  try {
    shop = await fetchPublicApi<Shop>(`/api/v1/shops/${id}`);
    products = await fetchPublicApi<Product[]>('/api/v1/products');
  } catch {
    notFound();
  }

  if (!shop) notFound();

  const shopProducts = products.filter(
    (p) => p.shopId === shop!.id && p.isPublished && p.status === 'ACTIVE'
  );
  const featuredProducts = shopProducts.filter((p) => p.isFeatured);
  const inStockCount = shopProducts.filter((p) => p.stockQuantity > 0).length;
  const b = shop.branding || {};
  const primaryColor = b.primary || '#286b50';
  const secondaryColor = b.secondary || '#182b24';
  const waLink = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div
      className="shop-page"
      data-card-style={b.cardStyle || 'soft'}
      data-font-style={b.fontStyle || 'modern'}
      style={{
        ['--shop-primary' as string]: primaryColor,
        ['--shop-secondary' as string]: secondaryColor,
        ['--shop-accent' as string]: b.accent || '#d6a84f',
        ['--shop-radius' as string]: b.radius || '16px',
        ['--shop-image-fit' as string]: b.imageFit || 'cover',
        ['--shop-logo-radius' as string]: b.logoShape === 'round' || b.logoShape === '50%' ? '50%' : b.logoShape === 'square' || b.logoShape === '4px' ? '4px' : '16px',
      }}
    >
      <ScrollReveal />
      <ShopTopbar shopName={shop.name} logoUrl={shop.logoUrl} />

      {/* ── HERO ── */}
      <section className="shop-hero">
        <div
          className="shop-hero-bg"
          style={{
            backgroundImage: shop.coverUrl
              ? `url(${shop.coverUrl})`
              : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        />
        <div className="shop-hero-overlay" />

        {/* Floating product images */}
        {featuredProducts.slice(0, 3).map((p, i) => {
          const img = p.images?.find((x) => x.isPrimary)?.url ?? p.images?.[0]?.url;
          return img ? (
            <div
              key={p.id}
              className={`shop-hero-float shop-hero-float-${i}`}
              style={{ backgroundImage: `url(${img})` }}
              aria-hidden="true"
            />
          ) : null;
        })}

        <div className="shop-hero-content">
          {/* Logo */}
          <div className="shop-logo-wrap">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={`Logo ${shop.name}`} className="shop-logo-img" />
            ) : (
              <div className="shop-logo-placeholder">
                <i className="bi bi-shop" />
              </div>
            )}
            <span className="shop-online-badge">
              <span className="shop-online-dot" /> En ligne
            </span>
          </div>

          <div className="shop-hero-info">
            <h1>{shop.name}</h1>
            <p className="shop-hero-slogan">{shop.slogan ?? 'Boutique locale sur MarketNet'}</p>

            <div className="shop-hero-tags">
              {shop.city && (
                <span className="shop-tag">
                  <i className="bi bi-geo-alt-fill" /> {shop.city}
                </span>
              )}
              <span className="shop-tag">
                <i className="bi bi-box-seam" /> {shopProducts.length} {shopProducts.length === 1 ? 'produit' : 'produits'}
              </span>
              {waLink && (
                <span className="shop-tag">
                  <i className="bi bi-whatsapp" /> Contact direct
                </span>
              )}
            </div>

            <div className="shop-hero-ctas">
              <a href="#products" className="shop-cta-outline">
                <i className="bi bi-grid" /> Voir les produits
              </a>
              <a href="#about" className="shop-cta-outline">
                <i className="bi bi-info-circle" /> À propos
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="shop-stats-bar">
          <div className="shop-stat">
            <strong>{shopProducts.length}</strong>
            <span>Produits</span>
          </div>
          <div className="shop-stat-divider" />
          <div className="shop-stat">
            <strong>{inStockCount}</strong>
            <span>En stock</span>
          </div>
          <div className="shop-stat-divider" />
          <div className="shop-stat">
            <strong>{featuredProducts.length}</strong>
            <span>Vedettes</span>
          </div>
          <div className="shop-stat-divider" />
          <div className="shop-stat">
            <strong>{shop.city ?? 'RDC'}</strong>
            <span>Ville</span>
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="shop-main">

        {/* Featured */}
        {featuredProducts.length > 0 && (
          <section className="shop-section" data-reveal>
            <div className="shop-section-head">
              <div>
                <span className="shop-eyebrow">⭐ Sélection</span>
                <h2>Produits vedettes</h2>
              </div>
            </div>
            <div className="shop-featured-grid">
              {featuredProducts.slice(0, 3).map((product) => {
                const img = product.images?.find((x) => x.isPrimary)?.url ?? product.images?.[0]?.url;
                return (
                  <Link key={product.id} href={`/products/${product.id}`} className="shop-featured-card">
                    <div
                      className="shop-featured-media"
                      style={{ backgroundImage: img ? `url(${img})` : undefined }}
                    >
                      {!img && <i className="bi bi-image" />}
                      <div className="shop-featured-overlay" />
                      <div className="shop-featured-body">
                        <h3>{product.name}</h3>
                        <div className="shop-featured-price">{formatPrice(product.priceCents)}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All products */}
        <section className="shop-section" id="products" data-reveal>
          <div className="shop-section-head">
            <div>
              <span className="shop-eyebrow">Catalogue</span>
              <h2>Tous les produits</h2>
            </div>
            <span className="shop-product-count">
              {shopProducts.length} {shopProducts.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {shopProducts.length === 0 ? (
            <div className="shop-empty-state">
              <i className="bi bi-box-seam" />
              <p>Cette boutique n&apos;a pas encore de produits publiés.</p>
            </div>
          ) : (
            <div className={`shop-products-grid${shopProducts.length === 1 ? ' is-single' : ''}`}>
              {shopProducts.map((product, i) => {
                const img = product.images?.find((x) => x.isPrimary)?.url ?? product.images?.[0]?.url;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="shop-product-card"
                    data-reveal
                    data-reveal-delay={String((i % 4) * 70)}
                  >
                    <div className="shop-product-media">
                      {img ? (
                        <img src={img} alt={product.name} loading="lazy" />
                      ) : (
                        <div className="shop-product-no-img">
                          <i className="bi bi-image" />
                        </div>
                      )}
                      {product.stockQuantity === 0 && (
                        <span className="shop-product-badge sold-out">Rupture</span>
                      )}
                      {product.isFeatured && product.stockQuantity > 0 && (
                        <span className="shop-product-badge featured">Vedette</span>
                      )}
                    </div>
                    <div className="shop-product-info">
                      <h3>{product.name}</h3>
                      {product.shortDescription && <p>{product.shortDescription}</p>}
                      <div className="shop-product-footer">
                        <span className="shop-product-price">{formatPrice(product.priceCents)}</span>
                        <span className="shop-product-arrow">
                          <i className="bi bi-arrow-up-right" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* About + Contact */}
        <section className="shop-section shop-about-section" id="about" data-reveal>
          <div className="shop-about-grid">
            <div className="shop-about-card">
              <span className="shop-eyebrow">À propos</span>
              <h2>{shop.name}</h2>
              <p>{shop.description ?? 'Une boutique locale de qualité sur MarketNet.'}</p>
              <div className="shop-info-list">
                {shop.city && (
                  <div className="shop-info-item">
                    <i className="bi bi-geo-alt-fill" />
                    <span>{shop.city}{shop.country ? `, ${shop.country}` : ''}</span>
                  </div>
                )}
                {shop.address && (
                  <div className="shop-info-item">
                    <i className="bi bi-map" />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="shop-info-item">
                    <i className="bi bi-envelope" />
                    <a href={`mailto:${shop.email}`}>{shop.email}</a>
                  </div>
                )}
                {shop.phone && (
                  <div className="shop-info-item">
                    <i className="bi bi-telephone" />
                    <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="shop-contact-card">
              <div className="shop-contact-icon">
                <i className="bi bi-whatsapp" />
              </div>
              <h3>Commander facilement</h3>
              <p>Contactez {shop.name} directement sur WhatsApp pour vos commandes et questions.</p>

              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="shop-contact-wa-btn"
                >
                  <i className="bi bi-whatsapp" /> Ouvrir WhatsApp
                </a>
              ) : (
                <p className="shop-no-contact">Aucun contact WhatsApp renseigné.</p>
              )}

              <div className="shop-share-row">
                <span>Partager :</span>
                <ShopShareButton shopName={shop.name} shopId={shop.id} />
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FAB WhatsApp — unique */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="shop-fab"
          aria-label={`Contacter ${shop.name} sur WhatsApp`}
        >
          <i className="bi bi-whatsapp" />
        </a>
      )}

      {/* Mobile nav */}
      <nav className="shop-mobile-nav" aria-label="Navigation boutique">
        <Link href="/shops">
          <i className="bi bi-arrow-left" />
          <span>Boutiques</span>
        </Link>
        <a href="#products">
          <i className="bi bi-grid" />
          <span>Produits</span>
        </a>
        <a href="#about">
          <i className="bi bi-info-circle" />
          <span>Infos</span>
        </a>
      </nav>
    </div>
  );
}
