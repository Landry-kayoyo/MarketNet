'use client';

export default function ShopShareButton({ shopName, shopId }: { shopName: string; shopId: string }) {
  function handleShare() {
    const url = `${window.location.origin}/shops/${shopId}`;
    if (navigator.share) {
      navigator.share({ title: shopName, url });
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <button
      className="shop-share-btn"
      onClick={handleShare}
      aria-label="Partager cette boutique"
      title="Partager"
    >
      <i className="bi bi-share" />
    </button>
  );
}
