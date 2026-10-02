import { signOutUser, saveTicketCloud, logEventCloud } from './firebaseService';

const LOG_KEY = 'medha_engagement_log';
const TICKET_KEY = 'medha_escalation_tickets';
const DISTRICT_KEY = 'medha_district';

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
}

export function logEvent(event) {
    const log = read(LOG_KEY, []);
    log.push({ at: new Date().toISOString(), ...event });
    write(LOG_KEY, log.slice(-2000));
    try { logEventCloud(event); } catch (e) {}
}

export function logSession(sessionId, district) {
    if (district) write(DISTRICT_KEY, district);
    logEvent({ kind: 'session', sessionId, district: district || read(DISTRICT_KEY, 'Unknown') });
}

export function logObjection(objection, sessionId, district) {
    logEvent({ kind: 'objection', objection, sessionId, district: district || read(DISTRICT_KEY, 'Unknown') });
}

export function getDistrict() {
    return read(DISTRICT_KEY, 'Unknown');
}

export function setDistrict(d) {
    write(DISTRICT_KEY, d);
}

// ─── Escalation tickets (human counsellor) ───
export function createTicket({ name, phone, district, reason, sessionId, transcript }) {
    const tickets = read(TICKET_KEY, []);
    const ticket = {
        id: 'T-' + Date.now().toString(36).toUpperCase(),
        name: name || 'Anonymous',
        phone: phone || '',
        district: district || read(DISTRICT_KEY, 'Unknown'),
        reason: reason || '',
        sessionId: sessionId || '',
        transcript: (transcript || '').slice(-3000),
        status: 'open',
        created_at: new Date().toISOString(),
    };
    if (ticket.district && ticket.district !== 'Unknown') write(DISTRICT_KEY, ticket.district);
    tickets.unshift(ticket);
    write(TICKET_KEY, tickets);
    logEvent({ kind: 'escalation', ticketId: ticket.id, objection: reason, district: ticket.district, sessionId });
    try { saveTicketCloud(ticket); } catch (e) {}
    return ticket;
}

export function getTickets() {
    return read(TICKET_KEY, []);
}

export function resolveTicket(id) {
    const tickets = read(TICKET_KEY, []).map((t) => (t.id === id ? { ...t, status: 'resolved' } : t));
    write(TICKET_KEY, tickets);
    return tickets;
}

// ─── Aggregations for the admin dashboard ───
const POS = ['good', 'great', 'happy', 'thanks', 'thank', 'like', 'love', 'helpful', 'clear', 'understand', 'अच्छा', 'धन्यवाद', 'khush'];
const NEG = ['bad', 'worried', 'worry', 'fear', 'scared', 'doubt', 'no', 'not', 'never', 'risk', 'problem', 'डर', 'चिंता', 'nahi', 'नहीं'];

export function scoreSentiment(text) {
    if (!text) return 0;
    const t = text.toLowerCase();
    let s = 0;
    for (const w of POS) if (t.includes(w)) s += 1;
    for (const w of NEG) if (t.includes(w)) s -= 1;
    return s;
}

function sessionMessages(sessionId) {
    return read(`tyloop_messages_${sessionId}`, []);
}

export function sentimentShift(sessionId) {
    const msgs = sessionMessages(sessionId).filter((m) => m.content);
    if (msgs.length < 2) return 0;
    const scores = msgs.map((m) => scoreSentiment(m.content));
    const third = Math.max(1, Math.floor(scores.length / 3));
    const first = scores.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const last = scores.slice(-third).reduce((a, b) => a + b, 0) / third;
    return Math.round((last - first) * 10) / 10;
}

export function getStats() {
    const log = read(LOG_KEY, []);
    const sessions = new Set(log.filter((e) => e.sessionId).map((e) => e.sessionId));
    const objections = log.filter((e) => e.kind === 'objection');
    const byObjection = {};
    const byDistrict = {};
    for (const o of objections) {
        byObjection[o.objection] = (byObjection[o.objection] || 0) + 1;
        const d = o.district || 'Unknown';
        const key = `${d} :: ${o.objection}`;
        byDistrict[key] = (byDistrict[key] || 0) + 1;
    }
    const tickets = read(TICKET_KEY, []);
    const shifts = [...sessions].map((id) => sentimentShift(id)).filter((s) => s !== 0);
    const avgShift = shifts.length ? Math.round((shifts.reduce((a, b) => a + b, 0) / shifts.length) * 10) / 10 : 0;
    return {
        totalEvents: log.length,
        totalSessions: sessions.size,
        totalObjections: objections.length,
        openTickets: tickets.filter((t) => t.status === 'open').length,
        byObjection,
        byDistrict,
        avgSentimentShift: avgShift,
        recent: log.slice(-15).reverse(),
    };
}
