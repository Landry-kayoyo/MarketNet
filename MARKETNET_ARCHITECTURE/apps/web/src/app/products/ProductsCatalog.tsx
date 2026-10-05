'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';

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

type Category = { id: string; name: string; slug: string; description: string | null };

type ProductsCatalogProps = {
  products: Product[];
  categories: Category[];
  shopNames: Record<string, string>;
  initialQuery: string;
  initialCategory: string;
};

const PAGE_SIZE = 24;

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0,
  }).format(cents / 100);

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

export default function ProductsCatalog({
  products,
  categories,
  shopNames,
  initialQuery,
  initialCategory,
}: ProductsCatalogProps) {
  const initialCategoryId = categories.find((category) => category.slug === initialCategory)?.id ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [sort, setSort] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCategoryName = categories.find((category) => category.id === selectedCategory)?.name;

  const filteredProducts = useMemo(() => {
    const term = normalize(query.trim());
    const matching = products.filter((product) => {
      if (selectedCategory && product.categoryId !== selectedCategory) return false;
      if (!term) return true;
      const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? '';
      const searchText = normalize([
        product.name,
        product.shortDescription ?? '',
        product.description ?? '',
        product.sku ?? '',
        categoryName,
      ].join(' '));
      return searchText.includes(term);
    });

    return [...matching].sort((a, b) => {
      if (sort === 'price-asc') return a.priceCents - b.priceCents;
      if (sort === 'price-desc') return b.priceCents - a.priceCents;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [categories, products, query, selectedCategory, sort]);

  const suggestions = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];

    const productMatches = products
      .filter((product) => normalize(product.name).includes(term))
      .slice(0, 5)
      .map((product) => ({ key: `product-${product.id}`, label: product.name, kind: 'Produit' as const }));
    const categoryMatches = categories
      .filter((category) => normalize(category.name).includes(term))
      .slice(0, 3)
      .map((category) => ({ key: `category-${category.id}`, label: category.name, kind: 'Catégorie' as const, id: category.id }));

    return [...categoryMatches, ...productMatches].slice(0, 6);
  }, [categories, products, query]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.categoryId) counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFocused(false);
    setVisibleCount(PAGE_SIZE);
  }

  function chooseSuggestion(suggestion: (typeof suggestions)[number]) {
    if (suggestion.kind === 'Catégorie') {
      setSelectedCategory(suggestion.id);
      setQuery('');
    } else {
      setQuery(suggestion.label);
    }
    setVisibleCount(PAGE_SIZE);
    setFocused(false);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  function changeCategory(value: string) {
    setSelectedCategory(value);
    setVisibleCount(PAGE_SIZE);
  }

  const shownProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="catalog-browser">
      <div className="catalog-toolbar">
        <form
          className={`catalog-search${focused ? ' is-focused' : ''}`}
          role="search"
          onSubmit={submitSearch}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
        >
          <i className="bi bi-search" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Rechercher un produit, une marque…"
            aria-label="Rechercher dans tous les produits"
            aria-autocomplete="list"
            aria-expanded={focused && suggestions.length > 0}
            autoComplete="off"
          />
          {query && (
            <button
              className="catalog-search-clear"
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => {
                changeQuery('');
                inputRef.current?.focus();
              }}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
          {focused && suggestions.length > 0 && (
            <ul className="catalog-suggestions" role="listbox" aria-label="Suggestions de recherche">
              {suggestions.map((suggestion) => (
                <li key={suggestion.key}>
                  <button type="button" role="option" onClick={() => chooseSuggestion(suggestion)}>
                    <i className={`bi ${suggestion.kind === 'Catégorie' ? 'bi-grid' : 'bi-search'}`} aria-hidden="true" />
                    <span>{suggestion.label}</span>
                    <small>{suggestion.kind}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="catalog-filters">
          <label className="catalog-filter-control">
            <i className="bi bi-grid" aria-hidden="true" />
            <span className="sr-only">Filtrer par catégorie</span>
            <select value={selectedCategory} onChange={(event) => changeCategory(event.target.value)}>
              <option value="">Toutes les catégories ({products.length})</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({categoryCounts.get(category.id) ?? 0})
                </option>
              ))}
            </select>
            <i className="bi bi-chevron-down catalog-select-chevron" aria-hidden="true" />
          </label>
          <label className="catalog-filter-control catalog-sort-control">
            <i className="bi bi-sort-down" aria-hidden="true" />
            <span className="sr-only">Trier les produits</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
            <i className="bi bi-chevron-down catalog-select-chevron" aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="catalog-results" aria-live="polite" aria-atomic="true">
        <span>
          <strong>{filteredProducts.length}</strong> produit{filteredProducts.length === 1 ? '' : 's'}
          {selectedCategoryName ? <> · <strong>{selectedCategoryName}</strong></> : null}
        </span>
        {(query || selectedCategory) && (
          <button type="button" onClick={() => { changeQuery(''); changeCategory(''); }}>
            Réinitialiser les filtres <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="product-grid catalog-product-grid" id="homeProducts">
        {products.length === 0 ? (
          <div className="state-box catalog-empty-state">
            <i className="bi bi-box-seam" aria-hidden="true" />
            <strong>Aucun produit pour le moment</strong>
            <p>Les produits apparaîtront ici dès leur publication par les commerçants.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="state-box catalog-empty-state">
            <i className="bi bi-search" aria-hidden="true" />
            <strong>Aucun résultat trouvé</strong>
            <p>Essayez un autre mot-clé ou retirez le filtre de catégorie.</p>
            <button type="button" className="btn" onClick={() => { changeQuery(''); changeCategory(''); }}>
              Effacer les filtres
            </button>
          </div>
        ) : (
          shownProducts.map((product) => {
            const image = product.images?.find((item) => item.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
            const categoryName = categories.find((category) => category.id === product.categoryId)?.name ?? 'Produit';
            return (
              <Link key={product.id} href={`/products/${product.id}`} className="catalog-product-link" aria-label={`Voir ${product.name}`}>
                <article className="product-card">
                  <div className="product-media" style={image ? { ['--media-bg' as string]: `url(${image})` } : undefined}>
                    {image ? (
                      <img src={image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="catalog-image-placeholder" aria-label="Image indisponible">
                        <i className="bi bi-image" aria-hidden="true" />
                      </div>
                    )}
                    {product.isFeatured && <span className="catalog-featured-badge"><i className="bi bi-star-fill" aria-hidden="true" /> À la une</span>}
                  </div>
                  <div className="product-body">
                    <span className="tag">{categoryName}</span>
                    <h3>{product.name}</h3>
                    <div className="product-shopline">
                      <i className="bi bi-shop" aria-hidden="true" />
                      <span>{shopNames[product.shopId] ?? 'Boutique partenaire'}</span>
                    </div>
                    <div className="catalog-stock-status">
                      <span className={product.stockQuantity > 0 ? 'is-available' : 'is-unavailable'}>
                        <i className={`bi ${product.stockQuantity > 0 ? 'bi-check-circle' : 'bi-x-circle'}`} aria-hidden="true" />
                        {product.stockQuantity > 0 ? 'En stock' : 'Indisponible'}
                      </span>
                    </div>
                    <div className="price">{formatPrice(product.priceCents)}</div>
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </div>

      {shownProducts.length < filteredProducts.length && (
        <div className="catalog-load-more-wrap">
          <button className="btn catalog-load-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Afficher plus de produits <span>({filteredProducts.length - shownProducts.length} restant{filteredProducts.length - shownProducts.length === 1 ? '' : 's'})</span>
            <i className="bi bi-arrow-down" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
