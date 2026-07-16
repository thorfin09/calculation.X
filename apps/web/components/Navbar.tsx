'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Moon, Sun, Award, Settings, BookOpen, BarChart2, LogOut, User, Key, X, Eye, EyeOff, Lock } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [streak, setStreak] = useState<number>(0);
  const [minutesToday, setMinutesToday] = useState<number>(0);
  const [goal, setGoal] = useState<number>(10);
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('Guest');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginInput, setLoginInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string>('');

  // Load theme, auth status, and stats on mount
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load auth status from localStorage or sessionStorage
    const localLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const sessionLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const loggedIn = localLoggedIn || sessionLoggedIn;
    
    setIsLoggedIn(loggedIn);
    const activeUser = localStorage.getItem('username') || sessionStorage.getItem('username') || 'Guest';
    setUsername(activeUser);

    // Fetch stats
    fetchStats(loggedIn, activeUser);

    const handleStatsUpdate = () => {
      const currentLocal = localStorage.getItem('isLoggedIn') === 'true';
      const currentSession = sessionStorage.getItem('isLoggedIn') === 'true';
      const isUserLoggedIn = currentLocal || currentSession;
      const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || 'Guest';
      fetchStats(isUserLoggedIn, currentUser);
    };

    const handleAuthUpdate = () => {
      const currentLocal = localStorage.getItem('isLoggedIn') === 'true';
      const currentSession = sessionStorage.getItem('isLoggedIn') === 'true';
      const loggedInNow = currentLocal || currentSession;
      const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || 'Guest';
      
      setIsLoggedIn(loggedInNow);
      setUsername(currentUser);
      fetchStats(loggedInNow, currentUser);
    };

    const handleOpenLogin = () => {
      setLoginError('');
      setShowLoginModal(true);
    };

    window.addEventListener('sessionCompleted', handleStatsUpdate);
    window.addEventListener('settingsUpdated', handleStatsUpdate);
    window.addEventListener('authStatusChanged', handleAuthUpdate);
    window.addEventListener('openLoginModal', handleOpenLogin);

    return () => {
      window.removeEventListener('sessionCompleted', handleStatsUpdate);
      window.removeEventListener('settingsUpdated', handleStatsUpdate);
      window.removeEventListener('authStatusChanged', handleAuthUpdate);
      window.removeEventListener('openLoginModal', handleOpenLogin);
    };
  }, []);

  const fetchStats = async (loggedIn: boolean, activeUser: string) => {
    if (!loggedIn || activeUser === 'Guest') {
      setStreak(0);
      setMinutesToday(0);
      return;
    }

    try {
      const localDate = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local format
      const res = await fetch(`/api/dashboard?localDate=${localDate}`, {
        headers: {
          'x-user-username': activeUser
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStreak(data.currentStreak || 0);
        setMinutesToday(data.minutesToday || 0);
        setGoal(data.user?.dailyGoalMinutes || 10);
      }
    } catch (e) {
      console.error('Failed to load navigation stats', e);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput) return;
    setLoginError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginInput.trim(),
          password: passwordInput
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        
        // Remove from the other storage to prevent sync issues
        if (rememberMe) {
          sessionStorage.removeItem('isLoggedIn');
          sessionStorage.removeItem('username');
        } else {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('username');
        }

        targetStorage.setItem('isLoggedIn', 'true');
        targetStorage.setItem('username', data.username);
        
        setIsLoggedIn(true);
        setUsername(data.username);
        setShowLoginModal(false);
        setLoginInput('');
        setPasswordInput('');
        setLoginError('');

        // Trigger local update across components
        window.dispatchEvent(new Event('authStatusChanged'));
      } else {
        setLoginError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Network error. Failed to reach verification server.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    
    setIsLoggedIn(false);
    setUsername('Guest');

    // Trigger local update
    window.dispatchEvent(new Event('authStatusChanged'));
    window.location.href = '/';
  };

  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const percentComplete = Math.min(100, Math.round((minutesToday / goal) * 100));

  return (
    <header className="glass-card" style={{
      margin: '16px auto',
      width: 'calc(100% - 32px)',
      maxWidth: '1200px',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
      padding: '12px 24px',
      borderRadius: '16px',
      border: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px', color: 'hsl(var(--text-primary))', textDecoration: 'none' }}>
        <span>calculation.X</span>
      </Link>

      {/* Navigation items */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        {[
          { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
          { name: 'Arena', path: '/arena', icon: Award },
          { name: 'Tricks', path: '/tricks', icon: BookOpen },
          { name: 'Settings', path: '/settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className="btn"
              style={{
                background: active ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: active ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))',
                border: 'none',
                padding: '8px 16px',
                fontSize: '0.9rem',
                borderRadius: '8px',
              }}
            >
              <Icon size={16} />
              <span className="nav-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right widgets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isLoggedIn ? (
          <>
            {/* Daily Time Mini Progress */}
            <div 
              title={`Today's training: ${minutesToday}/${goal} mins (${percentComplete}%)`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                backgroundColor: 'hsl(var(--bg-tertiary))',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid hsl(var(--border-color))',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              <div style={{
                position: 'relative',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: `conic-gradient(hsl(var(--accent-primary)) ${percentComplete * 3.6}deg, hsl(var(--border-color)) 0deg)`
              }}>
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: '3px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'hsl(var(--bg-tertiary))'
                }} />
              </div>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>
                {minutesToday}m / {goal}m
              </span>
            </div>

            {/* Daily Streak Indicator */}
            {streak > 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(255, 90, 0, 0.15) 0%, rgba(255, 170, 0, 0.15) 100%)',
                border: '1px solid rgba(255, 90, 0, 0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 'bold',
                color: 'hsl(var(--accent-warning))',
                animation: 'flameBurn 3s infinite ease-in-out',
                fontSize: '0.9rem',
              }}>
                <Flame size={16} fill="hsl(var(--accent-warning))" />
                <span>{streak} Day{streak > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'hsl(var(--bg-tertiary))',
                border: '1px solid hsl(var(--border-color))',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: '600',
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.9rem',
              }}>
                <Flame size={16} style={{ opacity: 0.5 }} />
                <span>0 Streak</span>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-icon"
              style={{ width: '36px', height: '36px', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--accent-error))' }}
              title={`Logged in as ${username}. Click to Logout`}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          /* Guest mode sign-in button */
          <button
            onClick={() => {
              setLoginError('');
              setShowLoginModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px', borderRadius: '8px', boxShadow: 'var(--glow-effect)' }}
          >
            Sign In
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          style={{ width: '36px', height: '36px', border: '1px solid hsl(var(--border-color))' }}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card animate-slide" style={{
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            border: '1px solid var(--glass-border)'
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--text-muted))'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--accent-primary))',
                marginBottom: '12px'
              }}>
                <Key size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'hsl(var(--text-primary))' }}>Sign in to calculation.X</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginTop: '6px' }}>
                Access streaks, operational analytics, and mistakes.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Login Error notification */}
              {loginError && (
                <div style={{
                  backgroundColor: 'rgba(255, 0, 100, 0.1)',
                  border: '1px solid hsl(var(--accent-error))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: 'hsl(var(--accent-error))',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {loginError}
                </div>
              )}

              {/* Username field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                  Username
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="e.g. Mental Athlete"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--bg-tertiary))',
                      border: '1px solid hsl(var(--border-color))',
                      color: 'hsl(var(--text-primary))',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password field with show/hide toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--bg-tertiary))',
                      border: '1px solid hsl(var(--border-color))',
                      color: 'hsl(var(--text-primary))',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--text-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember password tickmark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    accentColor: 'hsl(var(--accent-primary))',
                    width: '15px',
                    height: '15px'
                  }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                  Remember Password
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px', boxShadow: 'var(--glow-effect)' }}
              >
                Sign In / Sign Up
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-text {
            display: none;
          }
          header {
            padding: 8px 16px;
          }
        }
      `}</style>
    </header>
  );
}
