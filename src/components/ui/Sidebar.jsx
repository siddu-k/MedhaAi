import useAppStore from '../../stores/appStore';

const NAV = [
    { id: 'home', label: 'Home', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/></svg>
    )},
    { id: 'explore', label: 'Explore Careers', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polygon points="16 8 13.5 13.5 8 16 10.5 10.5" fill="currentColor" stroke="none"/></svg>
    )},
    { id: 'compare', label: 'Compare Trades', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="12" width="3.5" height="8" rx="1"/><rect x="10.2" y="7" width="3.5" height="13" rx="1"/><rect x="16.5" y="3" width="3.5" height="17" rx="1"/></svg>
    )},
    { id: 'earnings', label: 'Earnings & Jobs', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
    )},
    { id: 'roadmap', label: 'Career Roadmap', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20L9 4M9 4h11M9 4L6 8M15 20l-3-8m3 8h5m-5 0l-2-4" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 17h4" strokeLinecap="round"/></svg>
    )},
    { id: 'family', label: 'Family Counselling', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.6c2.8.4 5 2.6 5 5.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
    )},
    { id: 'resources', label: 'Resources', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zm0 0a2 2 0 002 2h13"/></svg>
    )},
    { id: 'admin', label: 'Admin Dashboard', icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></svg>
    )},
];

export default function Sidebar({ activeNav = 'home', onNav = null }) {
    const {
        sidebarOpen, toggleSidebar,
        createSession, signOut, setCurrentPage, userName,
        setPendingUserPrompt,
    } = useAppStore();
    const lang = useAppStore((s) => s.lang);

    const handleNewChat = async () => {
        await createSession();
        if (onNav) onNav('home');
    };

    const handleNav = (id) => {
        if (onNav) onNav(id);
        if (id === 'admin') {
            setCurrentPage('admin');
            if (window.innerWidth < 1024) toggleSidebar();
            return;
        }
        setCurrentPage('dashboard');
        if (id === 'family') {
            useAppStore.getState().startInterview('Family career counselling — learner with parents');
            if (window.innerWidth < 1024) toggleSidebar();
            return;
        }
        const prompts = {
            explore: 'Explore vocational careers suitable for me based on my interests',
            compare: 'Compare Electrician vs Fitter: skills, earnings and jobs',
            earnings: 'Show verified earnings and placement data for ITI trades',
            roadmap: 'Create my personalised career roadmap step by step',
            family: 'My parents have concerns about vocational careers. Please counsel us together.',
            resources: 'Show government resources for ITI and vocational training',
        };
        if (prompts[id]) setPendingUserPrompt({ prompt: prompts[id], autoSend: id !== 'home' });
        if (window.innerWidth < 1024) toggleSidebar();
    };

    return (
        <>
            {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={toggleSidebar} />}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 h-full w-[252px] flex flex-col shrink-0 transition-transform duration-300`}
                style={{ background: '#4d0d0d' }}
            >
                <div className="absolute left-0 top-0 bottom-0 w-[6px] kaushal-ethnic-edge" />
                <div className="pl-5 pr-4 pt-5 pb-3 flex items-center gap-2.5">
                    <svg width="42" height="42" viewBox="0 0 48 48" className="shrink-0">
                        <path d="M24 4C20 10 14 14 8 16c6 1 11 0 14-2-1 4-1 8 0 12-3-2-8-3-12-2 5 4 10 6 14 6-1 3-1 6 0 9 1-3 1-6 0-9 4 0 9-2 14-6-4-1-9 0-12 2 1-4 1-8 0-12 3 2 8 3 14 2-6-2-12-6-16-12z" fill="#e8802e"/>
                        <path d="M24 10c-2.5 4-6 6.5-10 7.5 3 .5 6 0 8-1-.5 2.5-.5 5 0 7.5-2-1-4.5-1.5-7-1 3 2.5 6 3.5 8.5 3.5-.5 2-.5 4 0.5 6 .8-2 1-4 .5-6 2.5 0 5.5-1 8.5-3.5-2.5-.5-5 0-7 1 .5-2.5.5-5 0-7.5 2 1 5 1.5 8 1-4-1-7.5-3.5-10-7.5z" fill="#f5c86e"/>
                        <ellipse cx="24" cy="38" rx="4" ry="2.5" fill="#7a1f1f" stroke="#f5c86e" strokeWidth="1"/>
                    </svg>
                    <div>
                        <p className="font-bold text-[19px] leading-none tracking-tight" style={{ color: '#fdf3e0', fontFamily: 'Georgia, serif' }}>Medha</p>
                        <p className="text-[11px] mt-1" style={{ color: '#c98a5b' }}>AI Career Counselling</p>
                    </div>
                </div>

                <div className="px-4 pb-2 pl-5">
                    <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-semibold" style={{ background: '#f7e8c9', color: '#4d0d0d' }}>
                        <span className="text-[18px] leading-none font-light">+</span> New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pl-5 pr-4 py-2 kaushal-scroll">
                    <h4 className="mb-2 text-[10.5px] font-semibold uppercase" style={{ color: '#a0613c', letterSpacing: '0.08em' }}>Main Menu</h4>
                    <nav className="space-y-[3px]">
                        {NAV.map((item) => {
                            const active = activeNav === item.id;
                            return (
                                <button key={item.id} onClick={() => handleNav(item.id)} className="w-full flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px] font-medium transition-all" style={{ background: active ? '#f7e8c9' : 'transparent', color: active ? '#4d0d0d' : '#f0d9b5', fontWeight: active ? 700 : 500 }}>
                                    <span style={{ color: active ? '#4d0d0d' : '#e8a83e' }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="pl-5 pr-4 pb-4 pt-1">
                    <div className="py-2 space-y-[3px]" style={{ borderTop: '1px solid rgba(240,217,181,0.2)' }}>
                        <button onClick={() => setCurrentPage('settings')} className="w-full flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px]" style={{ color: '#f0d9b5' }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e8a83e" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                            Settings
                        </button>
                        <button onClick={() => useAppStore.getState().setLang(useAppStore.getState().lang === 'hi' ? 'en' : 'hi')} className="w-full flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px]" style={{ color: '#f0d9b5' }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e8a83e" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>
                            Language <span className="ml-auto text-[12px] opacity-70">{lang === 'hi' ? 'HI ›' : 'EN ›'}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2.5 px-2 py-2.5" style={{ borderTop: '1px solid rgba(240,217,181,0.2)' }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-semibold" style={{ background: '#9a8a76', color: '#fff' }}>{(userName?.charAt(0) || 'S').toUpperCase()}</div>
                        <div className="flex-1 leading-tight">
                            <p className="text-[13px] font-semibold" style={{ color: '#fdf3e0' }}>{userName || 'siddu'}</p>
                            <p className="text-[11px]" style={{ color: '#a0613c' }}>Student</p>
                        </div>
                        <span style={{ color: '#a0613c' }}>›</span>
                    </div>
                    <button onClick={signOut} className="w-full flex items-center justify-center gap-2 py-2 text-[13px]" style={{ color: '#f0d9b5' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
