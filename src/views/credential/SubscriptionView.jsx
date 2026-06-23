import { useState, useEffect } from 'react';
import { getSubscription, createCheckout, cancelSubscription } from '../../services/api';
import { C, shadow } from '../../constants/theme';

// Load Razorpay Checkout once.
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const PREMIUM_FEATURES = [
  'Unlimited AI summaries per month',
  'Access to GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Pro & more',
  'Priority support',
  'Advanced analytics',
];

const FREE_FEATURES = [
  '10 AI summaries / month',
  'Access to GPT-4o-mini, Claude Haiku, Gemini 2.5 Flash, Llama (Groq)',
  'Full patient record management',
  'Appointment scheduling',
];

function FeatureList({ features, accent }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {features.map(f => (
        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', fontSize: 13, color: C.text }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={accent} style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {f}
        </li>
      ))}
    </ul>
  );
}

export function SubscriptionView({ actor }) {
  const [sub,       setSub]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error,     setError]     = useState('');
  const [banner,    setBanner]    = useState(null); // { type, msg }

  const refetchSub = () => getSubscription().then(setSub).catch(() => {});

  useEffect(() => {
    getSubscription()
      .then(setSub)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Open the Razorpay Checkout modal for the Premium subscription.
  const handleUpgrade = async () => {
    setUpgrading(true); setError('');
    try {
      const ok = await loadRazorpay();
      const { subscriptionId, keyId, shortUrl } = await createCheckout();

      // If the SDK couldn't load, fall back to Razorpay's hosted page.
      if (!ok || !window.Razorpay) {
        if (shortUrl) { window.location.href = shortUrl; return; }
        throw new Error('Could not open the payment window. Please try again.');
      }

      const rzp = new window.Razorpay({
        key:             keyId,
        subscription_id: subscriptionId,
        name:            'HealthVault Premium',
        description:     'Unlimited AI clinical summaries',
        theme:           { color: C.primary },
        prefill:         { name: actor?.label ?? actor?.name ?? '' },
        handler: () => {
          // Authorization done; the webhook flips us to PREMIUM. Poll for it.
          setBanner({ type: 'success', msg: 'Payment authorized — activating your Premium plan…' });
          [1500, 4000, 8000].forEach(ms => setTimeout(refetchSub, ms));
          setUpgrading(false);
        },
        modal: { ondismiss: () => setUpgrading(false) },
      });
      rzp.on('payment.failed', () => { setError('Payment failed — please try again.'); setUpgrading(false); });
      rzp.open();
    } catch (e) {
      setError(e.message); setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel Premium at the end of your current billing period?')) return;
    setCancelling(true); setError('');
    try {
      const r = await cancelSubscription();
      setBanner({ type: 'info', msg: r.message || 'Your subscription will end at the period close.' });
      refetchSub();
    } catch (e) { setError(e.message); }
    finally { setCancelling(false); }
  };

  const isPremium = sub?.tier === 'PREMIUM' && (sub?.status === 'ACTIVE' || sub?.status === 'TRIALING');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading subscription…</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Subscription</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Manage your HealthVault plan</p>
      </div>

      {banner && (
        <div style={{
          borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: banner.type === 'success' ? '#E8F5E9' : '#FFF8E1',
          color:      banner.type === 'success' ? '#2E7D32' : '#8D6E00',
          border: `1px solid ${banner.type === 'success' ? '#A5D6A7' : '#FFE082'}`,
        }}>
          {banner.msg}
        </div>
      )}

      {/* Current status banner */}
      <div style={{
        background: isPremium ? `linear-gradient(135deg, ${C.primary}, ${C.secondary})` : C.white,
        borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: shadow,
        color: isPremium ? C.white : C.primary,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {isPremium ? (
                <span style={{ fontSize: 28 }}>⭐</span>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill={C.primary}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              )}
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </h3>
                {sub?.status && !isPremium && (
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                    Status: {sub.status}
                  </p>
                )}
              </div>
            </div>

            {isPremium && sub?.currentPeriodEnd && (
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
                Renews {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {isPremium ? (
            sub?.cancelAtPeriodEnd ? (
              <span style={{ padding: '10px 16px', fontSize: 13, color: C.white, opacity: 0.9 }}>
                Ends at period close
              </span>
            ) : (
              <button onClick={handleCancel} disabled={cancelling} style={{
                padding: '10px 20px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.5)',
                background: 'transparent', cursor: 'pointer', color: C.white, fontSize: 14, fontWeight: 600,
                opacity: cancelling ? 0.7 : 1,
              }}>
                {cancelling ? 'Cancelling…' : 'Cancel Plan'}
              </button>
            )
          ) : (
            <button onClick={handleUpgrade} disabled={upgrading} style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: C.primary, cursor: 'pointer', color: C.white, fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', opacity: upgrading ? 0.7 : 1,
            }}>
              {upgrading ? 'Redirecting…' : 'Upgrade to Premium →'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF5F5', border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: C.error, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Plans comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Free */}
        <div style={{
          background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24,
          border: !isPremium ? `2px solid ${C.secondary}` : `2px solid transparent`,
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>Free</h4>
              {!isPremium && <span style={{ fontSize: 11, background: `${C.secondary}18`, color: C.secondary, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Current Plan</span>}
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>₹0 <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/ month</span></p>
          </div>
          <FeatureList features={FREE_FEATURES} accent={C.secondary} />
        </div>

        {/* Premium */}
        <div style={{
          background: isPremium ? `${C.primary}06` : C.white,
          borderRadius: 12, boxShadow: shadow, padding: 24,
          border: isPremium ? `2px solid ${C.primary}` : `2px solid transparent`,
          position: 'relative',
        }}>
          {!isPremium && (
            <div style={{ position: 'absolute', top: -12, right: 16, background: C.amber, color: C.white, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>
              RECOMMENDED
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>Premium</h4>
              {isPremium && <span style={{ fontSize: 11, background: `${C.primary}18`, color: C.primary, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Active</span>}
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>₹999 <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/ month</span></p>
          </div>
          <FeatureList features={PREMIUM_FEATURES} accent={C.primary} />
          {!isPremium && (
            <button onClick={handleUpgrade} disabled={upgrading} style={{
              marginTop: 20, width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: C.primary, color: C.white, cursor: 'pointer', fontSize: 14, fontWeight: 700,
              opacity: upgrading ? 0.7 : 1,
            }}>
              {upgrading ? 'Opening checkout…' : 'Get Premium'}
            </button>
          )}
        </div>
      </div>

      {isPremium && (
        <div style={{ marginTop: 20, background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 12 }}>Billing Management</h4>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            {sub?.cancelAtPeriodEnd
              ? 'Your Premium plan is set to end at the close of the current billing period. You can keep using Premium until then.'
              : 'You can cancel anytime. You\'ll keep Premium until the end of the current billing period — no immediate charge or loss of access.'}
          </p>
          {!sub?.cancelAtPeriodEnd && (
            <button onClick={handleCancel} disabled={cancelling} style={{
              padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.error}`,
              background: 'transparent', cursor: 'pointer', color: C.error, fontSize: 13, fontWeight: 600,
              opacity: cancelling ? 0.7 : 1,
            }}>
              {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
