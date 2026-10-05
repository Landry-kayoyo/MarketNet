import Link from 'next/link';
import Topbar from './components/Topbar';
import { fetchPublicApi } from '@/lib/api';

type Shop = {
  id: string;
  name: string;
  slug: string;
  slogan: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
};

type Product = {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  priceCents: number;
  stockQuantity: number;
  isFeatured: boolean;
  isPublished: boolean;
  status: string;
  images?: { url: string; isPrimary: boolean }[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0,
  }).format(cents);

const CAT_ICONS = [
  'bi-phone', 'bi-bag', 'bi-house', 'bi-laptop',
  'bi-headphones', 'bi-person', 'bi-gem', 'bi-bicycle',
  'bi-camera', 'bi-controller', 'bi-book', 'bi-heart',
];

const FEATURES = [
  {
    icon: 'bi-shop-window',
    title: 'Votre boutique en ligne',
    desc: 'Créez votre vitrine en quelques minutes et partagez-la via WhatsApp.',
  },
  {
    icon: 'bi-whatsapp',
    title: 'Commandes par WhatsApp',
    desc: 'Recevez les commandes directement sur votre téléphone, sans intermédiaire.',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Suivez votre activité',
    desc: 'Statistiques de visites, produits populaires et évolution des commandes.',
  },
];

