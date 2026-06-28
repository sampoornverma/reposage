import React from 'react';
import './LandingPage.css';
import { Bot, Code2, Send, Check, User, ShieldCheck, Database } from 'lucide-react';

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
        
        <div className="demo-showcase" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          
          {/* AI Message */}
          <div style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={20} color="var(--accent-blue)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>RepoSage</div>
              <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>Hello! I have mapped the vector space for your repository. What would you like to know?</div>
            </div>
          </div>

          {/* User Message */}
          <div style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', background: 'transparent', border: 'none', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={20} color="#8b5cf6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#8b5cf6' }}>You</div>
              <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>How is the SSE streaming logic maintained?</div>
            </div>
          </div>

          {/* AI Message with validation */}
          <div style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={20} color="var(--accent-blue)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>RepoSage</div>
              <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                The SSE streaming is handled in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>server/src/app.js</code> (Lines 115-140) where it intercepts the LLM chunks. The validation is done in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>citationValidator.js</code> before sending the final event.
                <br/><br/>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                  <Check size={14} /> Citation Validated
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <section className="demo-section" style={{ background: 'var(--bg-secondary)', padding: '80px 20px', textAlign: 'center' }}>
        <div className="demo-header" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Ablation Tested. Production Ready.</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', lineHeight: '1.6' }}>
            In rigorous internal ablation testing, our <strong>Advanced Hybrid Search</strong> outperformed pure semantic search on 4 out of 5 complex architectural queries. 
            How do we achieve this precision? We don't just read your code like a text file.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '60px auto 0', textAlign: 'left' }}>
          {/* Card 1 */}
          <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <Code2 size={28} /> Multi-Language AST Parsing
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
              We use Tree-sitter to parse JavaScript, TypeScript, and Python into Abstract Syntax Trees. 
              Instead of blindly chopping code every 100 lines, we chunk it logically by functions and classes, ensuring the LLM sees the complete architectural picture.
            </p>
          </div>
          
          {/* Card 2 */}
          <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <Bot size={28} /> Advanced Hybrid Search
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
              Pure semantic search is a thing of the past. RepoSage utilizes a powerful <strong>Advanced Hybrid Search</strong> mechanism. 
              By seamlessly merging BM25 keyword matching with OpenAI text-embedding-3-small vectors using Reciprocal Rank Fusion, we retrieve hyper-relevant code snippets.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <ShieldCheck size={28} /> Self-Healing Pipeline
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
              Our dual-mode LLM pipeline intercepts Server-Sent Events in real-time. If the AI hallucinates a non-existent file path, the Regex-powered <strong>Citation Validator</strong> catches it instantly, triggering a Strict JSON fallback mode.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <Database size={28} /> Resilient Vector DB
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
              Built on PostgreSQL with <strong>pgvector</strong> and an <code>IVFFlat lists=100</code> index for lightning-fast cosine similarity. Integrated with native <code>ON DELETE CASCADE</code> schemas and BullMQ Redis workers to ensure zero orphaned vectors.
            </p>
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
