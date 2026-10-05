import Link from 'next/link';
import Topbar from '../components/Topbar';
import { fetchPublicApi } from '@/lib/api';

type Product = {
  id: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  sku: string | null;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
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
    maximumFractionDigits: 0
  }).format(cents);

export default async function ProductsPage() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [products, categories] = await Promise.all([
      fetchPublicApi<Product[]>('/api/v1/products'),
      fetchPublicApi<Category[]>('/api/v1/products/categories'),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Impossible de charger le catalogue.';
  }

  return (
    <div className="app public-app">
      <Topbar activeNav="products" />

      <main className="content">
        <section className="section home-products-section">
          <div className="section-head">
            <div>
              <span className="home-section-eyebrow">Catalogue MarketNet</span>
              <h2>Tous les produits</h2>
              <p>Découvrez tous les articles proposés par nos commerçants locaux.</p>
            </div>
          </div>

          {error ? (
            <div className="state-box">
              <i className="bi bi-exclamation-triangle" style={{ fontSize: 32, color: 'var(--color-danger)', marginBottom: 12, display: 'block' }} />
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6 }}>Erreur de chargement</strong>
              <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          ) : (
            <>
              <div className="hero-search" style={{ marginTop: 0, maxWidth: '100%' }}>
                <i className="bi bi-search home-search-icon" aria-hidden="true" />
                <input aria-label="Recherche produit" placeholder="Rechercher un produit, une marque..." />
                <button type="button" className="btn primary" style={{ whiteSpace: 'nowrap' }}>
                  Rechercher
                </button>
              </div>

              <div className="pills" style={{ marginTop: 20, marginBottom: 20 }}>
                <button type="button" className="btn primary">
                  Tous les produits
                </button>
                {categories.map((category) => (
                  <button key={category.id} type="button" className="btn">
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="product-grid" id="homeProducts">
                {products.length === 0 ? (
                  <div className="state-box" style={{ gridColumn: '1 / -1' }}>
                    <i className="bi bi-box-seam" style={{ fontSize: 32, color: 'var(--color-text-disabled)', marginBottom: 12, display: 'block' }} />
                    <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 6 }}>Aucun produit</strong>
                    <p style={{ margin: 0, fontSize: 13 }}>Le catalogue est vide pour le moment.</p>
                  </div>
                ) : (
                  products.map((product) => {
                    const imgSrc = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
                    return (
                      <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <article className="product-card">
                          <div
                            className="product-media"
                            style={imgSrc ? { ['--media-bg' as string]: `url(${imgSrc})` } : {}}
                          >
                            {imgSrc ? (
                              <img src={imgSrc} alt={product.name} loading="lazy" />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-disabled)', fontSize: 32 }}>
                                <i className="bi bi-image" />
                              </div>
                            )}
                          </div>
                          <div className="product-body">
                            <span className="tag">{categories.find(c => c.id === product.categoryId)?.name || 'Produit'}</span>
                            <h3>{product.name}</h3>
                            <div className="product-shopline">
                              <i className="bi bi-shop" aria-hidden="true" />
                              <span>Boutique MarketNet</span>
                            </div>
                            <div className="brand-row">
                              {product.isFeatured && <span className="brand-chip"><i className="bi bi-star-fill" style={{ color: 'var(--color-accent)' }} /> À la une</span>}
                            </div>
                            <div className="price">{formatPrice(product.priceCents)}</div>
                          </div>
                        </article>
                      </Link>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Navigation mobile">
        <Link href="/">
          <i className="bi bi-house-fill" aria-hidden="true" />
          <span>Accueil</span>
        </Link>
        <Link href="/products" className="active" aria-current="page">
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
