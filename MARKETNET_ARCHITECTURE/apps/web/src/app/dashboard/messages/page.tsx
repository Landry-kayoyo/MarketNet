import type { Metadata } from 'next';
import MessagesList from './MessagesList';

export const metadata: Metadata = {
  title: 'Messages clients — MarketNet',
  description: 'Répondez aux demandes et questions de vos clients.',
};

export default function DashboardMessagesPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <span className="merchant-page-eyebrow">Communication</span>
          <h1>Messages clients</h1>
          <p>Répondez aux demandes et questions de vos clients.</p>
        </div>
      </div>
      <MessagesList />
    </>
  );
}
