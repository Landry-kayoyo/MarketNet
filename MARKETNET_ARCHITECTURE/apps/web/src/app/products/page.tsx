import Link from 'next/link';
import Topbar from '../components/Topbar';
import ProductsCatalog from './ProductsCatalog';
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

type Shop = { id: string; name: string };

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0
  }).format(cents / 100);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] ?? '' : params.q ?? '';
  const initialCategory = Array.isArray(params.category) ? params.category[0] ?? '' : params.category ?? '';
  let products: Product[] = [];
  let categories: Category[] = [];
  let shops: Shop[] = [];
  let error: string | null = null;

  try {
    [products, categories] = await Promise.all([
      fetchPublicApi<Product[]>('/api/v1/products'),
      fetchPublicApi<Category[]>('/api/v1/products/categories'),
    ]);
    try {
      shops = await fetchPublicApi<Shop[]>('/api/v1/shops');
    } catch {
      // Le catalogue reste consultable si la liste des boutiques est indisponible.
    }
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
              <ProductsCatalog
                products={products}
                categories={categories}
                shopNames={Object.fromEntries(shops.map((shop) => [shop.id, shop.name]))}
                initialQuery={initialQuery}
                initialCategory={initialCategory}
              />
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
