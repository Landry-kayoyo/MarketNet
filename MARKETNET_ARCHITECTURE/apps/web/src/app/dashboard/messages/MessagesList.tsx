'use client';

import { useEffect, useState } from 'react';
import { fetchAuthedApi, getAccessToken } from '@/lib/api';

type Message = {
  id: string;
  shopId: string | null;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { fullName: string } | null;
  receiver: { fullName: string } | null;
  shop: { name: string } | null;
  order: { id: string; status: string } | null;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-CD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMessages() {
      const token = getAccessToken();
      if (!token) {
        setError('Reconnectez-vous pour consulter vos messages.');
        setLoading(false);
        return;
      }

      try {
        const [user, inbox, ownedShops] = await Promise.all([
          fetchAuthedApi<{ id: string }>('/api/v1/auth/me', token),
          fetchAuthedApi<Message[]>('/api/v1/messages', token),
          fetchAuthedApi<{ id: string }[]>('/api/v1/shops/me', token),
        ]);
        setUserId(user.id);
        const ownedShopIds = new Set(ownedShops.map((shop) => shop.id));
        setMessages(inbox.filter((message) =>
          message.id !== 'message-demo-001'
          && message.receiverId === user.id
          && message.shopId
          && ownedShopIds.has(message.shopId),
        ));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Impossible de charger les messages.');
      } finally {
        setLoading(false);
      }
    }

    void loadMessages();
  }, []);

  const unreadCount = messages.filter((message) => message.receiverId === userId && !message.isRead).length;

  if (loading) {
    return <section className="panel" aria-live="polite">Chargement des messages…</section>;
  }

  if (error) {
    return (
      <section className="panel" role="alert">
        <div className="empty-state">
          <div className="empty-state-icon"><i className="bi bi-exclamation-circle" aria-hidden="true" /></div>
          <p className="empty-state-title">Messages indisponibles</p>
          <p className="empty-state-desc">{error}</p>
        </div>
      </section>
    );
  }

  if (messages.length === 0) {
    return (
      <section className="panel" aria-label="Liste des messages">
        <div className="empty-state">
          <div className="empty-state-icon"><i className="bi bi-chat-dots" aria-hidden="true" /></div>
          <p className="empty-state-title">Aucun message client reçu pour le moment</p>
          <p className="empty-state-desc">Les messages associés à vos boutiques apparaîtront ici.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {unreadCount > 0 && (
        <div className="page-head" style={{ marginTop: -8 }}>
          <span className="badge badge-accent" style={{ fontSize: 'var(--text-sm)', padding: '8px 14px' }}>
            <i className="bi bi-bell-fill" aria-hidden="true" />
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
      <section className="panel" aria-label="Liste des messages réels">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {messages.map((message) => {
            const incoming = message.receiverId === userId;
            const name = incoming
              ? message.sender?.fullName || 'Expéditeur'
              : message.receiver?.fullName || 'Destinataire';
            const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
            const unread = incoming && !message.isRead;

            return (
              <li key={message.id} className="message" style={unread ? { background: 'var(--color-primary-subtle)' } : undefined}>
                <div className="avatar" aria-hidden="true">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                      {incoming ? name : `Vous → ${name}`}
                    </strong>
                    {unread && <span className="badge-dot success" aria-label="Non lu" role="img" />}
                  </div>
                  {message.shop && <small className="muted">{message.shop.name}</small>}
                  <p style={{ margin: '4px 0 0', overflowWrap: 'anywhere' }}>{message.content}</p>
                  {message.order && <small className="muted">Commande · {message.order.status}</small>}
                </div>
                <time dateTime={message.createdAt} style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                  {formatDate(message.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
