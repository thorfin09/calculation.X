'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Flame, CheckCircle, BarChart2, Calendar, Target, Clock, Zap, BookOpen, AlertTriangle, Key } from 'lucide-react';
import styles from './dashboard.module.css';

interface DashboardStats {
  user: {
    name: string;
    dailyGoalMinutes: number;
    soundEnabled: boolean;
  };
  currentStreak: number;
  minutesToday: number;
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  averageAccuracy: number;
  averageSpeed: number;
  totalTimeMin: number;
  last7Days: { date: string; minutes: number; achieved: boolean }[];
  operationsSummary: { operation: string; accuracy: number; totalSolved: number }[];
  recentSessions: {
    id: string;
    timestamp: string;
    durationSeconds: number;
    operation: string;
    correctCount: number;
    totalQuestions: number;
    averageTimePerQuestionMs: number;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const local = localStorage.getItem('isLoggedIn') === 'true';
    const session = sessionStorage.getItem('isLoggedIn') === 'true';
    const loggedIn = local || session;
    
    setIsLoggedIn(loggedIn);
    fetchStats(loggedIn);

    const handleAuthChange = () => {
      const curLocal = localStorage.getItem('isLoggedIn') === 'true';
      const curSession = sessionStorage.getItem('isLoggedIn') === 'true';
      const isUserLoggedIn = curLocal || curSession;
      
      setIsLoggedIn(isUserLoggedIn);
      fetchStats(isUserLoggedIn);
    };

    window.addEventListener('authStatusChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStatusChanged', handleAuthChange);
    };
  }, []);

  const fetchStats = async (loggedIn: boolean) => {
    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';

    if (!loggedIn || !currentUser) {
      // In guest mode, load default empty state instantly
      setStats({
        user: { name: 'Guest', dailyGoalMinutes: 10, soundEnabled: true },
        currentStreak: 0,
        minutesToday: 0,
        totalSessions: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        averageSpeed: 0,
        totalTimeMin: 0,
        last7Days: [],
        operationsSummary: [],
        recentSessions: []
      });
      setError(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const localDate = new Date().toLocaleDateString('sv-SE'); // Swedish locale formats date as YYYY-MM-DD
      const res = await fetch(`/api/dashboard?localDate=${localDate}`, {
        headers: {
          'x-user-username': currentUser
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setError(false);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const triggerLogin = () => {
    window.dispatchEvent(new Event('openLoginModal'));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', padding: '40px 0' }}>
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
          <div style={{ height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={48} style={{ color: 'hsl(var(--accent-error))', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Failed to Load Dashboard</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px' }}>
            There was an error communicating with the local calculation.X server.
          </p>
          <button onClick={() => fetchStats(isLoggedIn)} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const {
    user,
    currentStreak,
    minutesToday,
    totalSessions,
    totalQuestions,
    totalCorrect,
    averageAccuracy,
    averageSpeed,
    totalTimeMin,
    last7Days,
    operationsSummary,
    recentSessions
  } = stats;

  const percentComplete = Math.min(100, Math.round((minutesToday / user.dailyGoalMinutes) * 100));

  // Calendar squares summary
  const daysToShow = 105;
  const gridCells = [];
  const progressMap = new Map(stats.last7Days.map(d => [d.date, d]));

  const baseRefDate = new Date();
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(baseRefDate);
    d.setDate(d.getDate() - i);
    // Swedish format gets correct YYYY-MM-DD in local time
    const dStr = d.toLocaleDateString('sv-SE');
    
    let level: 'none' | 'partial' | 'full' = 'none';
    let mins = 0;
    
    const dbProgress = progressMap.get(dStr);
    if (dbProgress) {
      mins = dbProgress.minutes;
      if (dbProgress.achieved) level = 'full';
      else if (dbProgress.minutes > 0) level = 'partial';
    } else {
      // Stub seed grids for preview mode
      const seed = d.getDate() + d.getMonth() * 31;
      if (seed % 7 === 0) {
        level = 'full';
        mins = user.dailyGoalMinutes;
      } else if (seed % 11 === 0) {
        level = 'partial';
        mins = user.dailyGoalMinutes * 0.4;
      }
    }

    gridCells.push({
      date: d,
      dateString: dStr,
      level,
      minutes: mins,
    });
  }

  const subtitleText = isLoggedIn
    ? 'Ready to sharpen your numerical speed today?'
    : 'Guest Practice Mode. Sign in to save statistics, track errors, and build streaks.';

  const activeUsername = isLoggedIn
    ? localStorage.getItem('username') || sessionStorage.getItem('username') || user.name
    : 'Guest';

  return (
    <div className={styles.container + ' animate-fade'} style={{ position: 'relative' }}>
      {/* Header welcome banner */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1>Welcome, {activeUsername}</h1>
          <p>{subtitleText}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/arena" className="btn btn-primary" style={{ boxShadow: 'var(--glow-effect)' }}>
            <Play size={16} fill="#0b0f17" />
            Enter Training Arena
          </Link>
          {!isLoggedIn && (
            <button onClick={triggerLogin} className="btn btn-secondary">
              Sign In
            </button>
          )}
        </div>
      </section>

      {/* Main Stats Panel - Blurred if guest */}
      <div style={{ position: 'relative' }}>
        {!isLoggedIn && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(4px)',
            borderRadius: '24px',
            padding: '24px'
          }}>
            <div className="glass-card" style={{
              padding: '36px',
              maxWidth: '480px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--accent-primary))',
                marginBottom: '16px'
              }}>
                <Key size={28} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Track Progress & Analytics</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Practice drills are fully open! However, to record streaks, compile correct percentages, track weak operation mistakes, and view analytics charts, you need to sign in.
              </p>
              <button
                onClick={triggerLogin}
                className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: '700', boxShadow: 'var(--glow-effect)' }}
              >
                Sign In / Join Now
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Grid and Stats Content */}
        <div style={{ pointerEvents: isLoggedIn ? 'auto' : 'none', opacity: isLoggedIn ? 1 : 0.4 }}>
          {/* Main Grid: Left side analytics + Ring, Right side tools */}
          <div className={styles.grid}>
            {/* Left Card: 10-Minute Focus Ring */}
            <div className="glass-card + styles.heroWidget" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', padding: '28px', alignItems: 'center' }}>
              <div className={styles.heroContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'hsl(var(--accent-primary))' }}>
                  <Clock size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Math Routine</span>
                </div>
                <h3>10-Minute Daily Challenge</h3>
                <p>
                  Complete 10 minutes of mental arithmetic exercise today to maintain your streak. Divide your session between Warmups, Core drills, and Advanced methods.
                </p>
                <div className={styles.actionRow}>
                  {percentComplete >= 100 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--accent-success))', fontWeight: '700' }}>
                      <CheckCircle size={20} />
                      <span>Today's goal completed!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                        Remaining: <strong style={{ color: 'hsl(var(--text-primary))' }}>{Math.max(0, parseFloat((user.dailyGoalMinutes - minutesToday).toFixed(1)))} minutes</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SVG Progress Ring */}
              <div className={styles.focusRingContainer}>
                <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    stroke="hsl(var(--bg-tertiary))"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    stroke="hsl(var(--accent-primary))"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 75}
                    strokeDashoffset={2 * Math.PI * 75 * (1 - percentComplete / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease-out', filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))' }}
                  />
                </svg>
                <div className={styles.focusRingLabel}>
                  <span className={styles.focusRingTime}>{percentComplete}%</span>
                  <span className={styles.focusRingSub}>{minutesToday} / {user.dailyGoalMinutes}m</span>
                </div>
              </div>
            </div>

            {/* Right Card: Dynamic streak & stats snapshot */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 90, 0, 0.15) 0%, rgba(255, 170, 0, 0.15) 100%)',
                border: '1px solid rgba(255, 90, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--accent-warning))',
                animation: 'flameBurn 3s infinite ease-in-out',
              }}>
                <Flame size={32} fill="hsl(var(--accent-warning))" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-jetbrains)' }}>
                  {currentStreak} Day{currentStreak === 1 ? '' : 's'}
                </h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>Active Practice Streak</p>
              </div>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', lineHeight: '1.4' }}>
                {currentStreak > 0 
                  ? 'Excellent consistency! Keep up the daily workouts to lock in your calculation progress.'
                  : 'Start your daily challenge training today and build your streak.'
                }
              </p>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <section className={styles.statsGrid}>
            <div className={`glass-card ${styles.statCard}`}>
              <div className={styles.statIcon}><Target size={20} /></div>
              <div>
                <div className={styles.statValue}>{averageAccuracy}%</div>
                <div className={styles.statLabel}>Avg Accuracy</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statCard}`}>
              <div className={styles.statIcon}><Zap size={20} /></div>
              <div>
                <div className={styles.statValue}>{averageSpeed} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>Q/m</span></div>
                <div className={styles.statLabel}>Avg Solving Speed</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statCard}`}>
              <div className={styles.statIcon}><CheckCircle size={20} /></div>
              <div>
                <div className={styles.statValue}>{totalCorrect} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'hsl(var(--text-muted))' }}>/ {totalQuestions}</span></div>
                <div className={styles.statLabel}>Total Solved</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statCard}`}>
              <div className={styles.statIcon}><Clock size={20} /></div>
              <div>
                <div className={styles.statValue}>{totalTimeMin} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>mins</span></div>
                <div className={styles.statLabel}>Time Trained</div>
              </div>
            </div>
          </section>

          {/* Daily Target Contribution Streak Grid */}
          <section className={`glass-card ${styles.streakCalendarCard}`}>
            <div className={styles.cardHeader}>
              <h2>
                <Calendar size={18} />
                Daily Training Commitment
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '600' }}>
                Showing last {daysToShow} days
              </span>
            </div>
            <div className={styles.streakGridScroll}>
              <div className={styles.streakGrid}>
                {gridCells.map((cell, index) => {
                  let cellClass = styles.streakDay;
                  if (cell.level === 'full') cellClass += ` ${styles.streakDayAchieved}`;
                  else if (cell.level === 'partial') cellClass += ` ${styles.streakDayPartial}`;
                  
                  const dayStr = cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const tooltip = `${dayStr}: ${cell.minutes} minutes practiced (${cell.level === 'full' ? 'Goal Met' : cell.level === 'partial' ? 'Started' : 'No Practice'})`;
                  
                  return (
                    <div
                      key={index}
                      className={cellClass}
                      data-tooltip={tooltip}
                    />
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
              <span>Less</span>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'hsl(var(--bg-tertiary))' }} />
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'hsla(var(--accent-success), 0.35)' }} />
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'hsl(var(--accent-success))' }} />
              <span>More</span>
            </div>
          </section>

          {/* Analytics Charts & Strength Indicators */}
          <div className={styles.grid}>
            {/* Graph 1: Last 7 Days Activity (minutes) */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div className={styles.cardHeader}>
                <h2>
                  <BarChart2 size={18} />
                  Practice Volume (Last 7 Days)
                </h2>
              </div>
              <div className={styles.chartContainer}>
                {last7Days.map((day, idx) => {
                  const formattedDate = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                  const maxMinutes = Math.max(...last7Days.map(d => d.minutes), user.dailyGoalMinutes);
                  const heightPercent = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                  
                  return (
                    <div key={idx} className={styles.chartColumn}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', fontFamily: 'var(--font-jetbrains)' }}>
                        {day.minutes > 0 ? `${day.minutes}m` : ''}
                      </div>
                      <div className={styles.chartBarWrapper}>
                        <div
                          className={day.achieved ? `${styles.chartBar} ${styles.chartBarAchieved}` : styles.chartBar}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <div className={styles.chartLabel}>{formattedDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Graph 2: Strength by Operation */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div className={styles.cardHeader}>
                <h2>
                  <Target size={18} />
                  Operation Strengths
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '250px', justifyContent: 'center' }}>
                {operationsSummary.length > 0 ? (
                  operationsSummary.map((op, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700' }}>
                        <span style={{ textTransform: 'capitalize' }}>{op.operation}</span>
                        <span style={{ fontFamily: 'var(--font-jetbrains)', color: op.accuracy >= 80 ? 'hsl(var(--accent-success))' : 'hsl(var(--accent-primary))' }}>
                          {op.accuracy.toFixed(0)}% accuracy ({op.totalSolved} solved)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'hsl(var(--bg-tertiary))', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${op.accuracy}%`,
                          height: '100%',
                          borderRadius: '4px',
                          backgroundColor: op.accuracy >= 80 ? 'hsl(var(--accent-success))' : 'hsl(var(--accent-primary))',
                          boxShadow: '0 0 10px rgba(139,92,246,0.2)',
                          transition: 'width 0.5s ease-in-out'
                        }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <BookOpen size={24} style={{ opacity: 0.5 }} />
                    <span>No training sessions recorded yet. Start practicing to generate operation breakdown charts.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Sessions list */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div className={styles.cardHeader}>
              <h2>
                <Clock size={18} />
                Recent Workouts
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                Last {recentSessions.length} sessions
              </span>
            </div>
            
            {recentSessions.length > 0 ? (
              <div className={styles.sessionList}>
                {recentSessions.map((session) => {
                  const formattedDate = new Date(session.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const durationMins = parseFloat((session.durationSeconds / 60).toFixed(1));
                  const correctPct = Math.round((session.correctCount / session.totalQuestions) * 100);

                  return (
                    <div key={session.id} className={styles.sessionItem}>
                      <div className={styles.sessionMeta}>
                        <div className={styles.sessionTitle}>{session.operation} session</div>
                        <div className={styles.sessionDate}>{formattedDate}</div>
                      </div>
                      <div className={styles.sessionStats}>
                        <div className={styles.sessionStat}>
                          <span className={styles.sessionStatValue}>{session.totalQuestions}</span>
                          <span className={styles.sessionStatLabel}>Solved</span>
                        </div>
                        <div className={styles.sessionStat}>
                          <span className={`${styles.sessionStatValue} ${correctPct >= 80 ? styles.sessionStatValueSuccess : ''}`}>
                            {correctPct}%
                          </span>
                          <span className={styles.sessionStatLabel}>Accuracy</span>
                        </div>
                        <div className={styles.sessionStat}>
                          <span className={styles.sessionStatValue}>{durationMins}m</span>
                          <span className={styles.sessionStatLabel}>Duration</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
                You haven't completed any sessions yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
