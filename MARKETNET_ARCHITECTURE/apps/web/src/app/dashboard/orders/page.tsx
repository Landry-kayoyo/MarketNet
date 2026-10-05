import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commandes — MarketNet',
  description: 'Suivez et gérez vos commandes clients.',
};

export default function DashboardOrdersPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <span className="merchant-page-eyebrow">Ventes</span>
          <h1>Commandes</h1>
          <p>Suivez et gérez vos commandes clients.</p>
        </div>
      </div>

      {/* État vide — commandes */}
      <div className="panel">
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-bag-check" aria-hidden="true" />
          </div>
          <p className="empty-state-title">Aucune commande pour le moment</p>
          <p className="empty-state-desc">
            Dès qu&apos;un client vous contacte pour acheter un produit, la commande apparaîtra ici.
            Partagez votre boutique pour attirer vos premiers clients.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/dashboard/products" className="btn primary">
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Ajouter des produits
            </Link>
            <Link href="/dashboard/shop" className="btn">
              <i className="bi bi-share" aria-hidden="true" />
              Partager ma boutique
            </Link>
          </div>
        </div>
      </div>

      {/* Info : fonctionnalité à venir */}
      <div className="alert alert-info" style={{ marginTop: 'var(--space-5)' }}>
        <i className="bi bi-info-circle-fill" aria-hidden="true" />
        <span>
          <strong>Bientôt disponible :</strong> la gestion des commandes avec suivi en temps réel, statuts de livraison et historique des transactions.
        </span>
      </div>
    </>
  );
}
