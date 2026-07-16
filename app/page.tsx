import React from 'react';
import Link from 'next/link';
import { Award, Zap, ShieldCheck, Calendar, BookOpen, Clock, ArrowRight, Flame } from 'lucide-react';

export default function Home() {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px 80px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '80px',
      width: '100%'
    }}>
      {/* Hero Section */}
      <section className="animate-slide" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px',
        maxWidth: '800px',
        marginTop: '40px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          padding: '8px 16px',
          borderRadius: '30px',
          fontSize: '0.9rem',
          fontWeight: '700',
          color: 'hsl(var(--accent-primary))',
        }}>
          <Zap size={16} fill="hsl(var(--accent-primary))" />
          <span>Calculations, but 10x faster</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: '900',
          lineHeight: '1.05',
          letterSpacing: '-1.5px',
        }}>
          Improve Mental Math in <span className="glow-text" style={{ color: 'hsl(var(--accent-primary))' }}>10 Minutes</span> Daily
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: 'hsl(var(--text-secondary))',
          lineHeight: '1.6',
          maxWidth: '650px',
        }}>
          calculation.X is a hyper-focused calculation trainer designed for competitive aspirants (IBPS, SBI, CAT, SSC) and brain enthusiasts. Practice daily, track mistakes, and unlock lightning speed.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/arena" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Enter Training Arena
            <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Grid of Key Features */}
      <section style={{ width: '100%' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: '800',
          marginBottom: '48px',
          letterSpacing: '-0.5px',
        }}>
          Built for Automaticity and Speed
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 242, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-primary))'
            }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>The 10-Minute Philosophy</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Consistency beats cramming. A structured, progressive 10-minute daily challenge that focuses on warmup, speed drills, and advanced numeric roots.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 255, 120, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-success))'
            }}>
              <Flame size={24} fill="hsl(var(--accent-success))" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Streak Tracking</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Visualize your practice commitment with GitHub-style contribution squares. Build your calculation streak and keep your training flame burning.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-warning))'
            }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Error-Correction (Mistakes)</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Never repeat mistakes. The app automatically isolates questions you answer incorrectly and compiles them into a custom "Mistakes Arena" for targeted drilling.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 0, 100, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-error))'
            }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Vedic Tricks & Tables</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Study fast mental math shortcuts (squaring numbers, multiplying near 100, fraction equivalents) with interactive cards and references.
            </p>
          </div>
        </div>
      </section>

      {/* Structured Workout Breakdown */}
      <section className="glass-card" style={{
        padding: '40px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', textAlign: 'center', letterSpacing: '-0.5px' }}>
          Inside the 10-Minute Daily Challenge
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
          {[
            { phase: 'Phase 1: Warmup (2 Min)', desc: 'Single-digit addition, subtraction, and tables. Prepares your brain, establishes numeric focus, and sets the baseline.', color: 'hsl(var(--accent-primary))' },
            { phase: 'Phase 2: Core Drills (4 Min)', desc: 'Double-digit operations (addition/subtraction) and double-by-single multiplication drills to build calculation endurance.', color: 'hsl(var(--accent-warning))' },
            { phase: 'Phase 3: Advanced Focus (4 Min)', desc: 'Percentage fractions, square roots, cubes, and Vedic shortcuts. Push the bounds of math recall and speed.', color: 'hsl(var(--accent-success))' },
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start',
              borderLeft: `4px solid ${item.color}`,
              paddingLeft: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: item.color, marginBottom: '6px' }}>{item.phase}</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote/Motivation Section */}
      <section style={{ textAlign: 'center', maxWidth: '600px' }}>
        <p style={{
          fontSize: '1.4rem',
          fontWeight: '600',
          fontStyle: 'italic',
          lineHeight: '1.6',
          color: 'hsl(var(--text-primary))'
        }}>
          "Mental arithmetic is not about genius; it is about building neural patterns. 10 minutes of concentrated daily practice beats hours of passive learning."
        </p>
        <div style={{
          marginTop: '16px',
          color: 'hsl(var(--accent-primary))',
          fontWeight: '700',
          fontSize: '0.9rem'
        }}>
          — calculation.X Training Philosophy
        </div>
      </section>
    </div>
  );
}
