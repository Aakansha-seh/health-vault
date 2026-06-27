import { useState, useEffect, useRef } from 'react';
import { getAIModels, generateAISummary } from '../../services/api';
import { C, shadow } from '../../constants/theme';

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

function SummaryDisplay({ summary, model, selectedPatients, onNew, onSave, saving, savedCount }) {
  const [copied, setCopied] = useState(false);
  const n = selectedPatients.length;
  const saved = savedCount > 0;

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
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{n > 1 ? `Combined Summary · ${n} patients` : 'Clinical Summary'}</h4>
            <p style={{ fontSize: 11.5, color: C.muted }}>Generated with {model}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleCopy} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, color: C.primary }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            onClick={onSave}
            disabled={saving || saved}
            style={{
              padding: '7px 14px', borderRadius: 8, border: `1px solid ${saved ? C.success : C.secondary}`,
              background: saved ? `${C.success}15` : 'transparent',
              color: saved ? C.success : C.secondary, fontWeight: 600,
              cursor: (saving || saved) ? 'default' : 'pointer', fontSize: 12,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saved ? `✓ Saved to ${savedCount} record${savedCount > 1 ? 's' : ''}` : saving ? 'Saving…' : `Save to ${n} record${n > 1 ? 's' : ''}`}
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

export function AISummaryView({ actor, patients, doctorProfiles, onSaveSummary }) {
  const [modelsData,    setModelsData]    = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedIds,   setSelectedIds]   = useState([]);   // patient ids (multi-select)
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error,         setError]         = useState('');
  const [summary,       setSummary]       = useState(null);
  const [usedModel,     setUsedModel]     = useState('');
  const [saving,        setSaving]        = useState(false);
  const [savedCount,    setSavedCount]    = useState(0);
  const [patOpen,       setPatOpen]       = useState(false);
  const patRef = useRef(null);

  useEffect(() => {
    if (!patOpen) return;
    const onDown = (e) => { if (patRef.current && !patRef.current.contains(e.target)) setPatOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [patOpen]);

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

  const isPremium = modelsData?.tier === 'PREMIUM';
  const usage     = modelsData?.usage?.used ?? 0;
  const limit     = modelsData?.usage?.limit ?? 10;

  const toggle = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const selectedPatients = patients.filter(p => selectedIds.includes(p.id));

  const handleGenerate = async () => {
    if (!selectedIds.length) { setError('Select at least one patient'); return; }
    if (!selectedModel)      { setError('Select a model'); return; }
    setLoading(true); setError(''); setSavedCount(0);
    try {
      const res = await generateAISummary({ patientIds: selectedIds, model: selectedModel });
      setSummary(res.summary);
      setUsedModel(selectedModel);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!summary || !onSaveSummary) return;
    setSaving(true); setError('');
    try {
      let ok = 0;
      for (const id of selectedIds) {
        await onSaveSummary(id, { summary, model: usedModel });
        ok += 1;
      }
      setSavedCount(ok);
    } catch (e) {
      setError(e.message || 'Could not save the summary');
    } finally { setSaving(false); }
  };

  const selectStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white };

  if (summary) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>AI Summary</h2>
        </div>
        <SummaryDisplay
          summary={summary}
          model={usedModel}
          selectedPatients={selectedPatients}
          onNew={() => { setSummary(null); setSavedCount(0); }}
          onSave={handleSave}
          saving={saving}
          savedCount={savedCount}
        />
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
        <p style={{ color: C.muted, fontSize: 13 }}>Pick one or more patients for a combined summary of their visit history</p>
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
        {/* Left: multi-patient picker */}
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>Select Patients</h4>
            <span style={{ fontSize: 12, color: selectedIds.length ? C.secondary : C.muted, fontWeight: 600 }}>{selectedIds.length} selected</span>
          </div>

          {/* Multi-select dropdown */}
          <div ref={patRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setPatOpen(o => !o)}
              style={{ ...selectStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ color: selectedIds.length ? C.text : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedIds.length === 0
                  ? 'Choose patients…'
                  : selectedIds.length <= 2
                    ? selectedPatients.map(p => p.name).join(', ')
                    : `${selectedIds.length} patients selected`}
              </span>
              <span style={{ color: C.muted, fontSize: 11, flexShrink: 0, marginLeft: 8, transform: patOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
            </button>

            {patOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: shadow, padding: 8, display: 'flex', flexDirection: 'column', maxHeight: 320 }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search patients…"
                  autoFocus
                  style={{ ...selectStyle, marginBottom: 8 }}
                />
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filtered.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.muted, padding: '12px' }}>No patients found.</p>
                  ) : filtered.map(p => {
                    const checked = selectedIds.includes(p.id);
                    return (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: checked ? `${C.secondary}12` : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{p.name}</span>
                          <span style={{ fontSize: 12, color: C.muted }}> · {p.visits?.length ?? 0} visits</span>
                          {p.allergies && <span style={{ fontSize: 11, color: C.error }}> · ⚠ {p.allergies}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {selectedPatients.map(p => (
                <span key={p.id} style={{ fontSize: 11, fontWeight: 600, color: C.secondary, background: `${C.secondary}15`, padding: '3px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {p.name}
                  <button type="button" onClick={() => toggle(p.id)} aria-label={`Remove ${p.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: model dropdown */}
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
            <>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={selectStyle}>
                <option value="">— Choose a model —</option>
                {modelsData.models.map(m => {
                  const locked = m.tier === 'premium' && !isPremium;
                  return (
                    <option key={m.id} value={m.id} disabled={locked}>
                      {m.label ?? m.id}{m.tier === 'premium' ? ' (Premium)' : ''} · {m.provider}{locked ? ' — upgrade' : ''}
                    </option>
                  );
                })}
              </select>
              <p style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>
                Premium models need a Premium subscription. Free models are always available.
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: C.criticalSoft, border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginTop: 16, color: C.error, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedIds.length || !selectedModel || (!isPremium && usage >= limit)}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: C.primary, color: C.white, fontSize: 15, fontWeight: 700,
            opacity: (loading || !selectedIds.length || !selectedModel || (!isPremium && usage >= limit)) ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {selectedIds.length > 1 ? `Generate Combined Summary (${selectedIds.length})` : 'Generate Summary'}
        </button>
        {!isPremium && (
          <p style={{ fontSize: 12, color: C.muted }}>Free tier: {limit - usage} summaries remaining · 1 credit per generation</p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
