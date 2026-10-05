'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const STORAGE_KEY = 'mn_cart';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
}

export interface CheckoutData {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  notes?: string;
}

interface CartCtx {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  checkout: (data: CheckoutData) => Promise<{ id: string; reference: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function load(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  // hydrate from localStorage once on mount
  useEffect(() => { setItems(load()); }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    save(next);
  }, []);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.productId);
      const next = idx >= 0
        ? prev.map((i, ix) => ix === idx ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { ...product, quantity: qty }];
      save(next);
      return next;
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      const next = qty <= 0
        ? prev.filter(i => i.productId !== productId)
        : prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i);
      save(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId);
      save(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const checkout = useCallback(async (data: CheckoutData): Promise<{ id: string; reference: string }> => {
    const current = load();
    if (!current.length) throw new Error('Le panier est vide.');

    const res = await fetch(`${API_BASE}/api/v1/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: current.map(i => ({ productId: i.productId, quantity: i.quantity })),
        customerName: data.customerName,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        deliveryAddress: data.deliveryAddress ?? null,
        deliveryCity: data.deliveryCity ?? null,
        notes: data.notes ?? null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(json?.message) ? json.message.join(', ') : (json?.message ?? `Erreur ${res.status}`);
      throw new Error(msg);
    }

    persist([]);
    return { id: json.id, reference: json.reference ?? '' };
  }, [persist]);

  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, itemCount, totalCents, open, setOpen, addItem, updateQty, removeItem, clearCart, checkout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// ── Formatter ────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(cents);

// ── Cart Drawer ──────────────────────────────────────────────────────────────

export function CartDrawer() {
  const { items, totalCents, open, setOpen, updateQty, removeItem, clearCart, checkout } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '' });
  const [err, setErr] = useState('');
  const [orderRef, setOrderRef] = useState('');

  // Reset step when drawer closes
  const handleClose = () => { setOpen(false); setTimeout(() => { if (step === 'success') setStep('cart'); }, 400); };

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const order = await checkout({
        customerName: form.name,
        customerPhone: form.phone || undefined,
        customerEmail: form.email || undefined,
        deliveryAddress: form.address || undefined,
        deliveryCity: form.city || undefined,
        notes: form.notes || undefined,
      });
      setOrderRef(order.reference || order.id.slice(-8).toUpperCase());
      setStep('success');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur lors de la commande.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cart-drawer" onClick={handleClose} role="dialog" aria-modal aria-label="Panier">
      <div className="cart-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="cart-head">
          <div>
            <h2>
              {step === 'success' ? '✅ Commande confirmée' : step === 'checkout' ? 'Votre commande' : 'Mon panier'}
            </h2>
            <p>
              {step === 'success'
                ? `Référence : MK-${orderRef}`
                : `${items.reduce((s, i) => s + i.quantity, 0)} article(s) · ${fmt(totalCents)}`}
            </p>
          </div>
          <button className="btn cart-close" onClick={handleClose} aria-label="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cart-body">

          {/* Succès */}
          {step === 'success' && (
            <div className="cart-empty">
              <div className="cart-empty-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <i className="bi bi-check-circle" />
              </div>
              <h3>Commande passée !</h3>
              <p>Le commerçant vous contactera bientôt pour confirmer et organiser la livraison.</p>
              <button className="btn primary" onClick={() => { handleClose(); setStep('cart'); }}>
                Continuer mes achats
              </button>
            </div>
          )}

          {/* Formulaire checkout */}
          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleCheckout}>
              {/* Récap commande */}
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                {items.map(item => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>{item.name} ×{item.quantity}</span>
                    <strong>{fmt(item.priceCents * item.quantity)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontWeight: 800, fontSize: 15 }}>
                  <span>Total</span><span>{fmt(totalCents)}</span>
                </div>
              </div>

              {err && (
                <div className="signup-error is-visible" style={{ marginBottom: 14 }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }} />{err}
                </div>
              )}

              <div className="checkout-form" style={{ display: 'grid', gap: 11 }}>
                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  Votre nom *
                  <input placeholder="Jean Dupont" value={form.name} onChange={set('name')} required
                    style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 11, fontSize: 13 }} />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  Téléphone *
                  <input type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={set('phone')} required
                    style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 11, fontSize: 13 }} />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  Adresse de livraison
                  <input placeholder="Quartier, rue, ville…" value={form.address} onChange={set('address')}
                    style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 11, fontSize: 13 }} />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  Ville
                  <input placeholder="Douala, Yaoundé…" value={form.city} onChange={set('city')}
                    style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 11, fontSize: 13 }} />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  Notes pour le commerçant
                  <textarea placeholder="Taille, couleur, instructions…" value={form.notes} onChange={set('notes')}
                    style={{ minHeight: 70, border: '1px solid #e2e8f0', borderRadius: 10, padding: 11, fontSize: 13, resize: 'vertical' }} />
                </label>
              </div>
            </form>
          )}

          {/* Panier */}
          {step === 'cart' && (
            items.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon"><i className="bi bi-bag" /></div>
                <h3>Panier vide</h3>
                <p>Parcourez les boutiques et ajoutez des articles à votre panier.</p>
                <button className="btn primary" onClick={handleClose}>Parcourir les produits</button>
              </div>
            ) : (
              <>
                {items.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div style={{
                      width: 66, height: 66, borderRadius: 12, flexShrink: 0,
                      background: item.imageUrl ? undefined : 'linear-gradient(135deg, #e0e9f5, #c7d7ee)',
                      display: 'grid', placeItems: 'center', color: '#94a3b8', overflow: 'hidden',
                    }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <i className="bi bi-image" style={{ fontSize: 22 }} />}
                    </div>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <div className="cart-item-price">{fmt(item.priceCents * item.quantity)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <button className="btn" style={{ minHeight: 28, width: 28, padding: 0, fontSize: 14, borderRadius: 8 }}
                          onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="btn" style={{ minHeight: 28, width: 28, padding: 0, fontSize: 14, borderRadius: 8 }}
                          onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <button className="btn danger" style={{ minHeight: 34, width: 34, padding: 0, borderRadius: 9, alignSelf: 'flex-start' }}
                      onClick={() => removeItem(item.productId)}>
                      <i className="bi bi-trash3" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                ))}
                <div className="cart-total"><span>Total</span><span>{fmt(totalCents)}</span></div>
                <button className="btn danger" style={{ width: '100%', marginTop: 4, minHeight: 36, fontSize: 12 }} onClick={clearCart}>
                  <i className="bi bi-trash3" /> Vider le panier
                </button>
              </>
            )
          )}
        </div>

        {/* ── Footer ── */}
        {step === 'cart' && items.length > 0 && (
          <div className="cart-footer">
            <button className="btn primary"
              style={{ width: '100%', minHeight: 48, fontSize: 14, fontWeight: 700, borderRadius: 13 }}
              onClick={() => setStep('checkout')}>
              <i className="bi bi-credit-card" /> Passer la commande · {fmt(totalCents)}
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="cart-footer" style={{ display: 'grid', gap: 8 }}>
            <button type="submit" form="checkout-form" className="btn primary"
              style={{ width: '100%', minHeight: 48, fontSize: 14, fontWeight: 700, borderRadius: 13 }}
              disabled={loading}>
              {loading
                ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> Envoi…</>
                : <><i className="bi bi-check-circle" /> Confirmer la commande</>}
            </button>
            <button className="btn" style={{ width: '100%', minHeight: 40 }} onClick={() => setStep('cart')} disabled={loading}>
              <i className="bi bi-arrow-left" /> Retour au panier
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