export default async function HomePage() {
  let shops: Shop[] = [];
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    [shops, products, categories] = await Promise.all([
      fetchPublicApi<Shop[]>('/api/v1/shops'),
      fetchPublicApi<Product[]>('/api/v1/products'),
      fetchPublicApi<Category[]>('/api/v1/products/categories'),
    ]);
  } catch {
    // API indisponible — on affiche les états vides
  }

  const featuredProducts = products.slice(0, 8);
  const featuredShops    = shops.slice(0, 3);

  return (
    <div className="app public-app">
      <Topbar activeNav="home" />

      <main className="content" id="main-content">

        {/* ── Hero ── */}
        <section className="hero home-hero" aria-label="Bienvenue sur MarketNet">
          <div className="home-hero-content">
            <span className="home-hero-kicker">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              Marketplace locale · RDC
            </span>
            <h1 className="text-display">
              Le commerce local,{' '}
              <span>à portée de main.</span>
            </h1>
            <p>
              Découvrez les boutiques et les produits près de chez vous.
              Commandez directement via WhatsApp.
            </p>
            <div className="hero-search" role="search">
              <i className="bi bi-search home-search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Rechercher un produit, une boutique…"
                aria-label="Rechercher sur MarketNet"
              />
              <Link href="/products" className="btn primary" style={{ whiteSpace: 'nowrap' }}>
                Rechercher
              </Link>
            </div>
            <Link href="/register" className="home-merchant-cta">
              Vous êtes commerçant ? Créer ma boutique gratuitement{' '}
              <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="home-trust-strip" aria-label="MarketNet en chiffres">
          <div className="home-trust-item">
            <i className="bi bi-shop-window" aria-hidden="true" />
            <span>
              <strong>{shops.length > 0 ? shops.length : '100+'} boutiques</strong>
              près de chez vous
            </span>
          </div>
          <div className="home-trust-item">
            <i className="bi bi-box-seam" aria-hidden="true" />
            <span>
              <strong>{products.length > 0 ? products.length : '500+'} produits</strong>
              à explorer
            </span>
          </div>
          <div className="home-trust-item">
            <i className="bi bi-whatsapp" aria-hidden="true" />
            <span>
              <strong>Contact direct</strong>
              avec les commerçants
            </span>
          </div>
        </section>

        {/* ── Catégories ── */}
        {categories.length > 0 && (
          <section className="section home-categories" aria-labelledby="cat-heading">
            <div className="section-head">
              <div>
                <span className="eyebrow">Explorer</span>
                <h2 id="cat-heading">Parcourir les catégories</h2>
                <p>Choisissez un univers pour affiner votre recherche.</p>
              </div>
            </div>
            <div className="cat-grid">
              {categories.slice(0, 6).map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="cat"
                  aria-label={`Catégorie : ${cat.name}`}
                >
                  <i className={`bi ${CAT_ICONS[i % CAT_ICONS.length]}`} aria-hidden="true" />
                  <strong>{cat.name}</strong>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    {products.filter((p) => p.status === 'ACTIVE').length} produits
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Produits à découvrir ── */}
        <section className="section home-products-section" id="productsSection" aria-labelledby="prod-heading">
          <div className="section-head">
            <div>
              <span className="home-section-eyebrow">Sélection MarketNet</span>
              <h2 id="prod-heading">Produits à découvrir</h2>
              <p>Des trouvailles proposées par les boutiques locales.</p>
            </div>
            <Link href="/products" className="btn home-products-all">
              Voir tout <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="state-box">
              <i className="bi bi-box-seam" style={{ fontSize: 36, color: 'var(--color-text-disabled)', marginBottom: 14, display: 'block' }} aria-hidden="true" />
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6, fontSize: 'var(--text-base)' }}>
                Aucun produit pour le moment
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                Les produits apparaîtront ici dès leur publication par les commerçants.
              </p>
            </div>
          ) : (
            <div className="product-grid" id="homeProducts">
              {featuredProducts.map((product) => {
                const imgSrc = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    aria-label={`Voir ${product.name}`}
                  >
                    <article className="product-card">
                      <div
                        className="product-media"
                        style={imgSrc ? { ['--media-bg' as string]: `url(${imgSrc})` } : {}}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '100%', color: 'var(--color-text-disabled)', flexDirection: 'column', gap: 8,
                          }} aria-hidden="true">
                            <i className="bi bi-image" style={{ fontSize: 32 }} />
                            <span style={{ fontSize: 11 }}>Aucune photo</span>
                          </div>
                        )}
                      </div>
                      <div className="product-body">
                        <span className="tag">Produit</span>
                        <h3>{product.name}</h3>
                        <div className="product-shopline">
                          <i className="bi bi-shop" aria-hidden="true" />
                          <span>Boutique MarketNet</span>
                        </div>
                        <div className="price">{formatPrice(product.priceCents)}</div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Boutiques ── */}
        <section className="section" id="shopsSection" aria-labelledby="shops-heading">
          <div className="section-head">
            <div>
              <span className="home-section-eyebrow">Les commerçants d&apos;ici</span>
              <h2 id="shops-heading">Boutiques à découvrir</h2>
              <p>Rencontrez les boutiques locales et trouvez votre prochain coup de cœur.</p>
            </div>
            <span className="home-shop-total">
              <i className="bi bi-shop-window" aria-hidden="true" /> {shops.length} boutiques
            </span>
          </div>

          {featuredShops.length === 0 ? (
            <div className="state-box">
              <i className="bi bi-shop" style={{ fontSize: 36, color: 'var(--color-text-disabled)', marginBottom: 14, display: 'block' }} aria-hidden="true" />
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6, fontSize: 'var(--text-base)' }}>
                Aucune boutique publiée
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                Les boutiques apparaîtront ici dès leur activation.
              </p>
            </div>
          ) : (
            <div className="home-shop-grid">
              {featuredShops.map((shop) => {
                const shopProds = products.filter((p) => p.shopId === shop.id);
                return (
                  <article key={shop.id} className="home-shop-card">
                    <div className="home-shop-media">
                      {shop.coverUrl && (
                        <img
                          src={shop.coverUrl}
                          alt={`Couverture de ${shop.name}`}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <span className="home-shop-location">
                        <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                        {' '}{shop.city ?? 'RDC'}
                      </span>
                      <span className="home-shop-logo" aria-hidden="true">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} alt={`Logo de ${shop.name}`} />
                        ) : (
                          <i className="bi bi-shop" />
                        )}
                      </span>
                    </div>
                    <div className="home-shop-content">
                      <div className="home-shop-heading">
                        <h3>{shop.name}</h3>
                        <span className="home-shop-count">{shopProds.length} produits</span>
                      </div>
                      <p>{shop.slogan ?? shop.description ?? 'Une boutique locale à découvrir.'}</p>
                      <div className="home-shop-bottom">
                        <div className="home-shop-tags">
                          <span style={{ fontWeight: 'var(--fw-bold)' }}>
                            {shop.city ?? 'RDC'}
                          </span>
                        </div>
                        <Link href={`/shops/${shop.id}`} className="home-shop-link">
                          Découvrir <i className="bi bi-arrow-up-right" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Pourquoi MarketNet ── */}
        <section className="section" aria-labelledby="features-heading" style={{ marginTop: 'var(--space-10)' }}>
          <div className="section-head" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <span className="eyebrow">Pour les commerçants</span>
            <h2 id="features-heading">Développez votre activité</h2>
            <p>MarketNet vous donne les outils pour vendre plus, sans frais fixes.</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="panel" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 26,
                  margin: '0 auto var(--space-4)',
                }} aria-hidden="true">
                  <i className={`bi ${f.icon}`} />
                </div>
                <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-base)' }}>{f.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <Link href="/register" className="btn primary lg">
              <i className="bi bi-shop-window" aria-hidden="true" />
              Créer ma boutique gratuitement
            </Link>
          </div>
        </section>

      </main>

      {/* Mobile nav */}
      <nav className="mobile-nav" aria-label="Navigation mobile">
        <Link href="/" passHref legacyBehavior>
          <button type="button" className="active" aria-current="page">
            <i className="bi bi-house-fill" aria-hidden="true" />
            <span>Accueil</span>
          </button>
        </Link>
        <Link href="/products" passHref legacyBehavior>
          <button type="button">
            <i className="bi bi-grid" aria-hidden="true" />
            <span>Produits</span>
          </button>
        </Link>
        <Link href="/shops" passHref legacyBehavior>
          <button type="button">
            <i className="bi bi-shop" aria-hidden="true" />
            <span>Boutiques</span>
          </button>
        </Link>
        <Link href="/login" passHref legacyBehavior>
          <button type="button">
            <i className="bi bi-person-circle" aria-hidden="true" />
            <span>Marchand</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
