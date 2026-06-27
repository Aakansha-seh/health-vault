// AI abstraction layer — unified multi-provider clinical summary generation.
//
// Native SDKs:   OpenAI (GPT), Anthropic (Claude), Google (Gemini)
// OpenAI-compatible (same REST shape, different baseURL + key):
//                DeepSeek, Groq, Perplexity, z.ai (GLM), Mistral
//
// generateSummary({ model, patientData }) → { summary, promptTokens, outputTokens }
//
// Only models whose provider API key is configured are offered to the UI
// (see listModels / modelAvailable), so a doctor never sees a model that
// would 500 on use.

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Providers ────────────────────────────────────────────────────────────────
// `compat: true` means "use the OpenAI SDK with this baseURL".
const PROVIDERS = {
  openai:     { keyEnv: 'OPENAI_API_KEY',     label: 'OpenAI' },
  anthropic:  { keyEnv: 'ANTHROPIC_API_KEY',  label: 'Anthropic' },
  google:     { keyEnv: 'GOOGLE_AI_API_KEY',  label: 'Google' },
  deepseek:   { keyEnv: 'DEEPSEEK_API_KEY',   label: 'DeepSeek',   compat: true, baseURL: 'https://api.deepseek.com' },
  groq:       { keyEnv: 'GROQ_API_KEY',       label: 'Groq',       compat: true, baseURL: 'https://api.groq.com/openai/v1' },
  perplexity: { keyEnv: 'PERPLEXITY_API_KEY', label: 'Perplexity', compat: true, baseURL: 'https://api.perplexity.ai' },
  zai:        { keyEnv: 'ZAI_API_KEY',        label: 'z.ai',       compat: true, baseURL: 'https://api.z.ai/api/paas/v4' },
  mistral:    { keyEnv: 'MISTRAL_API_KEY',    label: 'Mistral',    compat: true, baseURL: 'https://api.mistral.ai/v1' },
};

// ─── Supported models ─────────────────────────────────────────────────────────
// Model ids are sent verbatim to the provider, so keep them current with each
// provider's docs. tier: 'free' = available on the free plan; 'premium' = paid.
export const AI_MODELS = {
  // OpenAI
  'gpt-4o':                     { provider: 'openai',     label: 'GPT-4o',                tier: 'premium' },
  'gpt-4o-mini':                { provider: 'openai',     label: 'GPT-4o Mini',           tier: 'free'    },
  // Anthropic
  'claude-3-5-sonnet-20241022': { provider: 'anthropic',  label: 'Claude 3.5 Sonnet',     tier: 'premium' },
  'claude-3-5-haiku-20241022':  { provider: 'anthropic',  label: 'Claude 3.5 Haiku',      tier: 'free'    },
  // Google (1.5/2.0 retired — 2.5 is the current GA line on v1beta)
  'gemini-2.5-pro':             { provider: 'google',     label: 'Gemini 2.5 Pro',        tier: 'premium' },
  'gemini-2.5-flash':           { provider: 'google',     label: 'Gemini 2.5 Flash',      tier: 'free'    },
  // DeepSeek
  'deepseek-chat':              { provider: 'deepseek',   label: 'DeepSeek V3',           tier: 'premium' },
  'deepseek-reasoner':          { provider: 'deepseek',   label: 'DeepSeek R1 (reasoning)', tier: 'premium' },
  // Groq (fast open models)
  'llama-3.3-70b-versatile':    { provider: 'groq',       label: 'Llama 3.3 70B · Groq',  tier: 'free'    },
  'llama-3.1-8b-instant':       { provider: 'groq',       label: 'Llama 3.1 8B · Groq',   tier: 'free'    },
  // Perplexity
  'sonar':                      { provider: 'perplexity', label: 'Perplexity Sonar',      tier: 'premium' },
  'sonar-pro':                  { provider: 'perplexity', label: 'Perplexity Sonar Pro',  tier: 'premium' },
  // z.ai (Zhipu GLM)
  'glm-4.6':                    { provider: 'zai',        label: 'GLM-4.6 · z.ai',        tier: 'premium' },
  'glm-4.5-air':                { provider: 'zai',        label: 'GLM-4.5 Air · z.ai',    tier: 'free'    },
  // Mistral
  'mistral-large-latest':       { provider: 'mistral',    label: 'Mistral Large',         tier: 'premium' },
  'open-mistral-nemo':          { provider: 'mistral',    label: 'Mistral Nemo',          tier: 'free'    },
};

// ─── Availability (only show models whose key is set) ─────────────────────────
export const providerConfigured = (p) => !!(PROVIDERS[p] && process.env[PROVIDERS[p].keyEnv]);
export const modelAvailable     = (m) => !!AI_MODELS[m] && providerConfigured(AI_MODELS[m].provider);

/** List the models a user may pick, filtered to configured providers. */
export function listModels(isPremium) {
  return Object.keys(AI_MODELS)
    .filter((m) => (isPremium ? true : AI_MODELS[m].tier === 'free'))
    .filter(modelAvailable)
    .map((m) => ({ id: m, label: AI_MODELS[m].label, tier: AI_MODELS[m].tier, provider: AI_MODELS[m].provider }));
}

