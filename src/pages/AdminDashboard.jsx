import { useMemo, useState } from 'react';
import useAppStore from '../stores/appStore';
import Sidebar from '../components/ui/Sidebar';
import { getStats, getTickets, resolveTicket } from '../services/engagementLog';
import { objectionLabel } from '../services/outcomeService';
import { datasetMeta } from '../services/outcomeService';

function Bar({ label, value, max, color = '#e8802e' }) {
    return (
        <div className="mb-2.5">
            <div className="flex justify-between text-[12px] mb-1">
                <span className="font-semibold" style={{ color: '#4d0d0d' }}>{label}</span>
                <span style={{ color: '#8a6a4a' }}>{value}</span>
            </div>
            <div className="h-2.5 rounded-full" style={{ background: '#f3e5c8' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%`, background: color }} />
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { setCurrentPage } = useAppStore();
    const [version, setVersion] = useState(0);
    const stats = useMemo(() => getStats(), [version]);
    const tickets = useMemo(() => getTickets(), [version]);
    const meta = datasetMeta();

    const maxObj = Math.max(1, ...Object.values(stats.byObjection));
    const districtRows = Object.entries(stats.byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxDist = Math.max(1, ...districtRows.map((r) => r[1]));

    return (
        <div className="h-full w-full flex overflow-hidden" style={{ background: '#fff6e5' }}>
            <Sidebar activeNav="admin" onNav={() => {}} />
            <div className="flex-1 overflow-y-auto kaushal-scroll p-6">
                <div className="max-w-[980px] mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h1 className="text-[26px] font-extrabold" style={{ color: '#3a0d0d', fontFamily: 'Georgia, serif' }}>Scheme Admin Dashboard</h1>
                            <p className="text-[12.5px]" style={{ color: '#6b5a4a' }}>Where parental resistance concentrates — objections, districts, sentiment, callbacks.</p>
                        </div>
                        <button onClick={() => setCurrentPage('dashboard')} className="px-4 py-2 rounded-xl text-[12.5px] font-bold" style={{ background: '#4d0d0d', color: '#fff' }}>Back to counselling</button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        {[
                            { label: 'Counselling sessions', value: stats.totalSessions },
                            { label: 'Objections raised', value: stats.totalObjections },
                            { label: 'Open callbacks', value: stats.openTickets },
                            { label: 'Avg. sentiment shift', value: (stats.avgSentimentShift > 0 ? '+' : '') + stats.avgSentimentShift },
                        ].map((c) => (
                            <div key={c.label} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #efdfc2' }}>
                                <p className="text-[26px] font-extrabold" style={{ color: '#4d0d0d' }}>{c.value}</p>
                                <p className="text-[11.5px]" style={{ color: '#8a6a4a' }}>{c.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #efdfc2' }}>
                            <h3 className="text-[14px] font-bold mb-3" style={{ color: '#4d0d0d' }}>Why families resist</h3>
                            {Object.keys(stats.byObjection).length === 0 && <p className="text-[12px]" style={{ color: '#8a6a4a' }}>No objections logged yet — they appear as families chat.</p>}
                            {Object.entries(stats.byObjection).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                <Bar key={k} label={objectionLabel(k)} value={v} max={maxObj} />
                            ))}
                        </div>
                        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #efdfc2' }}>
                            <h3 className="text-[14px] font-bold mb-3" style={{ color: '#4d0d0d' }}>Resistance hotspots (district)</h3>
                            {districtRows.length === 0 && <p className="text-[12px]" style={{ color: '#8a6a4a' }}>District-wise data appears once families mention or enter their district.</p>}
                            {districtRows.map(([k, v]) => (
                                <Bar key={k} label={k.replace(' :: ', ' — ')} value={v} max={maxDist} color="#7a1f1f" />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl p-5 bg-white mt-3" style={{ border: '1px solid #efdfc2' }}>
                        <h3 className="text-[14px] font-bold mb-1" style={{ color: '#4d0d0d' }}>Human-counsellor callbacks ({tickets.length})</h3>
                        <p className="text-[11.5px] mb-3" style={{ color: '#8a6a4a' }}>Escalations from families the AI could not satisfy. Transcript attached to each.</p>
                        {tickets.length === 0 && <p className="text-[12px]" style={{ color: '#8a6a4a' }}>No callback requests yet.</p>}
                        {tickets.map((t) => (
                            <div key={t.id} className="rounded-xl p-3 mb-2" style={{ background: '#fbf6ea', border: '1px solid #efdfc2' }}>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-[13px] font-bold" style={{ color: '#4d0d0d' }}>{t.id} · {t.name} · {t.district} · {t.phone}</p>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: t.status === 'open' ? '#f8d9a8' : '#cfe8d8', color: '#4d0d0d' }}>{t.status}</span>
                                </div>
                                <p className="text-[12px] mt-1" style={{ color: '#6b5a4a' }}>Reason: {t.reason} · {new Date(t.created_at).toLocaleString('en-IN')}</p>
                                {t.status === 'open' && (
                                    <button onClick={() => { resolveTicket(t.id); setVersion((v) => v + 1); }} className="mt-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white" style={{ background: '#2e7d5b' }}>Mark resolved</button>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-[11px] mt-4 mb-8" style={{ color: '#8a6a4a' }}>Outcome dataset: {meta.currency} · {meta.last_reviewed} · {meta.note}</p>
                </div>
            </div>
        </div>
    );
}
