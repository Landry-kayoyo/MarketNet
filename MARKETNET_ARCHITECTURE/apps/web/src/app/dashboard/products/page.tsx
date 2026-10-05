'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { fetchAuthedApi, fetchPublicApi, getAccessToken, mutateAuthedApi } from '@/lib/api';

type Shop = { id: string; name: string; slug: string };
type Category = { id: string; name: string };
type ProductImage = { id: string; url: string; isPrimary: boolean; sortOrder: number };
type Product = {
  id: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  status: string;
  isPublished: boolean;
  images: ProductImage[];
};
type ProductForm = {
  name: string;
  price: string;
  categoryId: string;
  stockQuantity: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
};

const emptyForm: ProductForm = {
  name: '', price: '', categoryId: '', stockQuantity: '0',
  shortDescription: '', description: '', imageUrl: '', isPublished: true,
};

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0,
  }).format(priceCents / 100);

export default function DashboardProductsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showShopForm, setShowShopForm] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopWhatsApp, setShopWhatsApp] = useState('');
  const [shopCity, setShopCity] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const loadProducts = useCallback(async () => {
    const token = getAccessToken();
    if (!token) throw new Error('Reconnectez-vous à votre espace commerçant.');

    const ownedShops = await fetchAuthedApi<Shop[]>('/api/v1/shops/me', token);
    const ownedShop = ownedShops[0] ?? null;
    setShop(ownedShop);
    const categoryList = await fetchPublicApi<Category[]>('/api/v1/products/categories');
    setCategories(categoryList);

    if (!ownedShop) {
      setProducts([]);
      return;
    }

    const shopProducts = await fetchAuthedApi<Product[]>(`/api/v1/products/shop/${ownedShop.id}`, token);
    setProducts(shopProducts);
  }, []);

  useEffect(() => {
    loadProducts()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Impossible de charger le catalogue.'))
      .finally(() => setLoading(false));
  }, [loadProducts]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesFilter = filter === 'all'
      || (filter === 'live' && product.isPublished && product.status === 'ACTIVE')
      || (filter === 'hidden' && (!product.isPublished || product.status !== 'ACTIVE'));
    const searchText = `${product.name} ${product.shortDescription ?? ''} ${product.description ?? ''}`.toLowerCase();
    return matchesFilter && searchText.includes(query.trim().toLowerCase());
  }), [filter, products, query]);

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.priceCents / 100),
      categoryId: product.categoryId ?? '',
      stockQuantity: String(product.stockQuantity),
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      imageUrl: product.images?.[0]?.url ?? '',
      isPublished: product.isPublished && product.status === 'ACTIVE',
    });
    setError('');
    setIsFormOpen(true);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const token = getAccessToken();
    if (!token || !shop) {
      setError('Une boutique et une session commerçant sont nécessaires pour enregistrer un produit.');
      return;
    }

    const price = Number(form.price);
    const stockQuantity = Number(form.stockQuantity);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError('Saisissez un prix supérieur à zéro et un stock entier positif ou nul.');
      return;
    }
    if (form.shortDescription.trim() && form.shortDescription.trim().length < 2) {
      setError('La description courte doit contenir au moins 2 caractères.');
      return;
    }
    if (form.description.trim() && form.description.trim().length < 10) {
      setError('La description doit contenir au moins 10 caractères.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        priceCents: Math.round(price * 100),
        stockQuantity,
        ...(form.shortDescription.trim() ? { shortDescription: form.shortDescription.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        isPublished: form.isPublished,
        status: form.isPublished ? 'ACTIVE' : 'DRAFT',
      };

      const savedProduct = editing
        ? await mutateAuthedApi<Product>(`/api/v1/products/${editing.id}`, token, 'PATCH', payload)
        : await mutateAuthedApi<Product>(`/api/v1/products/shop/${shop.id}`, token, 'POST', payload);

      const previousImage = editing?.images?.[0];
      const imageUrl = form.imageUrl.trim();
      if (imageUrl && previousImage && imageUrl !== previousImage.url) {
        await mutateAuthedApi(`/api/v1/products/${savedProduct.id}/images/${previousImage.id}`, token, 'PATCH', {
          url: imageUrl,
          altText: form.name.trim(),
        });
      } else if (imageUrl && !previousImage) {
        await mutateAuthedApi(`/api/v1/products/${savedProduct.id}/images`, token, 'POST', {
          url: imageUrl,
          altText: form.name.trim(),
          isPrimary: true,
        });
      } else if (!imageUrl && previousImage) {
        await mutateAuthedApi(`/api/v1/products/${savedProduct.id}/images/${previousImage.id}`, token, 'DELETE');
      }

      await loadProducts();
      setEditing(null);
      setIsFormOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Le produit n’a pas pu être enregistré.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(product: Product) {
    const token = getAccessToken();
    if (!token) return setError('Reconnectez-vous à votre espace commerçant.');
    const publish = !(product.isPublished && product.status === 'ACTIVE');
    setError('');
    try {
      await mutateAuthedApi(`/api/v1/products/${product.id}`, token, 'PATCH', {
        isPublished: publish,
        status: publish ? 'ACTIVE' : 'DRAFT',
      });
      await loadProducts();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Le statut du produit n’a pas pu être modifié.');
    }
  }

  async function createShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return setError('Reconnectez-vous à votre espace commerçant.');
    setSaving(true);
    setError('');
    try {
      await mutateAuthedApi('/api/v1/shops', token, 'POST', {
        name: shopName.trim(),
        whatsapp: shopWhatsApp.trim() || undefined,
        city: shopCity.trim() || undefined,
        country: 'RDC',
      });
      setShowShopForm(false);
      await loadProducts();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'La boutique n’a pas pu être créée.');
    } finally {
      setSaving(false);
    }
  }

  const liveCount = products.filter((product) => product.isPublished && product.status === 'ACTIVE').length;
  const hiddenCount = products.length - liveCount;

  return (
    <>
      <div className="page-head merchant-products-head">
        <div>
          <span className="merchant-page-eyebrow">Catalogue{shop ? ` · ${shop.name}` : ''}</span>
          <h1>Mes produits</h1>
          <p>Ajoutez, modifiez et publiez les produits de votre boutique.</p>
        </div>
        <button className="btn primary merchant-primary-action" type="button" onClick={openCreateForm} disabled={!shop}>
          <i className="bi bi-plus-lg" aria-hidden="true" /> Ajouter un produit
        </button>
      </div>

      {error && <div className="signup-error is-visible" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {!loading && !shop ? (
        <section className="panel" style={{ padding: 24 }}>
          <h2>Aucune boutique associée</h2>
          <p>Créez votre vitrine pour pouvoir ajouter vos produits à la marketplace.</p>
          {showShopForm ? (
            <form className="form" onSubmit={createShop} style={{ maxWidth: 520 }}>
              <label>Nom de la boutique *<input required minLength={2} value={shopName} onChange={(event) => setShopName(event.target.value)} /></label>
              <label>WhatsApp du commerçant<input type="tel" placeholder="+243…" value={shopWhatsApp} onChange={(event) => setShopWhatsApp(event.target.value)} /></label>
              <label>Ville<input value={shopCity} onChange={(event) => setShopCity(event.target.value)} /></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" type="button" disabled={saving} onClick={() => setShowShopForm(false)}>Annuler</button>
                <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Création…' : 'Créer ma boutique'}</button>
              </div>
            </form>
          ) : <button className="btn primary" type="button" onClick={() => setShowShopForm(true)}>Créer ma boutique</button>}
        </section>
      ) : (
        <>
          <div className="merchant-products-toolbar" role="search" aria-label="Filtrer les produits">
            <label className="merchant-products-search">
              <i className="bi bi-search" aria-hidden="true" />
              <input type="search" placeholder="Rechercher un produit…" aria-label="Rechercher parmi vos produits" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="merchant-product-filters" role="group" aria-label="Filtres produits">
              {([
                ['all', 'Tous', products.length],
                ['live', 'En ligne', liveCount],
                ['hidden', 'Hors ligne', hiddenCount],
              ] as const).map(([value, label, count]) => (
                <button key={value} className={filter === value ? 'active' : ''} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                  {label} <span className="filter-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="merchant-products-results" aria-live="polite" aria-atomic="true">
            <span><strong>{loading ? 'Chargement…' : `${visibleProducts.length} produit${visibleProducts.length === 1 ? '' : 's'}`}</strong>{!loading && ' affiché(s)'}</span>
          </div>

          {loading ? (
            <div className="panel" style={{ padding: 24 }}>Chargement de votre catalogue…</div>
          ) : visibleProducts.length === 0 ? (
            <div className="panel" style={{ padding: 24, textAlign: 'center' }}>
              <h2>{products.length ? 'Aucun résultat' : 'Votre catalogue est vide'}</h2>
              <p>{products.length ? 'Essayez un autre filtre ou une autre recherche.' : 'Ajoutez votre premier produit pour le présenter sur la marketplace.'}</p>
              {!products.length && <button className="btn primary" type="button" onClick={openCreateForm}>Ajouter un produit</button>}
            </div>
          ) : (
            <div className="grid merchant-product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }} role="list" aria-label="Liste de vos produits">
              {visibleProducts.map((product) => {
                const published = product.isPublished && product.status === 'ACTIVE';
                const image = product.images?.[0]?.url;
                return (
                  <article key={product.id} className="card merchant-product-card" role="listitem">
                    <div className="merchant-product-image">
                      {image ? <img src={image} alt={product.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} /> : (
                        <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--color-text-disabled)' }}><i className="bi bi-image" style={{ fontSize: 32 }} aria-hidden="true" /></div>
                      )}
                      <span className={`merchant-product-status ${published ? 'is-live' : 'is-hidden'}`}>{published ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                    <div className="product-body">
                      <h3>{product.name}</h3>
                      <div className="price">{formatPrice(product.priceCents)}</div>
                      <div className="merchant-product-meta"><span>Stock : <strong>{product.stockQuantity}</strong></span><span>{categories.find((category) => category.id === product.categoryId)?.name ?? 'Sans catégorie'}</span></div>
                      <div className="merchant-product-actions">
                        <button className="btn merchant-edit-action" type="button" onClick={() => openEditForm(product)}><i className="bi bi-pencil" aria-hidden="true" /> Modifier</button>
                        <button className={`btn merchant-toggle-action ${published ? 'is-live' : 'is-hidden'}`} type="button" aria-pressed={published} onClick={() => togglePublished(product)}>{published ? 'Masquer' : 'Publier'}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsFormOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 23, 42, .58)', display: 'grid', placeItems: 'center', padding: 16 }}
        >
          <section className="panel" role="dialog" aria-modal="true" aria-labelledby="product-form-title" style={{ width: 'min(620px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: 24 }}>
            <div className="head">
              <div>
                <h2 id="product-form-title" style={{ margin: 0 }}>{editing ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
                <p style={{ margin: '6px 0 0' }}>Les modifications sont enregistrées dans la base de données.</p>
              </div>
              <button className="btn" type="button" aria-label="Fermer" disabled={saving} onClick={() => setIsFormOpen(false)}>×</button>
            </div>

            <form className="form" onSubmit={saveProduct}>
              <label>
                Nom du produit *
                <input required minLength={2} maxLength={150} value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} />
              </label>
              <div className="form-grid">
                <label>
                  Prix (CDF) *
                  <input type="number" required min="1" step="1" value={form.price} onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))} />
                </label>
                <label>
                  Stock *
                  <input type="number" required min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm((previous) => ({ ...previous, stockQuantity: event.target.value }))} />
                </label>
              </div>
              <label>
                Catégorie
                <select value={form.categoryId} onChange={(event) => setForm((previous) => ({ ...previous, categoryId: event.target.value }))}>
                  <option value="">Sans catégorie</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                Description courte
                <input maxLength={180} value={form.shortDescription} onChange={(event) => setForm((previous) => ({ ...previous, shortDescription: event.target.value }))} />
              </label>
              <label>
                Description détaillée
                <textarea rows={4} maxLength={5000} value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} />
              </label>
              <label>
                URL de l’image (facultatif)
                <input type="url" placeholder="https://…" value={form.imageUrl} onChange={(event) => setForm((previous) => ({ ...previous, imageUrl: event.target.value }))} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((previous) => ({ ...previous, isPublished: event.target.checked }))} />
                Publier le produit sur la marketplace
              </label>

              {error && <div className="signup-error is-visible" role="alert">{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn" type="button" disabled={saving} onClick={() => setIsFormOpen(false)}>Annuler</button>
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
