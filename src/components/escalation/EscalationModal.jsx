import { useState } from 'react';
import useAppStore from '../../stores/appStore';
import { createTicket } from '../../services/engagementLog';

const REASONS = [
    'Income / salary doubts',
    'Job security fears',
    'Family does not approve',
    'Safety concerns',
    'Want course / college guidance',
    'Other',
];

export default function EscalationModal({ onClose }) {
    const { messages, currentSession } = useAppStore();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [district, setDistrict] = useState('');
    const [reason, setReason] = useState(REASONS[0]);
    const [done, setDone] = useState(null);

    const submit = () => {
        const transcript = messages.map((m) => `${m.role === 'user' ? 'Family' : 'Medha'}: ${m.content}`).join('\n\n');
        const t = createTicket({ name, phone, district, reason, sessionId: currentSession?.id, transcript });
        setDone(t);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(40,10,10,0.55)' }} onClick={onClose}>
            <div className="w-full max-w-[440px] rounded-2xl bg-[#fffdf5] p-6 shadow-2xl" style={{ border: '1px solid #e8d5b5' }} onClick={(e) => e.stopPropagation()}>
                {!done ? (
                    <>
                        <h3 className="text-[18px] font-bold" style={{ color: '#4d0d0d', fontFamily: 'Georgia, serif' }}>Talk to a human counsellor</h3>
                        <p className="text-[12.5px] mt-1 mb-4" style={{ color: '#6b5a4a' }}>A government skill counsellor will call you back. Your recent chat goes with the request.</p>
                        <label className="block text-[12px] font-semibold mb-1" style={{ color: '#4d0d0d' }}>Your name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakshmi" className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none mb-3" style={{ background: '#f8efdc', border: '1px solid #e8d5b5', color: '#4d0d0d' }} />
                        <label className="block text-[12px] font-semibold mb-1" style={{ color: '#4d0d0d' }}>Phone number</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none mb-3" style={{ background: '#f8efdc', border: '1px solid #e8d5b5', color: '#4d0d0d' }} />
                        <label className="block text-[12px] font-semibold mb-1" style={{ color: '#4d0d0d' }}>District</label>
                        <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Guntur" className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none mb-3" style={{ background: '#f8efdc', border: '1px solid #e8d5b5', color: '#4d0d0d' }} />
                        <label className="block text-[12px] font-semibold mb-1" style={{ color: '#4d0d0d' }}>What should they help with?</label>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {REASONS.map((r) => (
                                <button key={r} onClick={() => setReason(r)} className="px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: reason === r ? '#4d0d0d' : '#f3e5c8', color: reason === r ? '#fff' : '#5a3a2a' }}>{r}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-white" style={{ border: '1px solid #d9a679', color: '#4d0d0d' }}>Cancel</button>
                            <button onClick={submit} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: '#7a1f1f' }}>Request callback</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: '#e8f3ec' }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2e7d5b" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                        <h3 className="text-[17px] font-bold" style={{ color: '#4d0d0d' }}>Request received</h3>
                        <p className="text-[12.5px] mt-1" style={{ color: '#6b5a4a' }}>Ticket <b>{done.id}</b> — a counsellor will call <b>{done.phone || 'you'}</b> soon.</p>
                        <button onClick={onClose} className="mt-5 px-8 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: '#4d0d0d' }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
