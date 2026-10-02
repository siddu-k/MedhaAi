import DATA from '../data/tradeOutcomes.json';

const OBJECTIONS = [
    { id: 'income', labels: ['income', 'salary', 'earn', 'earning', 'pay', 'salary', 'पैसा', 'कमाई', 'तनख्वाह', 'salary', 'wage', 'majdoori', 'kitna'], en: 'Income potential' },
    { id: 'security', labels: ['job', 'security', 'placement', 'permanent', 'sarkari', 'government job', 'नौकरी', 'job security', 'future', 'bhavishya'], en: 'Job security' },
    { id: 'status', labels: ['status', 'respect', 'society', 'log kya', 'shame', 'caste', 'izzat', 'इज्जत', 'samaj', 'degree', 'low status', 'look down'], en: 'Social perception' },
    { id: 'safety', labels: ['safe', 'safety', 'girl', 'daughter', 'beti', 'बेटी', 'hostel', 'travel', 'night', 'harassment', 'suraksha'], en: 'Safety' },
    { id: 'affordability', labels: ['fee', 'fees', 'cost', 'afford', 'paisa', 'खर्च', 'loan', 'free', 'stipend'], en: 'Affordability' },
    { id: 'retention', labels: ['dropout', 'leave', 'quit', 'continue', 'boring', 'difficult', 'fail', 'back out'], en: 'Dropout risk' },
];

export function detectObjection(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    for (const o of OBJECTIONS) {
        if (o.labels.some((k) => t.includes(k.toLowerCase()))) return o.id;
    }
    return null;
}

export function objectionLabel(id) {
    return OBJECTIONS.find((o) => o.id === id)?.en || id;
}

export function objectionTypes() {
    return OBJECTIONS.map((o) => ({ id: o.id, label: o.en }));
}

export function matchTrades(text, max = 3) {
    if (!text) return [];
    const t = text.toLowerCase();
    const scored = DATA.trades
        .map((tr) => ({ tr, hits: tr.keywords.filter((k) => t.includes(k.toLowerCase())).length }))
        .filter((s) => s.hits > 0)
        .sort((a, b) => b.hits - a.hits)
        .slice(0, max)
        .map((s) => s.tr);
    return scored;
}

export function matchDistrict(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    return DATA.districts.find((d) => t.includes(d.toLowerCase())) || null;
}

function fmt(n) {
    return '₹' + n.toLocaleString('en-IN');
}

/** Verified-data context block injected into the AI system prompt. */
export function getOutcomeContext(userText) {
    const trades = matchTrades(userText);
    if (trades.length === 0) return '';
    const lines = trades.map((tr) =>
        `- ${tr.name} (${tr.hindi}): earns typically ${fmt(tr.earnings_min)}–${fmt(tr.earnings_max)}/month; placement ~${tr.placement_rate_pct}%; NSQF L${tr.nsqf}, ${tr.duration_months}-month course, fees usually nil in govt ITIs. Roles: ${tr.roles.slice(0, 3).join('; ')}. Next steps: ${tr.progression.slice(0, 3).join('; ')}. Safety: ${tr.safety_note} [Source: ${tr.source}]`
    );
    return `\nVERIFIED OUTCOME DATA (use these exact figures, never invent others):\n${lines.join('\n')}\nAlways add: figures are typical ranges, verify with the specific ITI.`;
}

export function listTrades() {
    return DATA.trades;
}

export function datasetMeta() {
    return DATA.meta;
}
