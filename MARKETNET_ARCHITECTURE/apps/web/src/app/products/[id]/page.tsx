'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/cart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

const fmt = (cents: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(cents / 100);

type Product = {
  id: string; shopId: string; name: string; slug: string;
  shortDescription: string | null; description: string | null;
  priceCents: number; compareAtPriceCents: number | null;
  stockQuantity: number; status: string; isPublished: boolean;
  images?: { url: string; isPrimary: boolean }[];
};
type Shop = {
  id: string; name: string; slug: string; whatsapp: string | null; logoUrl: string | null;
  branding?: { primary?: string; secondary?: string; accent?: string; radius?: string; imageFit?: string; logoShape?: string };
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addItem, setOpen, itemCount } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/products/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.message ?? `Erreur ${res.status}`);
          return;
        }
        const p: Product = await res.json();
        if (!p?.id) { setError('Produit introuvable.'); return; }
        setProduct(p);
        const [s, all]: [Shop, Product[]] = await Promise.all([
          fetch(`${API_BASE}/api/v1/shops/${p.shopId}`).then(r => r.json()),
          fetch(`${API_BASE}/api/v1/products`).then(r => r.json()),
        ]);
        if (!s?.id) { setError('Boutique introuvable.'); return; }
        setShop(s);
        setSimilar((all as Product[]).filter(x => x.shopId === p.shopId && x.id !== p.id).slice(0, 4));
      } catch (e: any) {
        setError(e?.message ?? 'Impossible de charger le produit.');
      }
    }
    load();
  }, [id]);

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)', textAlign: 'center', padding: 24 }}>
        <div>
          <i className="bi bi-exclamation-triangle" style={{ fontSize: 48, color: 'var(--color-danger-text, #dc2626)' }} />
          <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 700 }}>Produit non disponible</h2>
          <p style={{ color: 'var(--color-text-muted, #6b7280)', marginTop: 8 }}>{error}</p>
          <Link href="/" style={{ marginTop: 20, display: 'inline-block', padding: '10px 20px', background: 'var(--color-primary, #286b50)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)' }}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: 32, animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const imgs = product.images?.length ? product.images.map(i => i.url) : [''];
  const primaryImg = product.images?.find(i => i.isPrimary)?.url ?? imgs[0] ?? '';
  const b = shop.branding ?? {};
  const primaryColor = b.primary ?? '#286b50';

  function handleAdd(openDrawer = false) {
    addItem({
      productId: product!.id,
      name: product!.name,
      priceCents: product!.priceCents,
      imageUrl: primaryImg || undefined,
    }, qty);

    if (openDrawer) {
      setOpen(true);
    } else {
      setFeedback({ msg: `${qty} × ${product!.name} ajouté au panier !`, ok: true });
      setTimeout(() => setFeedback(null), 2500);
    }
  }

  const whatsappMsg = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${product.name} (${fmt(product.priceCents)})`)}` 
    : null;

  return (
    <div className="app public-app detail-page">
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="shop-topbar-logo">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} />
            ) : (
              <span className="shop-topbar-logo-fallback">
                <i className="bi bi-shop" />
              </span>
            )}
          </div>
          <Link href="/" className="brand" style={{ textDecoration: 'none', margin: 0 }}>MarketNet</Link>
        </div>
        <div className="top-actions">
          <button className="btn cart-pill" onClick={() => setOpen(true)}>
            <i className="bi bi-bag" />
            <span className="label">Panier</span>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      <main
        className="content store-themed"
        style={{
          ['--shop-primary' as string]: primaryColor,
          ['--shop-secondary' as string]: b.secondary ?? '#182b24',
          ['--shop-accent' as string]: b.accent ?? '#d6a84f',
          ['--shop-radius' as string]: b.radius ?? '17px',
          ['--shop-image-fit' as string]: b.imageFit ?? 'cover',
          ['--shop-logo-radius' as string]: b.logoShape === 'round' || b.logoShape === '50%' ? '50%' : b.logoShape === 'square' || b.logoShape === '4px' ? '4px' : '16px',
        }}
      >
        <div className="breadcrumbs">
          <Link href="/">MarketNet</Link>
          <i className="bi bi-chevron-right" />
          <Link href={`/shops/${shop.id}`}>{shop.name}</Link>
          <i className="bi bi-chevron-right" />
          <span>{product.name}</span>
        </div>

        <section className="detail">
          {/* Médias */}
          <div className="detail-media">
            {imgs[imgIdx] ? (
              <img className="detail-main-image" src={imgs[imgIdx]} alt={product.name} />
            ) : (
              <div className="detail-main-image" style={{ display: 'grid', placeItems: 'center', color: 'var(--color-text-disabled)', fontSize: 40 }}>
                <i className="bi bi-image" />
              </div>
            )}
            {imgs.length > 1 && (
              <div className="detail-gallery">
                {imgs.map((im, i) => (
                  <button key={i} className={`detail-thumb ${i === imgIdx ? 'active' : ''}`} onClick={() => setImgIdx(i)}>
                    <img src={im} alt={`Vue ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="panel detail-info">
            <h1>{product.name}</h1>
            <div className="rating-summary">
              <span className="stars">★★★★★</span>
              <strong>4.8</strong>
              <span className="muted">12 avis</span>
            </div>

            <div className="price" style={{ fontSize: 29 }}>{fmt(product.priceCents)}</div>
            {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
              <div className="muted" style={{ fontSize: 13, textDecoration: 'line-through' }}>
                {fmt(product.compareAtPriceCents)}
              </div>
            )}
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {product.stockQuantity > 0 ? `En stock · ${product.stockQuantity} disponible(s)` : 'Indisponible'}
            </div>

            <p>{product.description ?? product.shortDescription ?? 'Produit disponible dans cette boutique.'}</p>

            {/* Buy box — SANS connexion requise */}
            {product.stockQuantity > 0 ? (
              <div className="buy-box">
                <div className="qty-row">
                  <strong>Quantité</strong>
                  <div className="qty-control">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <input
                      value={qty}
                      onChange={e => setQty(Math.min(product.stockQuantity, Math.max(1, +e.target.value || 1)))}
                      style={{ width: 42, textAlign: 'center', border: 0, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', outline: 0, fontWeight: 800, height: 40 }}
                    />
                    <button onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}>+</button>
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>Max. {product.stockQuantity}</span>
                </div>

                {feedback && (
                  <div style={{
                    marginTop: 8, padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: feedback.ok ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
                    color: feedback.ok ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    border: `1px solid ${feedback.ok ? 'var(--color-success-muted)' : 'var(--color-danger-muted)'}`,
                  }}>
                    <i className={`bi ${feedback.ok ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} style={{ marginRight: 6 }} />
                    {feedback.msg}
                  </div>
                )}

                <div className="buy-actions">
                  <button className="btn" onClick={() => handleAdd(false)}>
                    <i className="bi bi-bag-plus" /> Ajouter
                  </button>
                  <button className="btn primary" onClick={() => handleAdd(true)}>
                    <i className="bi bi-lightning-fill" /> Commander
                  </button>
                </div>
              </div>
            ) : (
              <div className="buy-box">
                <div style={{ padding: '14px', textAlign: 'center', color: 'var(--color-danger-text)', fontWeight: 700, fontSize: 13 }}>
                  <i className="bi bi-x-circle" style={{ marginRight: 6 }} />
                  Produit actuellement indisponible
                </div>
              </div>
            )}

            <div className="detail-actions" style={{ marginTop: 12 }}>
              <Link href={`/shops/${shop.id}`} className="btn">Voir la boutique</Link>
            </div>
          </div>
        </section>

        {/* Produits similaires */}
        {similar.length > 0 && (
          <section className="section" style={{ marginTop: 18 }}>
            <div className="section-head">
              <div><h2>Vous pourriez aussi aimer</h2><p>D&apos;autres produits de la boutique.</p></div>
              <Link href={`/shops/${shop.id}`} className="btn">Voir tout</Link>
            </div>
            <div className="similar-grid">
              {similar.map(x => {
                const img = x.images?.find(i => i.isPrimary)?.url ?? x.images?.[0]?.url ?? null;
                return (
                  <article key={x.id} className="product-card similar-card">
                    {img
                      ? <img src={img} alt={x.name} />
                      : <div style={{ width: '100%', height: 190, display: 'grid', placeItems: 'center', background: 'var(--color-surface-2)', color: 'var(--color-text-disabled)', fontSize: 32 }}><i className="bi bi-image" /></div>}
                    <div className="product-body">
                      <h3>{x.name}</h3>
                      <div className="price">{fmt(x.priceCents)}</div>
                      <Link href={`/products/${x.id}`} className="btn" style={{ marginTop: 8 }}>Voir le détail</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {whatsappMsg && (
        <a href={whatsappMsg} target="_blank" rel="noreferrer" className="shop-fab" aria-label="Contacter sur WhatsApp">
          <i className="bi bi-whatsapp" />
        </a>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
