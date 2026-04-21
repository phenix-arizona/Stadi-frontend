import React, { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const AndroidIcon = () => <span>AN</span>;
const AppleIcon = () => <span></span>;
const DesktopIcon = () => <span>PC</span>;
const ShareIcon = () => <span>↥</span>;

const PLATFORM_CONFIG = {
  android: { icon: <AndroidIcon />, label: 'Add to Home Screen', color: '#3DDC84' },
  ios: {
    icon: <AppleIcon />,
    label: 'Add to Home Screen',
    color: '#007AFF',
    instructions: [
      { icon: <ShareIcon />, text: 'Tap the Share button at the bottom of Safari' },
      { icon: <span>⊕</span>, text: 'Scroll and tap "Add to Home Screen"' },
      { icon: <span>✓</span>, text: 'Tap "Add" to finish' },
    ],
  },
  desktop: { icon: <DesktopIcon />, label: 'Install App', color: '#FF6B35' },
};

export default function InstallBanner() {
  const { platform, showPrompt, triggerInstall, dismiss } = useInstallPrompt();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (!showPrompt) return null;

  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.desktop;

  const handlePrimaryClick = () => {
    if (platform === 'ios') setShowIOSSteps(true);
    else triggerInstall();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .stadi-install-banner{position:fixed;bottom:0;left:0;right:0;z-index:9000;font-family:'Plus Jakarta Sans',sans-serif;padding:0 16px 16px}
        .stadi-install-card{background:#0A1628;border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;box-shadow:0 -4px 40px rgba(0,0,0,.5);max-width:480px;margin:0 auto}
        .stadi-install-accent{height:3px;background:linear-gradient(90deg,#FF6B35,#FF9A3C,#FFD166)}
        .stadi-install-body{padding:20px}
        .stadi-install-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .stadi-install-app-icon{width:52px;height:52px;border-radius:14px;overflow:hidden;flex-shrink:0;box-shadow:0 4px 12px rgba(255,107,53,.4);background:#1a2e1a}
        .stadi-install-app-icon img{width:100%;height:100%;object-fit:cover;display:block}
        .stadi-install-title-group{flex:1}
        .stadi-install-title{font-size:16px;font-weight:700;color:#fff;margin:0 0 2px}
        .stadi-install-subtitle{font-size:13px;color:rgba(255,255,255,.5);margin:0}
        .stadi-install-platform-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.5px}
        .stadi-install-desc{font-size:14px;color:rgba(255,255,255,.65);line-height:1.5;margin:0 0 18px}
        .stadi-install-benefits{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
        .stadi-benefit-pill{font-size:12px;color:rgba(255,255,255,.75);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:5px 12px;border-radius:20px}
        .stadi-install-actions{display:flex;gap:10px}
        .stadi-btn-install{flex:1;padding:13px;background:linear-gradient(135deg,#FF6B35,#FF9A3C);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
        .stadi-btn-dismiss{padding:13px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:rgba(255,255,255,.5);font-size:13px;font-weight:500;cursor:pointer}
        .stadi-ios-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:9001;display:flex;align-items:flex-end;justify-content:center;padding:0 16px 16px}
        .stadi-ios-modal{background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:24px;width:100%;max-width:400px}
        .stadi-ios-modal h3{font-size:18px;font-weight:700;color:#fff;margin:0 0 6px}
        .stadi-ios-modal p{font-size:14px;color:rgba(255,255,255,.5);margin:0 0 20px}
        .stadi-ios-steps{list-style:none;margin:0 0 20px;padding:0}
        .stadi-ios-step{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
        .stadi-ios-step:last-child{border-bottom:none}
        .stadi-ios-step-icon{width:38px;height:38px;background:rgba(0,122,255,.12);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#007AFF;flex-shrink:0}
        .stadi-ios-step-text{font-size:14px;color:rgba(255,255,255,.8);line-height:1.4}
        .stadi-btn-got-it{width:100%;padding:13px;background:#007AFF;border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
      `}</style>

      {showIOSSteps && (
        <div className="stadi-ios-overlay" onClick={() => setShowIOSSteps(false)}>
          <div className="stadi-ios-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Add Stadi to Home Screen</h3>
            <p>Follow these steps in Safari to install the app.</p>
            <ol className="stadi-ios-steps">
              {config.instructions?.map((step, index) => (
                <li key={index} className="stadi-ios-step">
                  <div className="stadi-ios-step-icon">{step.icon}</div>
                  <span className="stadi-ios-step-text">{step.text}</span>
                </li>
              ))}
            </ol>
            <button className="stadi-btn-got-it" onClick={() => { setShowIOSSteps(false); dismiss(); }}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="stadi-install-banner">
        <div className="stadi-install-card">
          <div className="stadi-install-accent" />
          <div className="stadi-install-body">
            <div className="stadi-install-header">
              <div className="stadi-install-app-icon">
                <img src="/icons/icon-192x192.png" alt="Stadi" />
              </div>
              <div className="stadi-install-title-group">
                <p className="stadi-install-title">Stadi</p>
                <p className="stadi-install-subtitle">Learn Skills. Start Earning.</p>
              </div>
              <span
                className="stadi-install-platform-badge"
                style={{
                  color: config.color,
                  background: `${config.color}20`,
                  border: `1px solid ${config.color}40`,
                }}
              >
                {config.icon} {platform}
              </span>
            </div>

            <p className="stadi-install-desc">
              Install Stadi for faster access to courses, offline support, and course alerts without using an app store.
            </p>

            <div className="stadi-install-benefits">
              <span className="stadi-benefit-pill">Works offline</span>
              <span className="stadi-benefit-pill">Course alerts</span>
              <span className="stadi-benefit-pill">No app store</span>
            </div>

            <div className="stadi-install-actions">
              <button className="stadi-btn-install" onClick={handlePrimaryClick}>
                {config.label}
              </button>
              <button className="stadi-btn-dismiss" onClick={dismiss}>Later</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
