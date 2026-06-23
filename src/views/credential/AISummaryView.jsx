import { useState, useEffect } from 'react';
import { getAIModels, generateAISummary, requestWriteAccess } from '../../services/api';
import { C, shadow } from '../../constants/theme';

function ModelBadge({ tier }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: tier === 'premium' ? '#FFF8E1' : `${C.secondary}18`,
      color:      tier === 'premium' ? '#F9A825'  : C.secondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {tier}
    </span>
  );
}

function ModelCard({ model, selected, onSelect, locked }) {
  return (
    <div onClick={() => !locked && onSelect(model.id)} style={{
      border: `2px solid ${selected ? C.primary : C.border}`,
      borderRadius: 10, padding: '12px 14px', cursor: locked ? 'not-allowed' : 'pointer',
      background: selected ? `${C.primary}08` : C.white,
      opacity: locked ? 0.5 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{model.label ?? model.id}</span>
        <ModelBadge tier={model.tier} />
      </div>
      <span style={{ fontSize: 11, color: C.muted }}>{model.provider}</span>
      {locked && <p style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>Upgrade to Premium to use</p>}
    </div>
  );
}

// ── Minimal markdown → React (bold, headings, bullets, paragraphs) ─────────────
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} style={{ color: C.primary, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function parseBlocks(text) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push({ type: 'list', items: list }); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet) { (list = list || []).push(bullet[1]); continue; }
    flush();
    const hb = line.match(/^\*\*(.+?)\*\*:?\s*$/);   // **Heading**
    const hh = line.match(/^#{1,6}\s+(.*)$/);         // # Heading
    if (hb)      blocks.push({ type: 'heading', text: hb[1] });
    else if (hh) blocks.push({ type: 'heading', text: hh[1] });
    else         blocks.push({ type: 'p', text: line });
  }
  flush();
  return blocks;
}

function Markdown({ text }) {
  const blocks = parseBlocks(text);
  return (
    <div>
      {blocks.map((b, i) => {
        const anim = { animation: 'hv-reveal 0.5s ease both', animationDelay: `${i * 0.07}s` };
        if (b.type === 'heading') {
          return (
            <h5 key={i} style={{ ...anim, fontSize: 13.5, fontWeight: 700, color: C.primary, letterSpacing: 0.2, margin: i === 0 ? '0 0 10px' : '18px 0 8px' }}>
              {renderInline(b.text)}
            </h5>
          );
        }
        if (b.type === 'list') {
          return (
            <ul key={i} style={{ ...anim, listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '3px 0', fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.secondary, marginTop: 7, flexShrink: 0 }} />
                  <span>{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} style={{ ...anim, fontSize: 13.5, color: C.text, lineHeight: 1.7, margin: '0 0 10px' }}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}

// ── Animated "generating" placeholder ─────────────────────────────────────────
function GeneratingView({ model }) {
  return (
    <div className="fade-in" style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div className="hv-ai-pulse" style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Generating clinical summary…</p>
          <p style={{ fontSize: 12, color: C.muted }}>Analysing visit history{model ? ` · ${model}` : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {[95, 72, 88, 60, 90, 50, 80].map((w, i) => (
          <div key={i} className="hv-shimmer" style={{ height: 11, width: `${w}%`, borderRadius: 6, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}

function SummaryDisplay({ summary, model, onNew }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in" style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.secondary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Clinical Summary</h4>
            <p style={{ fontSize: 11.5, color: C.muted }}>Generated with {model}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, color: C.primary }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={onNew} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.primary, cursor: 'pointer', fontSize: 12, color: C.white, fontWeight: 600 }}>
            New Summary
          </button>
        </div>
      </div>
      <div style={{ background: C.bg, borderRadius: 8, padding: '16px 18px', maxHeight: 520, overflowY: 'auto' }}>
        <Markdown text={summary} />
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 12, fontStyle: 'italic' }}>
        AI-generated decision support. The treating clinician is responsible for all clinical decisions.
      </p>
    </div>
  );
}

export function AISummaryView({ actor, patients, doctorProfiles }) {
  const [modelsData,   setModelsData]   = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPat,  setSelectedPat]   = useState('');
  const [loading,      setLoading]       = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error,        setError]         = useState('');
  const [summary,      setSummary]       = useState(null);
  const [usedModel,    setUsedModel]     = useState('');

  useEffect(() => {
    getAIModels()
      .then(data => {
        setModelsData(data);
        const first = data.models?.[0];
        if (first) setSelectedModel(first.id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingModels(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedPat)   { setError('Select a patient'); return; }
    if (!selectedModel) { setError('Select a model'); return; }
    setLoading(true); setError('');
    try {
      const res = await generateAISummary({ patientId: selectedPat, model: selectedModel });
      setSummary(res.summary);
      setUsedModel(selectedModel);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const isPremium = modelsData?.tier === 'PREMIUM';
  // Backend shape: usage = { used, limit } | null (null for premium)
  const usage     = modelsData?.usage?.used ?? 0;
  const limit     = modelsData?.usage?.limit ?? 10;

  if (summary) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>AI Summary</h2>
        </div>
        <SummaryDisplay summary={summary} model={usedModel} onNew={() => setSummary(null)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>AI Clinical Summary</h2>
        </div>
        <GeneratingView model={selectedModel} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>AI Clinical Summary</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Generate an AI-powered summary of a patient's visit history</p>
      </div>

      {/* Usage indicator */}
      {!isPremium && (
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>Free Tier Usage</span>
            <span style={{ fontSize: 13, color: C.muted }}>{usage} / {limit} this month</span>
          </div>
          <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (usage / limit) * 100)}%`, background: usage >= limit ? C.error : C.secondary, borderRadius: 3, transition: 'width 0.4s' }}/>
          </div>
          {usage >= limit && (
            <p style={{ fontSize: 12, color: C.error, marginTop: 6 }}>Monthly limit reached. Upgrade to Premium for unlimited summaries.</p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Patient + model selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Select patient */}
          <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 12 }}>Select Patient</h4>
            <select
              value={selectedPat}
              onChange={e => setSelectedPat(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white }}
            >
              <option value="">— Choose a patient —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.visits?.length ?? 0} visits)
                </option>
              ))}
            </select>

            {selectedPat && (() => {
              const pat = patients.find(p => p.id === selectedPat);
              return pat && (
                <div style={{ marginTop: 12, padding: 12, background: C.bg, borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{pat.name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {[pat.gender, pat.bloodGroup].filter(Boolean).join(' · ')} · {pat.visits?.length ?? 0} visits recorded
                  </p>
                  {pat.allergies && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>⚠ {pat.allergies}</p>}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right: Model selection */}
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 12 }}>Choose Model</h4>
          {loadingModels ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Loading models…</p>
          ) : (modelsData?.models?.length ?? 0) === 0 ? (
            <div style={{ background: C.bg, borderRadius: 8, padding: '14px 16px' }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No AI models available</p>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                No AI provider is configured on the server yet. Add at least one provider API key
                (for example a free <strong>Groq</strong> key as <code>GROQ_API_KEY</code>) to <code>server/.env</code> and restart the API. Models then appear here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modelsData.models.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={selectedModel === m.id}
                  onSelect={setSelectedModel}
                  locked={m.tier === 'premium' && !isPremium}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF5F5', border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginTop: 16, color: C.error, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedPat || !selectedModel || (!isPremium && usage >= limit)}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: C.primary, color: C.white, fontSize: 15, fontWeight: 700,
            opacity: (loading || !selectedPat || !selectedModel || (!isPremium && usage >= limit)) ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              Generating…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Generate Summary
            </>
          )}
        </button>
        {!isPremium && (
          <p style={{ fontSize: 12, color: C.muted }}>Free tier: {limit - usage} summaries remaining</p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
