import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const CATEGORIES = [
  { id: 'energy', label: 'Energy', emoji: '☀️' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'textile', label: 'Textile', emoji: '🧵' },
  { id: 'fisheries', label: 'Fisheries', emoji: '🐟' },
  { id: 'agriculture', label: 'Agriculture', emoji: '🌾' },
  { id: 'construction', label: 'Construction', emoji: '🏗️' },
  { id: 'beauty', label: 'Beauty', emoji: '💇' },
  { id: 'hospitality', label: 'Hospitality', emoji: '🍽️' },
  { id: 'automotive', label: 'Automotive', emoji: '🚗' },
  { id: 'business', label: 'Business', emoji: '💼' },
];

export function NotificationSettings({ mode = 'panel', onClose, triggerLabel }) {
  const { permission, isSubscribed, categories: savedCategories, requestPermission, updateCategories, unsubscribe, supported } = usePushNotifications();
  const [selected, setSelected] = useState(new Set(savedCategories));
  const [selectAll, setSelectAll] = useState(savedCategories.includes('all'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPanel, setShowPanel] = useState(mode !== 'trigger');

  useEffect(() => {
    if (savedCategories.includes('all')) {
      setSelectAll(true);
      setSelected(new Set(CATEGORIES.map((cat) => cat.id)));
    } else {
      setSelectAll(false);
      setSelected(new Set(savedCategories));
    }
  }, [savedCategories]);

  if (!supported) return null;

  const toggleCategory = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAll(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const categories = selectAll ? ['all'] : Array.from(selected);
      const done = isSubscribed ? await updateCategories(categories) : await requestPermission(categories);
      if (done) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
        if (mode === 'modal' && onClose) setTimeout(onClose, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'trigger' && !showPanel) {
    return (
      <button
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          borderRadius: 12, background: isSubscribed ? 'rgba(255,107,53,0.1)' : 'linear-gradient(135deg,#FF6B35,#FF9A3C)',
          border: isSubscribed ? '1px solid rgba(255,107,53,0.3)' : 'none', color: isSubscribed ? '#FF6B35' : '#fff',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
        onClick={() => setShowPanel(true)}
      >
        {triggerLabel || (isSubscribed ? 'Notification Settings' : 'Get Course Alerts')}
      </button>
    );
  }

  const panelContent = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .stadi-notif-panel{font-family:'Plus Jakarta Sans',sans-serif;background:#0D1B2A;border-radius:20px;overflow:hidden;width:100%;max-width:480px;border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.5)}
        .stadi-notif-header{background:linear-gradient(135deg,#FF6B35 0%,#FF9A3C 100%);padding:24px;position:relative}
        .stadi-notif-header h2{margin:0 0 4px;font-size:20px;font-weight:800;color:#fff}
        .stadi-notif-header p{margin:0;font-size:14px;color:rgba(255,255,255,.75)}
        .stadi-notif-close{position:absolute;top:16px;right:16px;width:32px;height:32px;background:rgba(255,255,255,.15);border:none;border-radius:50%;color:#fff;font-size:18px;cursor:pointer}
        .stadi-notif-body{padding:20px}
        .stadi-selectall-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,107,53,.07);border:1px solid rgba(255,107,53,.2);border-radius:12px;margin-bottom:14px;cursor:pointer}
        .stadi-toggle{width:42px;height:24px;background:rgba(255,255,255,.1);border-radius:12px;position:relative}
        .stadi-toggle.on{background:#FF6B35}
        .stadi-toggle::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .2s}
        .stadi-toggle.on::after{transform:translateX(18px)}
        .stadi-category-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
        .stadi-category-chip{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;cursor:pointer}
        .stadi-category-chip.selected{background:rgba(255,107,53,.1);border-color:rgba(255,107,53,.35)}
        .stadi-category-name{font-size:13px;font-weight:500;color:rgba(255,255,255,.75);flex:1}
        .stadi-category-chip.selected .stadi-category-name{color:#FF9A3C}
        .stadi-notif-footer{padding:0 20px 20px}
        .stadi-btn-save{width:100%;padding:14px;background:linear-gradient(135deg,#FF6B35,#FF9A3C);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
        .stadi-btn-save:disabled{opacity:.6;cursor:not-allowed}
        .stadi-btn-unsub{width:100%;margin-top:10px;padding:11px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:rgba(255,255,255,.45);font-size:13px;font-weight:500;cursor:pointer}
      `}</style>
      <div className="stadi-notif-panel">
        <div className="stadi-notif-header">
          <h2>Course Notifications</h2>
          <p>Choose which new courses to hear about first.</p>
          {(mode === 'modal' || mode === 'trigger') && (
            <button className="stadi-notif-close" onClick={() => { mode === 'modal' ? onClose?.() : setShowPanel(false); }}>×</button>
          )}
        </div>
        <div className="stadi-notif-body">
          {permission === 'denied' ? (
            <div style={{ color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
              Allow notifications in your browser settings, then reload the page to enable course alerts.
            </div>
          ) : (
            <>
              {success && <div style={{ color: '#3DDC84', marginBottom: 12 }}>{isSubscribed ? 'Preferences saved' : 'Notifications enabled'}</div>}
              <div className="stadi-selectall-row" onClick={() => { setSelectAll(!selectAll); if (!selectAll) setSelected(new Set(CATEGORIES.map((cat) => cat.id))); }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FF9A3C' }}>Notify me about all new courses</span>
                <div className={`stadi-toggle ${selectAll ? 'on' : ''}`} />
              </div>
              <div className="stadi-category-grid" style={{ opacity: selectAll ? 0.4 : 1, pointerEvents: selectAll ? 'none' : 'auto' }}>
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className={`stadi-category-chip ${selected.has(cat.id) ? 'selected' : ''}`} onClick={() => toggleCategory(cat.id)}>
                    <span>{cat.emoji}</span>
                    <span className="stadi-category-name">{cat.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {permission !== 'denied' && (
          <div className="stadi-notif-footer">
            <button className="stadi-btn-save" onClick={handleSave} disabled={loading || (!selectAll && selected.size === 0)}>
              {loading ? 'Saving...' : isSubscribed ? 'Update Preferences' : 'Enable Notifications'}
            </button>
            {isSubscribed && <button className="stadi-btn-unsub" onClick={unsubscribe}>Unsubscribe from all notifications</button>}
          </div>
        )}
      </div>
    </>
  );

  if (mode === 'modal') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 480 }}>
          {panelContent}
        </div>
      </div>
    );
  }

  return panelContent;
}

export default NotificationSettings;
