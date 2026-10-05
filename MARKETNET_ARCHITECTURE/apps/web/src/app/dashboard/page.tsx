'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchAuthedApi, getAccessToken, mutateAuthedApi } from '@/lib/api';

type Shop = { id: string; name: string; slug: string; status: string };
type Product = {
  id: string;
  name: string;
  priceCents: number;
  stockQuantity: number;
  status: string;
  isPublished: boolean;
};
type Message = {
  id: string;
  shopId: string | null;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { fullName: string } | null;
};

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    maximumFractionDigits: 0,
  }).format(priceCents / 100);

export default function DashboardHomePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [messagesError, setMessagesError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [ownedShops, currentUser] = await Promise.all([
          fetchAuthedApi<Shop[]>('/api/v1/shops/me', token),
          fetchAuthedApi<{ id: string }>('/api/v1/auth/me', token),
        ]);
        const ownedShop = ownedShops[0] ?? null;
        setShop(ownedShop);

        if (ownedShop) {
          try {
            const shopProducts = await fetchAuthedApi<Product[]>(`/api/v1/products/shop/${ownedShop.id}`, token);
            setProducts(shopProducts);
          } catch (err) {
            console.error(err);
          }
        }

        try {
          const messages = await fetchAuthedApi<Message[]>('/api/v1/messages', token);
          const ownedShopIds = new Set(ownedShops.map((ownedShop) => ownedShop.id));
          setRecentMessages(messages
            .filter((message) =>
              message.id !== 'message-demo-001'
              && message.receiverId === currentUser.id
              && message.shopId
              && ownedShopIds.has(message.shopId),
            )
            .slice(0, 2));
        } catch (err) {
          console.error(err);
          setMessagesError(true);
        }
      } catch (err) {
        console.error(err);
        setMessagesError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function publishShop() {
    const token = getAccessToken();
    if (!token || !shop) return;
    try {
      await mutateAuthedApi(`/api/v1/shops/${shop.id}/status`, token, 'PATCH', { status: 'PUBLISHED' });
      setShop(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
    } catch (e) {
      console.error(e);
    }
  }

  const totalProducts = products.length;
  const liveProducts = products.filter(p => p.isPublished && p.status === 'ACTIVE').length;
  const livePercent = totalProducts > 0 ? Math.round((liveProducts / totalProducts) * 100) : 0;

  const KPI_DATA = [
    { label: 'Produits', value: totalProducts.toString(), icon: 'bi-box-seam',  delta: 'Dans votre boutique', up: true },
    { label: 'En ligne',  value: liveProducts.toString(), icon: 'bi-eye',       delta: `${livePercent}% du catalogue`, up: true },
    { label: 'Visites',   value: '—', icon: 'bi-graph-up', delta: 'Bientôt disponible', up: true },
    { label: 'WhatsApp',  value: '—', icon: 'bi-whatsapp',  delta: 'Bientôt disponible', up: true },
  ];

  if (loading) {
    return (
      <div className="page-head dashboard-head">
        <div>
          <h1>Chargement...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head dashboard-head">
        <div>
          <h1>Bonjour</h1>
          <p>{shop ? `${shop.name} · votre activité en un coup d'œil.` : 'Ma Boutique · votre activité en un coup d\'œil.'}</p>
        </div>
        <Link href="/dashboard/products" className="btn primary">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          <span>Ajouter un produit</span>
        </Link>
      </div>

      {/* Banner: boutique non publiée */}
      {shop && shop.status !== 'PUBLISHED' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '14px 20px', borderRadius: 14, marginBottom: 16,
          background: 'linear-gradient(115deg, #fffbea, #fff3cd)',
          border: '1.5px solid #f5c518', boxShadow: '0 3px 12px rgba(245,197,24,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', fontSize: 20 }} />
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>Votre boutique n&apos;est pas encore visible</strong>
              <span style={{ fontSize: 12, color: '#92400e' }}>Elle est en brouillon. Publiez-la pour qu&apos;elle apparaisse sur la marketplace.</span>
            </div>
          </div>
          <button className="btn" style={{ background: '#d97706', color: 'white', borderColor: '#d97706', whiteSpace: 'nowrap' }} onClick={publishShop}>
            <i className="bi bi-send" /> Publier maintenant
          </button>
        </div>
      )}

      <div className="kpis" role="region" aria-label="Indicateurs clés">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.label} className="kpi">
            <span className="kpi-label">{kpi.label}</span>
            <strong className="kpi-value">{kpi.value}</strong>
            <div className={`kpi-delta ${kpi.up ? 'up' : 'down'}`}>
              <i className={`bi ${kpi.up ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`} aria-hidden="true" />
              {kpi.delta}
            </div>
            <div className="kpi-icon" aria-hidden="true">
              <i className={`bi ${kpi.icon}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="recent-products-title">
          <div className="head">
            <div>
              <h3 id="recent-products-title">Produits récents</h3>
              <p>Les derniers articles de votre catalogue.</p>
            </div>
            <Link href="/dashboard/products" className="btn sm">
              Voir tout <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Produit</th>
                  <th scope="col">Prix</th>
                  <th scope="col">Stock</th>
                  <th scope="col">État</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                      Aucun produit trouvé.
                    </td>
                  </tr>
                )}
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                        {p.name}
                      </strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text)' }}>
                      {formatPrice(p.priceCents)}
                    </td>
                    <td>
                      <span style={{
                        color: p.stockQuantity === 0 ? 'var(--color-danger-text)' : p.stockQuantity < 5 ? 'var(--color-warning-text)' : 'var(--color-text-2)',
                        fontWeight: 'var(--fw-semi)',
                      }}>
                        {p.stockQuantity === 0 ? '— Rupture' : p.stockQuantity}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${p.isPublished && p.status === 'ACTIVE' ? 'live' : 'hidden'}`}>
                        <span className={`badge-dot ${p.isPublished && p.status === 'ACTIVE' ? 'success' : 'neutral'}`} aria-hidden="true" />
                        {p.isPublished && p.status === 'ACTIVE' ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td>
                      <Link
                        href="/dashboard/products"
                        className="btn sm ghost icon-only"
                        aria-label={`Modifier ${p.name}`}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <section className="panel" aria-labelledby="quick-access-title">
            <div className="head">
              <div>
                <h3 id="quick-access-title">Accès rapide</h3>
                <p>Navigation essentielle.</p>
              </div>
            </div>
            <div className="quick-actions">
              <Link href="/dashboard/messages" className="btn">
                <i className="bi bi-chat-dots" aria-hidden="true" />
                Messages
              </Link>
              <Link href="/dashboard/orders" className="btn">
                <i className="bi bi-bag-check" aria-hidden="true" />
                Commandes
              </Link>
              <Link href="/dashboard/shop" className="btn">
                <i className="bi bi-palette" aria-hidden="true" />
                Ma boutique
              </Link>
              <button className="btn" disabled>
                <i className="bi bi-bar-chart" aria-hidden="true" />
                Analyses
              </button>
            </div>
          </section>

          <section className="panel" aria-labelledby="messages-title">
            <div className="head">
              <div>
                <h3 id="messages-title">Messages récents</h3>
                <p>Demandes de vos clients.</p>
              </div>
              <Link href="/dashboard/messages" className="btn sm">
                Voir tout
              </Link>
            </div>
            <div role="list">
              {messagesError ? (
                <p className="muted" role="status">Impossible de charger les messages pour le moment.</p>
              ) : recentMessages.length === 0 ? (
                <p className="muted" role="status">Aucun message client reçu pour le moment.</p>
              ) : recentMessages.map((message) => {
                const name = message.sender?.fullName || 'Client';
                const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
                return (
                  <div key={message.id} className="message" role="listitem">
                    <div className="avatar" aria-hidden="true">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                        {name}
                      </strong>
                      <p style={{ margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {message.content}
                      </p>
                    </div>
                    <time
                      style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}
                      dateTime={message.createdAt}
                    >
                      {new Intl.DateTimeFormat('fr-CD', { dateStyle: 'short' }).format(new Date(message.createdAt))}
                    </time>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
