'use client';

import { useEffect, useState, FormEvent } from 'react';
import { fetchAuthedApi, getAccessToken, mutateAuthedApi } from '@/lib/api';

type ThemeSettings = {
  primary: string;
  secondary: string;
  accent: string;
  radius: string;
  logoShape: 'rounded' | 'round' | 'square';
  imageFit: 'cover' | 'contain';
  cardStyle: 'soft' | 'minimal' | 'luxury';
  fontStyle: 'modern' | 'editorial';
};

type ShopBranding = Partial<ThemeSettings> & {
  customThemeName?: string;
  customTheme?: ThemeSettings;
};

type Shop = {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  branding?: ShopBranding;
};

const THEMES: { id: string; name: string; description: string; branding: ThemeSettings }[] = [
  { id: 'atelier', name: 'Atelier naturel', description: 'Artisanat, beauté et produits locaux', branding: { primary: '#286b50', secondary: '#182b24', accent: '#d6a84f', radius: '16px', logoShape: 'rounded', imageFit: 'cover', cardStyle: 'soft', fontStyle: 'modern' } },
  { id: 'prestige', name: 'Maison Prestige', description: 'Une vitrine élégante aux tons dorés', branding: { primary: '#9a6b2f', secondary: '#211b16', accent: '#e5c27a', radius: '12px', logoShape: 'square', imageFit: 'cover', cardStyle: 'luxury', fontStyle: 'editorial' } },
  { id: 'minuit', name: 'Minuit moderne', description: 'Contraste profond et lignes nettes', branding: { primary: '#6366f1', secondary: '#111827', accent: '#a5b4fc', radius: '8px', logoShape: 'square', imageFit: 'cover', cardStyle: 'minimal', fontStyle: 'modern' } },
  { id: 'soleil', name: 'Soleil de cuivre', description: 'Chaleureux et vivant, parfait pour la mode', branding: { primary: '#c2410c', secondary: '#431407', accent: '#fbbf24', radius: '22px', logoShape: 'round', imageFit: 'cover', cardStyle: 'soft', fontStyle: 'modern' } },
  { id: 'lagon', name: 'Lagon', description: 'Fraîcheur et confiance inspirées de l’océan', branding: { primary: '#087e8b', secondary: '#073642', accent: '#52d1c5', radius: '12px', logoShape: 'rounded', imageFit: 'contain', cardStyle: 'minimal', fontStyle: 'modern' } },
  { id: 'editorial', name: 'Éditorial', description: 'Une composition raffinée et minimaliste', branding: { primary: '#3f5146', secondary: '#242923', accent: '#c49a6c', radius: '4px', logoShape: 'square', imageFit: 'contain', cardStyle: 'luxury', fontStyle: 'editorial' } },
];

const DEFAULT_THEME = THEMES[0].branding;

function getThemeSettings(branding: ShopBranding): ThemeSettings {
  const storedRadius = branding.radius ?? DEFAULT_THEME.radius;
  const radius = ['4px', '8px', '12px', '16px', '24px'].includes(storedRadius)
    ? storedRadius
    : ['17px', '18px', '19px', '20px'].includes(storedRadius) ? '16px'
      : ['21px', '22px', '23px'].includes(storedRadius) ? '24px' : DEFAULT_THEME.radius;
  const storedLogoShape = branding.logoShape as string | undefined;
  const logoShape: ThemeSettings['logoShape'] = storedLogoShape === 'round' || storedLogoShape === '50%'
    ? 'round'
    : storedLogoShape === 'square' || storedLogoShape === '4px' || storedLogoShape === '8px' ? 'square' : 'rounded';
  return {
    primary: branding.primary ?? DEFAULT_THEME.primary,
    secondary: branding.secondary ?? DEFAULT_THEME.secondary,
    accent: branding.accent ?? DEFAULT_THEME.accent,
    radius,
    logoShape,
    imageFit: branding.imageFit === 'contain' ? 'contain' : 'cover',
    cardStyle: branding.cardStyle === 'minimal' || branding.cardStyle === 'luxury' ? branding.cardStyle : 'soft',
    fontStyle: branding.fontStyle === 'editorial' ? 'editorial' : 'modern',
  };
}

