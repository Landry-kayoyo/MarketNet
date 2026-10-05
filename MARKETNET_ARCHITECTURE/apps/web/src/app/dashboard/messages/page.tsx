import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages clients — MarketNet',
  description: 'Répondez aux demandes et questions de vos clients.',
};

const MSGS = [
  {
    initials: 'AK',
    name: 'Aisha Kamara',
    msg: 'Je voudrais commander la robe rouge en taille M.',
    time: '2 min',
    unread: true,
  },
  {
    initials: 'FM',
    name: 'Fatou M.',
    msg: 'Le sac est-il disponible en noir ?',
    time: '15 min',
    unread: true,
  },
  {
    initials: 'JD',
    name: 'Jean Dupont',
    msg: 'Bonjour, livrez-vous à Goma ?',
    time: '1h',
    unread: false,
  },
  {
    initials: 'SA',
    name: 'Sana Adama',
    msg: 'Quel est le délai de livraison pour Kinshasa ?',
    time: '3h',
    unread: false,
  },
];

export default function DashboardMessagesPage() {
  const unreadCount = MSGS.filter(m => m.unread).length;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="merchant-page-eyebrow">Communication</span>
          <h1>Messages clients</h1>
          <p>Répondez aux demandes et questions de vos clients.</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-accent" style={{ fontSize: 'var(--text-sm)', padding: '8px 14px' }}>
            <i className="bi bi-bell-fill" aria-hidden="true" />
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <section className="panel" aria-label="Liste des messages">
        {MSGS.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-chat-dots" aria-hidden="true" />
            </div>
            <p className="empty-state-title">Aucun message</p>
            <p className="empty-state-desc">
              Les messages de vos clients apparaîtront ici. Partagez votre boutique pour recevoir vos premières demandes.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {MSGS.map((m) => (
              <li key={m.name} className="message" style={m.unread ? { background: 'var(--color-primary-subtle)' } : {}}>
                <div
                  className="avatar"
                  aria-hidden="true"
                >
                  {m.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 'var(--fw-semi)' }}>
                      {m.name}
                    </strong>
                    {m.unread && (
                      <span className="badge-dot success" aria-label="Non lu" role="img" />
                    )}
                  </div>
                  <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.msg}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <time style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)' }}>
                    {m.time}
                  </time>
                  <a
                    href={`https://wa.me/?text=Bonjour ${m.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn sm success"
                    aria-label={`Répondre à ${m.name} via WhatsApp`}
                  >
                    <i className="bi bi-whatsapp" aria-hidden="true" />
                    Répondre
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