// Back-compat exports (used elsewhere)
export const FREE_MODELS    = Object.keys(AI_MODELS).filter((k) => AI_MODELS[k].tier === 'free');
export const PREMIUM_MODELS = Object.keys(AI_MODELS);

// ─── Prompt builder ───────────────────────────────────────────────────────────
function formatVisits(visits) {
  return (visits || [])
    .slice(0, 10)
    .map((v, i) => `Visit ${i + 1} (${new Date(v.date).toDateString()}):
  Chief Complaint: ${v.chiefComplaint}
  Examination: ${v.examination || 'N/A'}
  Diagnosis: ${v.diagnosis || 'N/A'}
  Medications/Prescription: ${v.medications || v.prescription || 'N/A'}
  Tests Prescribed: ${v.testsPrescribed || 'N/A'}
  Notes: ${v.notes || 'N/A'}`)
    .join('\n\n');
}

function buildPrompt(patientData) {
  // ── Combined multi-patient summary ──
  if (Array.isArray(patientData.patients)) {
    const sections = patientData.patients.map((p, idx) => {
      const d = p.demographics || {};
      return `── PATIENT ${idx + 1}: ${p.name || 'Unknown'} ──
Age: ${d.age ?? 'Unknown'} | Gender: ${d.gender ?? 'Unknown'} | Blood Group: ${d.bloodGroup || 'Unknown'}
Allergies: ${d.allergies || 'None documented'}
Chronic Conditions: ${d.chronicConditions || 'None documented'}
Visit history:
${formatVisits(p.visits) || 'No visits recorded.'}`;
    }).join('\n\n');

    return `You are a clinical assistant. Provide a COMBINED clinical summary across the following ${patientData.patients.length} patients for a doctor's review.

${sections}

Provide a structured summary covering:
1. Cohort Overview (who these patients are)
2. Notable Conditions & Patterns across the group
3. Per-Patient Key Points (one short paragraph each, headed by the patient's name in bold)
4. Cross-Patient Observations or shared risks (if any)
5. Recommendations for the consulting doctor

Be concise, clinically precise, and flag any critical concerns. This is decision-support only; the treating clinician is responsible for all decisions.`;
  }

  // ── Single-patient summary ──
  const { demographics, visits } = patientData;

  return `You are a clinical assistant. Summarize the following patient's medical history concisely for a doctor's review.

PATIENT DEMOGRAPHICS:
Age: ${demographics.age ?? 'Unknown'}
Gender: ${demographics.gender ?? 'Unknown'}
Blood Group: ${demographics.bloodGroup || 'Unknown'}
Allergies: ${demographics.allergies || 'None documented'}
Chronic Conditions: ${demographics.chronicConditions || 'None documented'}

VISIT HISTORY (most recent first):
${formatVisits(visits) || 'No visits recorded.'}

Provide a structured clinical summary covering:
1. Patient Overview
2. Key Medical History
3. Recent Clinical Findings
4. Current Medications
5. Recommendations for the consulting doctor

Be concise, clinically precise, and flag any critical concerns. This is decision-support only; the treating clinician is responsible for all decisions.`;
}

// ─── Clients (lazy, cached) ───────────────────────────────────────────────────
const _clients = {};

function getKey(provider) {
  const key = process.env[PROVIDERS[provider]?.keyEnv];
  if (!key) throw Object.assign(new Error(`${PROVIDERS[provider]?.label || provider} API key is not configured`), { status: 503 });
  return key;
}

// One OpenAI-SDK client per OpenAI-style provider (openai + all compat ones).
function openAIStyleClient(provider) {
  if (_clients[provider]) return _clients[provider];
  const cfg = PROVIDERS[provider];
  _clients[provider] = new OpenAI({ apiKey: getKey(provider), baseURL: cfg.baseURL /* undefined for native OpenAI */ });
  return _clients[provider];
}

function anthropicClient() {
  if (!_clients.anthropic) _clients.anthropic = new Anthropic({ apiKey: getKey('anthropic') });
  return _clients.anthropic;
}

function googleClient() {
  if (!_clients.google) _clients.google = new GoogleGenerativeAI(getKey('google'));
  return _clients.google;
}

const estTokens = (s) => Math.ceil((s || '').length / 4);

// ─── Generator ────────────────────────────────────────────────────────────────
export async function generateSummary({ model, patientData }) {
  const config = AI_MODELS[model];
  if (!config) throw Object.assign(new Error(`Unsupported model: ${model}`), { status: 400 });

  const prompt = buildPrompt(patientData);

  // Anthropic (Claude)
  if (config.provider === 'anthropic') {
    const res = await anthropicClient().messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return {
      summary:      res.content[0].text,
      promptTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };
  }

  // Google (Gemini)
  if (config.provider === 'google') {
    const genModel = googleClient().getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    const text = result.response.text();
    return { summary: text, promptTokens: estTokens(prompt), outputTokens: estTokens(text) };
  }

  // OpenAI + every OpenAI-compatible provider (DeepSeek, Groq, Perplexity, z.ai, Mistral)
  const client = openAIStyleClient(config.provider);
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.3,
  });
  return {
    summary:      res.choices[0].message.content,
    promptTokens: res.usage?.prompt_tokens     ?? estTokens(prompt),
    outputTokens: res.usage?.completion_tokens ?? estTokens(res.choices[0].message.content),
  };
}
