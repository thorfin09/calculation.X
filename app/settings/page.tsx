'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX, User, Clock, Trash2, CheckCircle, Save } from 'lucide-react';

export default function Settings() {
  const [name, setName] = useState<string>('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  const [saving, setSaving] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [clearingMistakes, setClearingMistakes] = useState<boolean>(false);

  // Load settings on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    fetch('/api/settings', {
      headers: {
        'x-user-username': currentUser
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setName(data.name || 'Mental Athlete');
          setDailyGoalMinutes(data.dailyGoalMinutes || 10);
          setSoundEnabled(data.soundEnabled !== undefined ? data.soundEnabled : true);
        }
      })
      .catch(e => console.error('Failed to load settings', e));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-username': currentUser
        },
        body: JSON.stringify({
          name,
          dailyGoalMinutes: Number(dailyGoalMinutes),
          soundEnabled
        })
      });

      if (res.ok) {
        setShowSuccessToast(true);
        // Dispatch local event to inform Navigation/Dashboard component to update details
        window.dispatchEvent(new Event('settingsUpdated'));
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleClearMistakes = async () => {
    if (!confirm('Are you sure you want to permanently clear your mistake database log?')) return;
    setClearingMistakes(true);
    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    try {
      const res = await fetch('/api/mistakes', {
        method: 'DELETE',
        headers: {
          'x-user-username': currentUser
        }
      });
      if (res.ok) {
        alert('All registered calculation mistakes have been successfully cleared.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClearingMistakes(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      width: '100%'
    }} className="animate-fade">
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
        Settings
      </h1>
      <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', marginBottom: '32px' }}>
        Customize your mental arithmetic training plan
      </p>

      <form onSubmit={handleSaveSettings} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
          Preferences
        </h2>

        {/* Name input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            User Name
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <User size={16} style={{ position: 'absolute', left: '16px', color: 'hsl(var(--text-muted))' }} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--bg-tertiary))',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.95rem',
                fontWeight: '600',
                outline: 'none',
              }}
              placeholder="e.g. Mental Athlete"
              required
            />
          </div>
        </div>

        {/* Daily Goal minutes input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Daily Focus Goal (Minutes)
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Clock size={16} style={{ position: 'absolute', left: '16px', color: 'hsl(var(--text-muted))' }} />
            <input
              type="number"
              min="1"
              max="60"
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--bg-tertiary))',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.95rem',
                fontWeight: '600',
                outline: 'none',
                fontFamily: 'var(--font-jetbrains)'
              }}
              required
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            Recommended: 10 minutes daily for maximum quantitative speed retention.
          </span>
        </div>

        {/* Sound toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--bg-tertiary))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-color))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Audio Cues</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Double-beeps on correct answer, Buzz tones on error.</span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn"
            style={{
              background: soundEnabled ? 'rgba(0, 242, 254, 0.1)' : 'hsl(var(--bg-primary))',
              color: soundEnabled ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))',
              border: '1px solid hsl(var(--border-color))',
              padding: '8px 16px'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{soundEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '16px' }}>
          <button
            type="button"
            onClick={handleClearMistakes}
            disabled={clearingMistakes}
            className="btn btn-outline"
            style={{ color: 'hsl(var(--accent-error))', borderColor: 'rgba(255, 0, 100, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={16} />
            <span>Reset Mistakes Log</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', boxShadow: 'var(--glow-effect)' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Success notification */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'hsl(var(--bg-secondary))',
          border: '1px solid hsl(var(--accent-success))',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          color: 'hsl(var(--accent-success))',
          fontWeight: '700',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <CheckCircle size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
}
