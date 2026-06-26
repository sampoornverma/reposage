import React from 'react';
import './LandingPage.css';
import { Bot, Code2, Send, Check } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-logo">RepoSage</div>
        <div className="landing-nav-links">
          <a className="landing-nav-link">Pricing</a>
          <a className="landing-nav-link">Support</a>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-left">
          <h1 className="hero-title">
            <span className="hero-title-gradient">Chat with your</span>
            Codebase
          </h1>
          <p className="hero-subtitle">
            No Code, No Hassle — Just Powerful Codebase Search and Chat at Your Fingertips.
          </p>
          
          <button onClick={onStart} className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px', width: 'fit-content' }}>
            Get Started
          </button>
        </div>

        <div className="hero-right">
          <div className="peeking-github-wrapper">
            <div className="mockup-header" style={{ padding: '0 15px', display: 'flex', gap: '6px', alignItems: 'center', height: '30px', background: 'rgba(255,255,255,0.1)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <img 
              src="/hero-mockup.png" 
              alt="GitHub Repo"
              style={{ objectFit: 'cover', width: '100%', height: 'calc(100% - 30px)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}
            />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-header">
          <h2>See RepoSage in Action</h2>
          <p>Instant answers. Infinite context. Zero hallucinations.</p>
        </div>
        
        <div className="demo-showcase">
          <div className="demo-chat">
            <div style={{ background: '#1f2937', color: '#fff', padding: '16px 24px', borderRadius: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
              <strong>RepoSage:</strong> Hello! I have mapped the vector space for your repository. What would you like to know?
            </div>
            <div style={{ background: '#2563eb', color: '#fff', padding: '16px 24px', borderRadius: '12px', alignSelf: 'flex-end', maxWidth: '80%' }}>
              <strong>You:</strong> How is the SSE streaming logic maintained?
            </div>
            <div style={{ background: '#1f2937', color: '#fff', padding: '16px 24px', borderRadius: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
              <strong>RepoSage:</strong> The SSE streaming is handled in <code>server/src/app.js</code> (Lines 115-140) where it intercepts the LLM chunks. The validation is done in <code>citationValidator.js</code> before sending the final event. 
              <br/><br/>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>✅ Citation Validated</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="pricing-header">
          <h2>Simple Pricing, Powerful Features</h2>
          <p>Choose the plan that fits your needs and start chatting with your codebase today.</p>
        </div>

        <div className="pricing-cards">
          {/* Starter Plan */}
          <div className="pricing-card">
            <h3>Starter Plan</h3>
            <p>Ideal for individuals, small-scale use and testing.</p>
            <div className="pricing-price">$3</div>
            <button className="btn-outline" onClick={onStart}>Get Started</button>
            <ul className="pricing-features">
              <li className="pricing-feature"><Check size={16} /> 100 credits included ($0.03 per credit).</li>
              <li className="pricing-feature"><Check size={16} /> Ideal for small projects or testing.</li>
              <li className="pricing-feature"><Check size={16} /> Simple one-time payment.</li>
            </ul>
          </div>

          {/* Smart Plan (Featured) */}
          <div className="pricing-card featured">
            <div className="featured-badge">Best Seller</div>
            <h3>Smart Plan</h3>
            <p>Recharge automatically whenever credits run out.</p>
            <div className="pricing-price">Flexible pricing</div>
            <button className="btn-outline" onClick={onStart}>Get Started</button>
            <ul className="pricing-features">
              <li className="pricing-feature"><Check size={16} /> Choose the amount to recharge with.</li>
              <li className="pricing-feature"><Check size={16} /> Automatically billed when credits expire.</li>
              <li className="pricing-feature"><Check size={16} /> Complete control over your spending.</li>
              <li className="pricing-feature"><Check size={16} /> Cancel Anytime.</li>
            </ul>
          </div>

          {/* Custom Payment */}
          <div className="pricing-card">
            <h3>Custom Payment</h3>
            <p>Full flexibility with a one-time payment option.</p>
            <div className="pricing-price">Your choice</div>
            <button className="btn-outline" onClick={onStart}>Get Started</button>
            <ul className="pricing-features">
              <li className="pricing-feature"><Check size={16} /> Pay only for what you need.</li>
              <li className="pricing-feature"><Check size={16} /> No automatic charges - you're in full control.</li>
              <li className="pricing-feature"><Check size={16} /> Best for teams with specific usage patterns.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
