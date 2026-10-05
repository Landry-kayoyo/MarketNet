'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/cart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const fmt = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(cents);

type Product = {
  id: string; shopId: string; name: string; slug: string;
  shortDescription: string | null; description: string | null;
  priceCents: number; compareAtPriceCents: number | null;
  stockQuantity: number; status: string; isPublished: boolean;
  images?: { url: string; isPrimary: boolean }[];
};
type Shop = {
  id: string; name: string; slug: string; whatsapp: string | null;
  branding?: { primary?: string; secondary?: string; radius?: string; imageFit?: string; logoShape?: string };
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

  const { addItem, setOpen, itemCount } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const p: Product = await fetch(`${API_BASE}/api/v1/products/${id}`).then(r => r.json());
        if (!p?.id) return;
        setProduct(p);
        const [s, all]: [Shop, Product[]] = await Promise.all([
          fetch(`${API_BASE}/api/v1/shops/${p.shopId}`).then(r => r.json()),
          fetch(`${API_BASE}/api/v1/products`).then(r => r.json()),
        ]);
        setShop(s);
        setSimilar((all as Product[]).filter(x => x.shopId === p.shopId && x.id !== p.id).slice(0, 4));
      } catch { /* ignore */ }
    }
    load();
  }, [id]);

  if (!product || !shop) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f8fc' }}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: 32, animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const imgs = product.images?.length ? product.images.map(i => i.url) : [''];
  const primaryImg = product.images?.find(i => i.isPrimary)?.url ?? imgs[0] ?? '';
  const b = shop.branding ?? {};
  const primaryColor = b.primary ?? '#2563eb';

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
      <header className="topbar">
        <Link href={`/shops/${shop.id}`} className="btn">
          <i className="bi bi-arrow-left" />
          <span className="label">Boutique</span>
        </Link>
        <Link href="/" className="brand brand-btn" style={{ textDecoration: 'none' }}>MarketNet</Link>
        <div className="top-actions">
          <button className="btn cart-pill" onClick={() => setOpen(true)}>
            <i className="bi bi-bag" />
            <span className="label">Panier</span>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
          <Link href="/login" className="btn">
            <i className="bi bi-person-circle" />
            <span className="label">Espace commerçant</span>
          </Link>
        </div>
      </header>

      <main
        className="content store-themed"
        style={{
          ['--shop-primary' as string]: primaryColor,
          ['--shop-secondary' as string]: b.secondary ?? '#0f172a',
          ['--shop-radius' as string]: b.radius ?? '17px',
          ['--shop-image-fit' as string]: b.imageFit ?? 'cover',
          ['--shop-logo-radius' as string]: b.logoShape === 'round' ? '50%' : '19px',
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
              <div className="detail-main-image" style={{ display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: 40 }}>
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
              {product.stockQuantity > 0 ? `✓ En stock · ${product.stockQuantity} disponible(s)` : '✗ Indisponible'}
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
                    background: feedback.ok ? '#f0fdf4' : '#fff1f2',
                    color: feedback.ok ? '#15803d' : '#b91c1c',
                    border: `1px solid ${feedback.ok ? '#bbf7d0' : '#fecaca'}`,
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
                <div style={{ padding: '14px', textAlign: 'center', color: '#b91c1c', fontWeight: 700, fontSize: 13 }}>
                  <i className="bi bi-x-circle" style={{ marginRight: 6 }} />
                  Produit actuellement indisponible
                </div>
              </div>
            )}

            <div className="detail-actions" style={{ marginTop: 12 }}>
              {whatsappMsg ? (
                <a href={whatsappMsg} target="_blank" rel="noreferrer" className="btn success">
                  <i className="bi bi-whatsapp" /> Contacter {shop.name}
                </a>
              ) : (
                <button className="btn success" disabled>
                  <i className="bi bi-whatsapp" /> WhatsApp non renseigné
                </button>
              )}
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
                      : <div style={{ width: '100%', height: 190, display: 'grid', placeItems: 'center', background: '#f1f5f9', color: '#94a3b8', fontSize: 32 }}><i className="bi bi-image" /></div>}
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
        <a href={whatsappMsg} target="_blank" rel="noreferrer" className="whatsapp-float">
          <i className="bi bi-whatsapp" /><span>WhatsApp</span>
        </a>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
