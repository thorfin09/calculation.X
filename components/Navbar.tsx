'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Moon, Sun, Award, Settings, BookOpen, BarChart2, LogOut, User, Key, X, Eye, EyeOff, Lock, Mail, Phone, Check } from 'lucide-react';

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
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

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
      setAuthError('');
      setAuthSuccess('');
      setAuthTab('signin');
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
    if (!loginInput.trim() || !loginPassword) return;
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          loginInput: loginInput.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        
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
        setLoginPassword('');
        setAuthError('');

        window.dispatchEvent(new Event('authStatusChanged'));
      } else {
        setAuthError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Network error. Failed to reach verification server.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword) return;
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          username: signupUsername.trim(),
          email: signupEmail.trim(),
          phone: signupPhone.trim(),
          password: signupPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthSuccess(data.message || 'Registration complete! You can now log in.');
        
        // Auto-fill sign in form and swap tab
        setLoginInput(signupUsername.trim());
        setSignupUsername('');
        setSignupEmail('');
        setSignupPhone('');
        setSignupPassword('');
        
        setTimeout(() => {
          setAuthTab('signin');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error || 'Registration failed. Check entered details.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out? Your calculations won't be saved to analytics until you sign in again.")) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('username');
      
      setIsLoggedIn(false);
      setUsername('Guest');

      window.dispatchEvent(new Event('authStatusChanged'));
      window.location.href = '/';
    }
  };

  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const percentComplete = Math.min(100, Math.round((minutesToday / goal) * 100));

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { name: 'Arena', path: '/arena', icon: Award },
    { name: 'Tricks', path: '/tricks', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* HEADER NAVBAR (Desktop & Mobile Header Wrapper) */}
      <header className="header-container glass-card" style={{
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
          <span className="header-logo">calculation.X</span>
        </Link>

        {/* Desktop Navigation items (Hidden on Mobile) */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '8px' }}>
          {navigationItems.map((item) => {
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
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn ? (
            <>
              {/* Daily Progress Ring (Hidden on Small Screens) */}
              <div 
                className="desktop-progress"
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
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  color: 'hsl(var(--accent-warning))',
                  animation: 'flameBurn 3s infinite ease-in-out',
                  fontSize: '0.85rem',
                }}>
                  <Flame size={14} fill="hsl(var(--accent-warning))" />
                  <span>{streak}d</span>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'hsl(var(--bg-tertiary))',
                  border: '1px solid hsl(var(--border-color))',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  color: 'hsl(var(--text-secondary))',
                  fontSize: '0.85rem',
                }}>
                  <Flame size={14} style={{ opacity: 0.5 }} />
                  <span>0d</span>
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
                setAuthError('');
                setAuthSuccess('');
                setAuthTab('signin');
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
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at the bottom on Mobile Screens) */}
      <div className="mobile-bottom-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: active ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))',
                textDecoration: 'none',
                flex: 1,
                padding: '6px 0',
                transition: 'color 0.2s ease',
              }}
            >
              <Icon size={20} style={{ filter: active ? 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))' : 'none' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: active ? '700' : '500' }}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Sign In & Sign Up Modal Overlay */}
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
          padding: '16px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card animate-slide" style={{
            padding: '28px',
            width: '100%',
            maxWidth: '420px',
            position: 'relative',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            {/* Close Button */}
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

            {/* Tab Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: 'hsl(var(--bg-tertiary))',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '24px',
              border: '1px solid hsl(var(--border-color))'
            }}>
              <button
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: authTab === 'signin' ? 'hsl(var(--accent-primary))' : 'transparent',
                  color: authTab === 'signin' ? '#0b0f17' : 'hsl(var(--text-secondary))',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab('signup');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: authTab === 'signup' ? 'hsl(var(--accent-primary))' : 'transparent',
                  color: authTab === 'signup' ? '#0b0f17' : 'hsl(var(--text-secondary))',
                  transition: 'all 0.2s'
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Feedback Alerts */}
            {authError && (
              <div style={{
                backgroundColor: 'rgba(255, 0, 100, 0.08)',
                border: '1px solid hsl(var(--accent-error))',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: 'hsl(var(--accent-error))',
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {authError}
              </div>
            )}
            {authSuccess && (
              <div style={{
                backgroundColor: 'rgba(0, 255, 100, 0.08)',
                border: '1px solid hsl(var(--accent-success))',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: 'hsl(var(--accent-success))',
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Check size={16} />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authTab === 'signin' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Username, Email, or Phone
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="Username / Email / Phone"
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'hsl(var(--accent-primary))', width: '15px', height: '15px' }}
                  />
                  <label htmlFor="rememberMe" style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontWeight: '600' }}>
                    Remember Password
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '8px', boxShadow: 'var(--glow-effect)' }}
                >
                  Sign In
                </button>
              </form>
            ) : (
              /* SIGN UP / REGISTER FORM */
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Username
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="e.g. mentalathlete"
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
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Email (Gmail)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="username@gmail.com"
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
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Phone Number
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="e.g. +91 99999 99999"
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
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-secondary))' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
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
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '10px', boxShadow: 'var(--glow-effect)' }}
                >
                  Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Styling Hooks to handle mobile layouts globally */}
      <style jsx global>{`
        /* Mobile Bottom Tab Navigation */
        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          /* Adjust main view padding to prevent tab bar overlapping content */
          body {
            padding-bottom: 76px !important;
          }
          
          .desktop-nav, .desktop-progress {
            display: none !important;
          }
          
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: var(--glass-bg);
            backdrop-filter: blur(16px);
            border-top: 1px solid var(--glass-border);
            justify-content: space-around;
            align-items: center;
            padding: 8px 0;
            z-index: 999;
            box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.3);
          }

          .header-container {
            margin: 8px auto !important;
            padding: 10px 16px !important;
            width: calc(100% - 16px) !important;
            border-radius: 12px !important;
          }

          .header-logo {
            font-size: 1.15rem !important;
          }
        }
      `}</style>
    </>
  );
}
