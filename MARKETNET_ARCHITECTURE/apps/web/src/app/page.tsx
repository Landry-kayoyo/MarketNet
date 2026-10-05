import Link from 'next/link';
import Topbar from './components/Topbar';
import HeroSearch from './components/HeroSearch';
import HeroSlideshow from './components/HeroSlideshow';
import ScrollReveal from './components/ScrollReveal';
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
  }).format(cents / 100);

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
  const featuredShops    = shops.slice(0, 6);
  const searchSuggestions = [...new Set([
    ...featuredProducts.map((product) => product.name),
    ...categories.map((category) => category.name),
  ])].slice(0, 8);

  return (
    <div className="app public-app">
      <ScrollReveal />
      <Topbar activeNav="home" />

      <main className="content" id="main-content">

        {/* ── Hero ── */}
        <section
          className="hero home-hero"
          aria-label="Bienvenue sur MarketNet"
        >
          <HeroSlideshow />
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
            <HeroSearch suggestions={searchSuggestions} />
            <Link href="/register" className="home-merchant-cta">
              Vous êtes commerçant ? Créer ma boutique gratuitement{' '}
              <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="home-trust-strip" aria-label="MarketNet en chiffres" data-reveal data-reveal-delay="100">
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
          <section className="section home-categories" aria-labelledby="cat-heading" data-reveal data-reveal-delay="0">
            <div className="section-head">
              <div>
                <span className="eyebrow">Explorer</span>
                <h2 id="cat-heading">Parcourir les catégories</h2>
                <p>Choisissez un univers pour affiner votre recherche.</p>
              </div>
            </div>
            <div className="cat-grid">
              {categories.slice(0, 8).map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="cat"
                  aria-label={`Catégorie : ${cat.name}`}
                  data-reveal
                  data-reveal-delay={String(i * 60)}
                >
                  <i className={`bi ${CAT_ICONS[i % CAT_ICONS.length]}`} aria-hidden="true" />
                  <strong>{cat.name}</strong>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Produits à découvrir ── */}
        <section className="section home-products-section" id="productsSection" aria-labelledby="prod-heading">
          <div className="section-head" data-reveal>
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
            <div className="state-box" data-reveal>
              <i className="bi bi-box-seam" style={{ fontSize: 36, color: 'var(--color-text-disabled)', marginBottom: 14, display: 'block' }} aria-hidden="true" />
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6, fontSize: 'var(--text-base)' }}>
                Aucun produit pour le moment
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                Les produits apparaîtront ici dès leur publication par les commerçants.
              </p>
            </div>
          ) : (
            <div className="product-grid home-product-grid" id="homeProducts">
              {featuredProducts.map((product, i) => {
                const imgSrc = product.images?.find((img) => img.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    aria-label={`Voir ${product.name}`}
                    data-reveal
                    data-reveal-delay={String((i % 4) * 80)}
                  >
                    <article className="product-card">
                      <div className="product-media">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="product-media-empty" aria-hidden="true">
                            <i className="bi bi-image" />
                            <span>Aucune photo</span>
                          </div>
                        )}
                        {product.stockQuantity === 0 && (
                          <span className="product-badge sold-out">Rupture</span>
                        )}
                        {product.isFeatured && product.stockQuantity > 0 && (
                          <span className="product-badge featured">Vedette</span>
                        )}
                      </div>
                      <div className="product-body">
                        <h3>{product.name}</h3>
                        {product.shortDescription && (
                          <p className="product-desc">{product.shortDescription}</p>
                        )}
                        <div className="product-footer">
                          <div className="price">{formatPrice(product.priceCents)}</div>
                          <button className="product-cta" aria-label={`Commander ${product.name}`}>
                            <i className="bi bi-whatsapp" />
                          </button>
                        </div>
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
          <div className="section-head" data-reveal>
            <div>
              <span className="home-section-eyebrow">Les commerçants d&apos;ici</span>
              <h2 id="shops-heading">Boutiques à découvrir</h2>
              <p>Rencontrez les boutiques locales et trouvez votre prochain coup de cœur.</p>
            </div>
            <Link href="/shops" className="btn">
              Voir toutes <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          {featuredShops.length === 0 ? (
            <div className="state-box" data-reveal>
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
              {featuredShops.map((shop, i) => (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="home-shop-card home-shop-card-compact home-shop-card-textonly"
                  data-reveal
                  data-reveal-delay={String((i % 3) * 100)}
                  aria-label={`Voir la boutique ${shop.name}`}
                >
                  <div className="home-shop-content home-shop-content-compact">
                    <h3>{shop.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Pourquoi MarketNet ── */}
        <section className="section features-section" aria-labelledby="features-heading" data-reveal>
          <div className="section-head" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <span className="eyebrow">Pour les commerçants</span>
            <h2 id="features-heading">Développez votre activité</h2>
            <p>MarketNet vous donne les outils pour vendre plus, sans frais fixes.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="feature-card panel"
                data-reveal
                data-reveal-delay={String(i * 120)}
              >
                <div className="feature-icon" aria-hidden="true">
                  <i className={`bi ${f.icon}`} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
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
        <Link href="/" className="active" aria-current="page">
          <i className="bi bi-house-fill" aria-hidden="true" />
          <span>Accueil</span>
        </Link>
        <Link href="/products">
          <i className="bi bi-grid" aria-hidden="true" />
          <span>Produits</span>
        </Link>
        <Link href="/shops">
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
