import { useState } from 'react';
import CardBeamAnimation from '../components/landing/CardBeamAnimation';
import ShapeWaveAnimation from '../components/landing/ShapeWaveAnimation';
import useAppStore from '../stores/appStore';

export default function LandingPage() {
  const [name, setName] = useState('');
  const { setUserName } = useAppStore();

  const handleInputChange = (e) => {
    const val = e.target.value;
    setName(val);

    // Trigger parallel wave ripple originating from the input box on every letter typed
    const rect = e.target.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent('shape-wave-key', {
        detail: {
          x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 80,
          y: rect.top + rect.height / 2,
        },
      })
    );
  };

  const handleKeyDown = (e) => {
    // Also trigger on Backspace, Space, Enter, or any other typing key
    if (e.key === 'Backspace' || e.key === ' ' || e.key.length === 1) {
      const rect = e.target.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent('shape-wave-key', {
          detail: {
            x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 80,
            y: rect.top + rect.height / 2,
          },
        })
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setUserName(name.trim());
    }
  };

  return (
    <div className="landing-split-container">
      {/* ── TOP SECTION (40% Height): Technical Blueprint Diagram Beam Animation ── */}
      <section className="landing-top-section">
        <CardBeamAnimation />
      </section>

      {/* ── BOTTOM SECTION (60% Height): Keystroke-Interactive Parallel Shape Wave + Clean Name Input ── */}
      <section className="landing-bottom-section">
        <ShapeWaveAnimation />

        {/* User Name Input Card */}
        <div className="landing-name-card" data-shape-mask>
          <div className="landing-name-header">
            <div className="landing-badge-transform">
              <span className="badge-theory-strikethrough">THEORY</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="badge-arrow-icon"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/></svg>
              <span className="badge-visualize-glow">VISUALIZE</span>
            </div>
            <h1 className="landing-name-title">Welcome to Tyloop AI</h1>
            <p className="landing-name-subtitle">Don't just read theory. Visualize, interact, and master concepts.</p>
          </div>

          <form onSubmit={handleSubmit} className="landing-name-form">
            <div className="landing-name-input-wrapper">
              <input
                type="text"
                value={name}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name"
                className="landing-name-input"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="landing-name-btn"
            >
              Continue
            </button>
          </form>

          <p className="landing-name-footer">
            Your name and chat history are stored locally on this device.
          </p>
        </div>
      </section>
    </div>
  );
}