export default function DashboardShopPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '', slogan: '', description: '',
    city: '', country: '', whatsapp: '', address: '',
    logoUrl: '', coverUrl: ''
  });
  const [branding, setBranding] = useState<ShopBranding>(DEFAULT_THEME);
  const [activeThemeId, setActiveThemeId] = useState('atelier');
  const [customThemeName, setCustomThemeName] = useState('Mon modèle');

  useEffect(() => {
    async function loadShop() {
      try {
        const token = getAccessToken();
        if (!token) return;
        const shops = await fetchAuthedApi<Shop[]>('/api/v1/shops/me', token);
        if (shops && shops.length > 0) {
          const s = shops[0];
          setShop(s);
          setFormData({
            name: s.name || '',
            slogan: s.slogan || '',
            description: s.description || '',
            city: s.city || '',
            country: s.country || '',
            whatsapp: s.whatsapp || '',
            address: s.address || '',
            logoUrl: s.logoUrl || '',
            coverUrl: s.coverUrl || '',
          });
          if (s.branding) {
            setBranding({ ...DEFAULT_THEME, ...s.branding });
            setCustomThemeName(s.branding.customThemeName || 'Mon modèle');
            const savedSettings = getThemeSettings(s.branding);
            const matchedTheme = THEMES.find((theme) =>
              theme.branding.primary === savedSettings.primary
              && theme.branding.secondary === savedSettings.secondary
              && theme.branding.radius === savedSettings.radius,
            );
            setActiveThemeId(matchedTheme?.id ?? 'custom');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleThemeSelect = (themeId: string) => {
    if (themeId === 'my-custom' && branding.customTheme) {
      setBranding((previous) => ({ ...previous, ...branding.customTheme }));
      setActiveThemeId(themeId);
      return;
    }
    setActiveThemeId(themeId);
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) setBranding((previous) => ({ ...previous, ...theme.branding }));
  };

  const handleBrandingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setBranding((previous) => ({ ...previous, [key]: value }));
    setActiveThemeId('custom');
  };

  const handleSaveCustomTheme = async () => {
    const name = customThemeName.trim();
    if (name.length < 2 || name.length > 40) {
      setError('Le nom de votre modèle doit contenir entre 2 et 40 caractères.');
      return;
    }
    if (!shop) return;

    setSaving(true);
    setError('');
    setSuccess('');
    const nextBranding: ShopBranding = {
      ...branding,
      customThemeName: name,
      customTheme: getThemeSettings(branding),
    };
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Non autorisé');
      await mutateAuthedApi(`/api/v1/shops/${shop.id}`, token, 'PATCH', { branding: nextBranding });
      setBranding(nextBranding);
      setActiveThemeId('my-custom');
      setSuccess(`Modèle « ${name} » enregistré pour votre boutique.`);
      setTimeout(() => setSuccess(''), 3500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer votre modèle.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'coverUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide.');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = field === 'logoUrl' ? 400 : 1600;
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (dataUrl.length > 3_000_000) {
          setError('Image trop volumineuse après compression. Choisissez une image plus petite.');
          return;
        }
        setFormData(prev => ({ ...prev, [field]: dataUrl }));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Impossible de lire cette image. Essayez un autre fichier.');
    };
    img.src = objectUrl;
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Le nom de la boutique est obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Non autorisé');
      const newShop = await mutateAuthedApi<Shop>('/api/v1/shops', token, 'POST', {
        name: formData.name.trim(),
      });
      setShop(newShop);
      setSuccess('Boutique créée avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Non autorisé");
      await mutateAuthedApi(`/api/v1/shops/${shop.id}`, token, 'PATCH', {
        ...formData,
        branding
      });
      setSuccess('Boutique mise à jour avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = getThemeSettings(branding);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  if (!shop) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 30, background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
        <h1 style={{ marginBottom: 8, fontSize: 24, textAlign: 'center' }}>Bienvenue !</h1>
        <p style={{ textAlign: 'center', marginBottom: 24, color: 'var(--color-text-2)' }}>Vous n&apos;avez pas encore de boutique. Créez-la maintenant pour commencer à vendre.</p>
        
        {error && <div style={{ color: 'red', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>{error}</div>}
        
        <div className="form">
          <label>
            Nom de la boutique
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Ma Super Boutique" autoFocus />
          </label>
          <button className="btn primary" style={{ width: '100%', marginTop: 12, height: 44 }} onClick={handleCreate} disabled={saving}>
            {saving ? 'Création en cours...' : 'Créer ma boutique'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="merchant-page-eyebrow">Personnalisation</span>
          <h1>Ma boutique</h1>
          <p>Personnalisez l&apos;apparence de votre vitrine.</p>
        </div>
        <button className="btn primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? <i className="bi bi-hourglass-split" /> : <i className="bi bi-check-lg" />}
          {saving ? ' Enregistrement...' : ' Enregistrer'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 16 }}>{success}</div>}

      <div className="builder-v26">
        <section aria-labelledby="shop-settings-title">
          <h2 id="shop-settings-title" className="sr-only">Paramètres de la boutique</h2>

          {/* Modèles (Thèmes) */}
          <div className="panel shop-theme-editor" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="head shop-theme-head">
              <div>
                <span className="merchant-page-eyebrow">Studio de création</span>
                <h3>Choisissez votre identité</h3>
                <p>Partez d’un modèle premium, puis adaptez les couleurs et la présentation à votre marque.</p>
              </div>
            </div>
            <div className="shop-theme-gallery" role="group" aria-label="Modèles de boutique">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`shop-theme-option${activeThemeId === theme.id ? ' is-active' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                  aria-pressed={activeThemeId === theme.id}
                >
                  <span className="shop-theme-swatch" style={{ background: `linear-gradient(135deg, ${theme.branding.secondary} 0 45%, ${theme.branding.primary} 45% 78%, ${theme.branding.accent} 78%)` }}>
                    <span className="shop-theme-swatch-card" />
                    {activeThemeId === theme.id && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
                  </span>
                  <span className="shop-theme-option-copy">
                    <strong>{theme.name}</strong>
                    <small>{theme.description}</small>
                  </span>
                </button>
              ))}
              {branding.customTheme && (
                <button
                  type="button"
                  className={`shop-theme-option${activeThemeId === 'my-custom' ? ' is-active' : ''}`}
                  onClick={() => handleThemeSelect('my-custom')}
                  aria-pressed={activeThemeId === 'my-custom'}
                >
                  <span className="shop-theme-swatch" style={{ background: `linear-gradient(135deg, ${branding.customTheme.secondary} 0 45%, ${branding.customTheme.primary} 45% 78%, ${branding.customTheme.accent} 78%)` }}>
                    <span className="shop-theme-swatch-card" />
                    {activeThemeId === 'my-custom' && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
                  </span>
                  <span className="shop-theme-option-copy">
                    <strong>{branding.customThemeName || 'Mon modèle'}</strong>
                    <small>Votre identité enregistrée</small>
                  </span>
                </button>
              )}
            </div>

            <div className="shop-theme-customizer">
              <div className="shop-theme-customizer-head">
                <div>
                  <h4>Personnalisez chaque détail</h4>
                  <p>Vos changements apparaissent immédiatement dans l’aperçu.</p>
                </div>
                <span className="shop-theme-live-label"><i className="bi bi-stars" aria-hidden="true" /> Édition libre</span>
              </div>

              <div className="shop-theme-colors">
                <label className="shop-theme-color-field">
                  <span>Couleur principale</span>
                  <span className="shop-theme-color-input"><input type="color" value={currentTheme.primary} onChange={(event) => handleBrandingChange('primary', event.target.value)} /><code>{currentTheme.primary.toUpperCase()}</code></span>
                </label>
                <label className="shop-theme-color-field">
                  <span>Couleur du bandeau</span>
                  <span className="shop-theme-color-input"><input type="color" value={currentTheme.secondary} onChange={(event) => handleBrandingChange('secondary', event.target.value)} /><code>{currentTheme.secondary.toUpperCase()}</code></span>
                </label>
                <label className="shop-theme-color-field">
                  <span>Couleur d’accent</span>
                  <span className="shop-theme-color-input"><input type="color" value={currentTheme.accent} onChange={(event) => handleBrandingChange('accent', event.target.value)} /><code>{currentTheme.accent.toUpperCase()}</code></span>
                </label>
              </div>

              <div className="form-grid shop-theme-selects">
                <label>
                  Forme des cartes
                  <select value={currentTheme.radius} onChange={(event) => handleBrandingChange('radius', event.target.value)}>
                    <option value="4px">Angles droits</option>
                    <option value="8px">Compact</option>
                    <option value="12px">Modéré</option>
                    <option value="16px">Doux</option>
                    <option value="24px">Arrondi</option>
                  </select>
                </label>
                <label>
                  Forme du logo
                  <select value={currentTheme.logoShape} onChange={(event) => handleBrandingChange('logoShape', event.target.value as ThemeSettings['logoShape'])}>
                    <option value="rounded">Carré arrondi</option>
                    <option value="round">Rond</option>
                    <option value="square">Carré</option>
                  </select>
                </label>
                <label>
                  Affichage des photos
                  <select value={currentTheme.imageFit} onChange={(event) => handleBrandingChange('imageFit', event.target.value as ThemeSettings['imageFit'])}>
                    <option value="cover">Remplir le cadre</option>
                    <option value="contain">Afficher toute l’image</option>
                  </select>
                </label>
                <label>
                  Style des cartes
                  <select value={currentTheme.cardStyle} onChange={(event) => handleBrandingChange('cardStyle', event.target.value as ThemeSettings['cardStyle'])}>
                    <option value="soft">Élégant et doux</option>
                    <option value="minimal">Minimal</option>
                    <option value="luxury">Premium</option>
                  </select>
                </label>
                <label>
                  Style des titres
                  <select value={currentTheme.fontStyle} onChange={(event) => handleBrandingChange('fontStyle', event.target.value as ThemeSettings['fontStyle'])}>
                    <option value="modern">Moderne</option>
                    <option value="editorial">Éditorial</option>
                  </select>
                </label>
              </div>

              <div className="shop-save-custom-theme">
                <label htmlFor="custom-theme-name">Enregistrer comme mon modèle</label>
                <div className="shop-save-custom-theme-row">
                  <input id="custom-theme-name" value={customThemeName} maxLength={40} onChange={(event) => setCustomThemeName(event.target.value)} placeholder="Ex. Mon style signature" />
                  <button className="btn" type="button" onClick={handleSaveCustomTheme} disabled={saving}>
                    <i className="bi bi-bookmark-plus" aria-hidden="true" />
                    {saving ? 'Enregistrement…' : 'Enregistrer le modèle'}
                  </button>
                </div>
                <small>Ce modèle personnalisé sera conservé avec votre boutique et pourra être réappliqué plus tard.</small>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="head">
              <div>
                <h3>Informations générales</h3>
                <p>Nom, slogan et description de votre boutique.</p>
              </div>
            </div>
            <div className="form">
              <label>
                Nom de la boutique
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </label>
              <label>
                Slogan
                <input type="text" name="slogan" value={formData.slogan} onChange={handleChange} placeholder="Qualité et confiance depuis 2020" />
              </label>
              <label>
                Description
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Décrivez votre boutique..." />
              </label>
              <div className="form-grid">
                <label>
                  Ville
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </label>
                <label>
                  Pays
                  <input type="text" name="country" value={formData.country} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Médias */}
          <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="head">
              <div>
                <h3>Médias</h3>
                <p>Logo et bannière de couverture de votre vitrine.</p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Logo (format carré)
                <label className="upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: formData.logoUrl ? 0 : 24, border: '2px dashed var(--color-border)', borderRadius: 12, overflow: 'hidden', height: 140 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <i className="bi bi-image" aria-hidden="true" style={{ fontSize: 24, color: 'var(--color-text-3)' }} />
                      <span style={{ marginTop: 8, fontWeight: 500 }}>Cliquer pour importer</span>
                      <small style={{ fontSize: 10, marginTop: 4, color: 'var(--color-text-disabled)' }}>
                        PNG, JPG · max 2 Mo
                      </small>
                    </>
                  )}
                </label>
              </label>
              <label>
                Bannière de couverture
                <label className="upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: formData.coverUrl ? 0 : 24, border: '2px dashed var(--color-border)', borderRadius: 12, overflow: 'hidden', height: 140 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'coverUrl')} />
                  {formData.coverUrl ? (
                    <img src={formData.coverUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <i className="bi bi-panorama" aria-hidden="true" style={{ fontSize: 24, color: 'var(--color-text-3)' }} />
                      <span style={{ marginTop: 8, fontWeight: 500 }}>Cliquer pour importer</span>
                      <small style={{ fontSize: 10, marginTop: 4, color: 'var(--color-text-disabled)' }}>
                        PNG, JPG · 1600×400 recommandé
                      </small>
                    </>
                  )}
                </label>
              </label>
            </div>
          </div>

          {/* Contact */}
          <div className="panel">
            <div className="head">
              <div>
                <h3>Contact & réseaux</h3>
                <p>Comment vos clients peuvent vous joindre.</p>
              </div>
            </div>
            <div className="form">
              <label>
                Numéro WhatsApp
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
              </label>
              <label>
                Adresse physique
                <input type="text" name="address" value={formData.address} onChange={handleChange} />
              </label>
            </div>
          </div>
        </section>

        {/* Aperçu live */}
        <aside aria-label="Aperçu de votre vitrine">
          <div
            className="live-preview"
            data-card-style={currentTheme.cardStyle}
            data-font-style={currentTheme.fontStyle}
            role="img"
            aria-label="Aperçu de votre boutique telle qu'elle apparaît aux clients"
            style={{
              borderRadius: currentTheme.radius,
              ['--shop-primary' as string]: currentTheme.primary,
              ['--shop-secondary' as string]: currentTheme.secondary,
              ['--shop-accent' as string]: currentTheme.accent,
              ['--shop-radius' as string]: currentTheme.radius,
              ['--shop-image-fit' as string]: currentTheme.imageFit,
              ['--shop-logo-radius' as string]: currentTheme.logoShape === 'round' ? '50%' : currentTheme.logoShape === 'square' ? '4px' : '16px',
            }}
          >
            <div
              className="live-preview-cover"
              style={{
                background: formData.coverUrl ? `url(${formData.coverUrl}) center/cover` : `linear-gradient(145deg, ${currentTheme.secondary}, ${currentTheme.primary})`,
                borderTopLeftRadius: currentTheme.radius,
                borderTopRightRadius: currentTheme.radius,
              }}
            >
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="live-preview-logo" style={{ borderRadius: currentTheme.logoShape === 'round' ? '50%' : currentTheme.logoShape === 'square' ? '4px' : '16px', objectFit: 'contain' }} />
              ) : (
                <div
                  className="live-preview-logo"
                  style={{
                    background: 'var(--color-surface)',
                    color: currentTheme.primary,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--fw-extra)',
                    fontSize: 18,
                    borderRadius: currentTheme.logoShape === 'round' ? '50%' : currentTheme.logoShape === 'square' ? '4px' : '16px',
                  }}
                  aria-hidden="true"
                >
                  {formData.name ? formData.name.substring(0,2).toUpperCase() : 'MB'}
                </div>
              )}
              <span className="live-preview-name">{formData.name || 'Ma Boutique'}</span>
            </div>
            <div className="live-preview-body">
              <h3 style={{ color: currentTheme.primary }}>{formData.name || 'Ma Boutique'}</h3>
              <p style={{ margin: '4px 0 0', color: currentTheme.primary }}>{formData.slogan || 'Slogan ici'}</p>
              <div className="preview-products" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => <span key={i} style={{ borderRadius: currentTheme.radius, background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}35)` }} />)}
              </div>
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                borderRadius: currentTheme.radius,
                background: `${currentTheme.primary}12`,
                border: 'var(--border)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <i className="bi bi-eye" aria-hidden="true" style={{ color: currentTheme.primary }} />
                Aperçu du modèle · {activeThemeId === 'my-custom' ? branding.customThemeName : THEMES.find((theme) => theme.id === activeThemeId)?.name ?? 'Personnalisé'}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
