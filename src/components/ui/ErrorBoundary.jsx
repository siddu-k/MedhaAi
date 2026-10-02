import { Component } from 'react';
import useAppStore from '../../stores/appStore';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null, stack: '' };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        this.setState({ stack: info?.componentStack || '' });
        console.error('[Medha]', this.props.name || 'view', error, info?.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="h-full w-full flex items-center justify-center p-6 overflow-auto" style={{ background: '#fff6e5' }}>
                    <div className="max-w-[560px] w-full rounded-2xl bg-white p-6 shadow-xl" style={{ border: '1px solid #e8d5b5' }}>
                        <h3 className="text-[16px] font-bold" style={{ color: '#7a1f1f' }}>Something tripped here ({this.props.name || 'view'})</h3>
                        <p className="text-[12.5px] mt-1 mb-3" style={{ color: '#6b5a4a' }}>
                            {String(this.state.error?.message || this.state.error)}
                        </p>
                        <pre className="text-[10.5px] p-3 rounded-xl overflow-auto max-h-[220px] whitespace-pre-wrap" style={{ background: '#f8efdc', color: '#5a3a2a' }}>
                            {this.state.stack || 'no stack'}
                        </pre>
                        <button
                            onClick={() => {
                                try {
                                    useAppStore.getState().exitInterview?.();
                                    useAppStore.getState().setCurrentPage?.('dashboard');
                                } catch (e) {}
                                this.setState({ error: null, stack: '' });
                            }}
                            className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
                            style={{ background: '#4d0d0d' }}
                        >
                            Back to safe home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
