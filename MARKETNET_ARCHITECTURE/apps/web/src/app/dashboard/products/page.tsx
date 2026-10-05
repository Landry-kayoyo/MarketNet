'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
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
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImagePreview('');
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditing(product);
    const existingImg = product.images?.[0]?.url ?? '';
    setForm({
      name: product.name,
      price: String(product.priceCents / 100),
      categoryId: product.categoryId ?? '',
      stockQuantity: String(product.stockQuantity),
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      imageUrl: existingImg,
      isPublished: product.isPublished && product.status === 'ACTIVE',
    });
    setImagePreview(existingImg);
    setError('');
    setIsFormOpen(true);
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 10 Mo.");
      return;
    }
    setError('');
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(interval); return 85; }
        return prev + 12;
      });
    }, 60);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      // Compress: max 900px wide/tall, JPEG quality 0.78
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.78);
      clearInterval(interval);
      if (compressed.length > 3_000_000) {
        setError("Image trop volumineuse après compression. Choisissez une image plus petite.");
        setUploadProgress(0);
        return;
      }
      setUploadProgress(100);
      setImagePreview(compressed);
      setForm(prev => ({ ...prev, imageUrl: compressed }));
      setTimeout(() => setUploadProgress(0), 600);
    };
    img.onerror = () => {
      clearInterval(interval);
      URL.revokeObjectURL(objectUrl);
      setError("Impossible de lire cette image. Essayez un autre fichier.");
      setUploadProgress(0);
    };
    img.src = objectUrl;
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function removeImage() {
    setImagePreview('');
    setForm(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      setImagePreview('');
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
        status: 'PUBLISHED',
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
          onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setIsFormOpen(false); } }}
          className="pmf-overlay"
        >
          <section className="pmf-panel" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="pmf-header">
              <div className="pmf-title-group">
                <div className="pmf-icon">
                  <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-plus-circle'}`} />
                </div>
                <div>
                  <h2 id="product-form-title">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
                  <p>{editing ? 'Modifiez les informations ci-dessous.' : 'Remplissez les champs pour créer votre produit.'}</p>
                </div>
              </div>
              <button className="pmf-close" type="button" aria-label="Fermer" disabled={saving} onClick={() => setIsFormOpen(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form className="pmf-form" onSubmit={saveProduct}>
              <div className="pmf-body">

                {/* Photo */}
                <div className="pmf-section">
                  <h3 className="pmf-section-title"><i className="bi bi-image" /> Photo du produit</h3>
                  <div
                    className={`pmf-dropzone${isDragOver ? ' drag-over' : ''}${imagePreview ? ' has-image' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="pmf-img-preview">
                        <img src={imagePreview} alt="Aperçu" />
                        <div className="pmf-img-overlay">
                          <button type="button" className="pmf-img-btn pmf-img-change" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}><i className="bi bi-camera" /> Changer</button>
                          <button type="button" className="pmf-img-btn pmf-img-remove" onClick={(e) => { e.stopPropagation(); removeImage(); }}><i className="bi bi-trash3" /> Supprimer</button>
                        </div>
                      </div>
                    ) : (
                      <div className="pmf-dropzone-empty">
                        <div className="pmf-dropzone-icon"><i className="bi bi-cloud-upload" /></div>
                        <p><strong>Glissez une photo ici</strong></p>
                        <p style={{ fontSize: 13, opacity: 0.65 }}>ou cliquez pour choisir un fichier</p>
                        <span className="pmf-dropzone-hint">JPG, PNG, WEBP &middot; 5 Mo max</span>
                      </div>
                    )}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="pmf-progress"><div className="pmf-progress-bar" style={{ width: `${uploadProgress}%` }} /></div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInputChange} />
                  <span className="pmf-hint"><i className="bi bi-info-circle" /> Une belle photo augmente vos ventes de 70&nbsp;%.</span>
                </div>

                {/* Infos */}
                <div className="pmf-section">
                  <h3 className="pmf-section-title"><i className="bi bi-tag" /> Informations générales</h3>
                  <div className="pmf-field">
                    <label htmlFor="pf-name">Nom du produit <span className="pmf-req">*</span></label>
                    <input id="pf-name" required minLength={2} maxLength={150} placeholder="Ex : Robe en pagne élégante" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="pmf-field">
                    <label htmlFor="pf-short">Description courte</label>
                    <input id="pf-short" maxLength={180} placeholder="Une phrase qui attire l’attention…" value={form.shortDescription} onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))} />
                    <span className="pmf-hint">{form.shortDescription.length}/180</span>
                  </div>
                  <div className="pmf-field">
                    <label htmlFor="pf-desc">Description détaillée</label>
                    <textarea id="pf-desc" rows={4} maxLength={5000} placeholder="Décrivez votre produit : matière, taille, utilisation…" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                    <span className="pmf-hint">{form.description.length}/5000</span>
                  </div>
                </div>

                {/* Prix & stock */}
                <div className="pmf-section">
                  <h3 className="pmf-section-title"><i className="bi bi-cash-coin" /> Prix &amp; stock</h3>
                  <div className="pmf-grid2">
                    <div className="pmf-field">
                      <label htmlFor="pf-price">Prix (CDF) <span className="pmf-req">*</span></label>
                      <div className="pmf-addon">
                        <span className="pmf-addon-prefix">FC</span>
                        <input id="pf-price" type="number" required min="1" step="1" placeholder="0" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
                      </div>
                    </div>
                    <div className="pmf-field">
                      <label htmlFor="pf-stock">Stock <span className="pmf-req">*</span></label>
                      <div className="pmf-addon">
                        <span className="pmf-addon-prefix"><i className="bi bi-boxes" /></span>
                        <input id="pf-stock" type="number" required min="0" step="1" placeholder="0" value={form.stockQuantity} onChange={(e) => setForm(p => ({ ...p, stockQuantity: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catégorie & visibilité */}
                <div className="pmf-section">
                  <h3 className="pmf-section-title"><i className="bi bi-grid" /> Catégorie &amp; visibilité</h3>
                  <div className="pmf-field">
                    <label htmlFor="pf-cat">Catégorie</label>
                    <select id="pf-cat" value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                      <option value="">— Sans catégorie —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="pmf-toggle">
                    <div className="pmf-toggle-info">
                      <i className={`bi ${form.isPublished ? 'bi-eye' : 'bi-eye-slash'}`} />
                      <div>
                        <strong>{form.isPublished ? 'Visible sur la marketplace' : 'Produit masqué'}</strong>
                        <p>{form.isPublished ? 'Les clients peuvent voir et commander ce produit.' : 'Enregistré mais non visible.'}</p>
                      </div>
                    </div>
                    <button type="button" className={`pmf-toggle-btn${form.isPublished ? ' on' : ''}`} onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}>
                      <span className="pmf-toggle-knob" />
                    </button>
                  </div>
                </div>

              </div>

              {error && <div className="pmf-error" role="alert"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

              <div className="pmf-footer">
                <button className="btn pmf-cancel" type="button" disabled={saving} onClick={() => setIsFormOpen(false)}>Annuler</button>
                <button className="btn primary pmf-submit" type="submit" disabled={saving}>
                  {saving ? <><i className="bi bi-arrow-repeat pmf-spin" /> Enregistrement…</> : editing ? <><i className="bi bi-check-lg" /> Enregistrer</> : <><i className="bi bi-plus-lg" /> Créer le produit</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .pmf-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(10,20,15,0.6); backdrop-filter: blur(6px); display: flex; align-items: flex-start; justify-content: flex-end; animation: pmfFade 0.2s; }
        @keyframes pmfFade { from { opacity: 0 } to { opacity: 1 } }
        .pmf-panel { width: min(560px,100vw); height: 100dvh; background: var(--color-surface); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; animation: pmfSlide 0.28s cubic-bezier(.32,0,.67,0); overflow: hidden; box-shadow: -20px 0 60px rgba(0,0,0,.18); }
        @keyframes pmfSlide { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .pmf-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--color-border); background: var(--color-bg); flex-shrink: 0; }
        .pmf-title-group { display: flex; align-items: center; gap: 14px; }
        .pmf-icon { width: 44px; height: 44px; border-radius: 12px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); display: grid; place-items: center; font-size: 20px; flex-shrink: 0; }
        .pmf-header h2 { margin: 0; font-size: 18px; font-weight: 700; }
        .pmf-header p { margin: 3px 0 0; font-size: 13px; color: var(--color-text-3); }
        .pmf-close { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-2); cursor: pointer; display: grid; place-items: center; font-size: 16px; transition: all .15s; flex-shrink: 0; }
        .pmf-close:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .pmf-form { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pmf-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 24px; }
        .pmf-section { display: flex; flex-direction: column; gap: 14px; }
        .pmf-section-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-primary); display: flex; align-items: center; gap: 7px; margin: 0; padding-bottom: 10px; border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 15%, transparent); }
        .pmf-field { display: flex; flex-direction: column; gap: 6px; }
        .pmf-field label { font-size: 13px; font-weight: 600; color: var(--color-text-2); margin: 0; }
        .pmf-req { color: #dc2626; margin-left: 2px; }
        .pmf-field input, .pmf-field select, .pmf-field textarea { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 14px; transition: border-color .15s, box-shadow .15s; font-family: inherit; }
        .pmf-field input:focus, .pmf-field select:focus, .pmf-field textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent); }
        .pmf-field textarea { resize: vertical; min-height: 90px; }
        .pmf-hint { font-size: 12px; color: var(--color-text-disabled); display: flex; align-items: center; gap: 5px; }
        .pmf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .pmf-addon { display: flex; align-items: center; border: 1.5px solid var(--color-border); border-radius: 10px; overflow: hidden; background: var(--color-bg); transition: border-color .15s, box-shadow .15s; }
        .pmf-addon:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent); }
        .pmf-addon-prefix { padding: 0 12px; font-size: 13px; font-weight: 700; color: var(--color-text-3); background: var(--color-surface-2, #f5f7f5); border-right: 1.5px solid var(--color-border); white-space: nowrap; display: flex; align-items: center; height: 42px; }
        [data-theme='dark'] .pmf-addon-prefix { background: rgba(255,255,255,.06); }
        .pmf-addon input { border: none !important; border-radius: 0 !important; box-shadow: none !important; flex: 1; min-width: 0; }
        .pmf-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid var(--color-border); background: var(--color-bg); }
        .pmf-toggle-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .pmf-toggle-info > i { font-size: 22px; color: var(--color-primary); flex-shrink: 0; }
        .pmf-toggle-info strong { font-size: 14px; display: block; margin-bottom: 2px; }
        .pmf-toggle-info p { font-size: 12px; color: var(--color-text-3); margin: 0; }
        .pmf-toggle-btn { position: relative; width: 50px; height: 28px; border-radius: 100px; border: none; background: var(--color-border); cursor: pointer; transition: background .2s; flex-shrink: 0; }
        .pmf-toggle-btn.on { background: var(--color-primary); }
        .pmf-toggle-knob { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: white; box-shadow: 0 2px 6px rgba(0,0,0,.2); transition: transform .2s; }
        .pmf-toggle-btn.on .pmf-toggle-knob { transform: translateX(22px); }
        .pmf-dropzone { border: 2px dashed var(--color-border); border-radius: 16px; background: var(--color-bg); cursor: pointer; transition: all .2s; overflow: hidden; position: relative; min-height: 180px; display: flex; align-items: center; justify-content: center; }
        .pmf-dropzone:hover, .pmf-dropzone.drag-over { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 4%, transparent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 8%, transparent); }
        .pmf-dropzone.has-image { cursor: default; border-style: solid; }
        .pmf-dropzone-empty { text-align: center; padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .pmf-dropzone-icon { width: 60px; height: 60px; border-radius: 16px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); display: grid; place-items: center; font-size: 26px; margin-bottom: 8px; }
        .pmf-dropzone-empty p { margin: 0; font-size: 14px; color: var(--color-text-2); }
        .pmf-dropzone-hint { font-size: 12px; color: var(--color-text-disabled); margin-top: 4px; padding: 4px 10px; background: var(--color-surface-2, #f5f7f5); border-radius: 6px; }
        [data-theme='dark'] .pmf-dropzone-hint { background: rgba(255,255,255,.06); }
        .pmf-img-preview { position: relative; width: 100%; }
        .pmf-img-preview img { width: 100%; height: 220px; object-fit: cover; display: block; }
        .pmf-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0; transition: opacity .2s; }
        .pmf-img-preview:hover .pmf-img-overlay { opacity: 1; }
        .pmf-img-btn { padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: transform .15s; }
        .pmf-img-change { background: white; color: #1a2e24; }
        .pmf-img-remove { background: rgba(220,38,38,.9); color: white; }
        .pmf-img-btn:hover { transform: scale(1.05); }
        .pmf-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: var(--color-border); }
        .pmf-progress-bar { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width .1s; }
        .pmf-error { margin: 0 24px 8px; padding: 12px 16px; border-radius: 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        [data-theme='dark'] .pmf-error { background: rgba(220,38,38,.12); border-color: rgba(220,38,38,.3); }
        .pmf-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--color-border); background: var(--color-bg); flex-shrink: 0; }
        .pmf-cancel { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-2); }
        .pmf-submit { min-width: 180px; }
        .pmf-spin { animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .pmf-overlay {
            align-items: flex-end;
            z-index: 900;
          }
          .pmf-panel {
            width: 100vw;
            border-left: none;
            height: calc(100dvh - 72px - 56px);
            margin-top: auto;
            border-radius: 20px 20px 0 0;
          }
          .pmf-grid2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
