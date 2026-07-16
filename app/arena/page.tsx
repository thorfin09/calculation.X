'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, RotateCcw, Award, CheckCircle, XCircle, Flame, Clock, Volume2, VolumeX, BarChart2, ShieldAlert } from 'lucide-react';
import styles from './arena.module.css';

interface Question {
  text: string;
  correctAnswer: string;
  operation: string;
}

interface Attempt {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  operation: string;
}

function ArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') || 'config'; // 'config' | 'active' | 'results'

  // Arena configuration states
  const [drillMode, setDrillMode] = useState<'workout' | 'sprint' | 'mistakes'>('sprint');
  const [operation, setOperation] = useState<string>('addition');
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [timeLimit, setTimeLimit] = useState<number>(120); // seconds
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active workout states
  const [workoutPhase, setWorkoutPhase] = useState<number>(1); // Phase 1: Warmup, 2: Core, 3: Advanced
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [arenaState, setArenaState] = useState<'config' | 'active' | 'results'>('config');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Time logging details
  const sessionStartTime = useRef<number>(0);
  const questionStartTime = useRef<number>(0);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load user settings on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('authStatusChanged', handleAuthChange);

    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    fetch('/api/settings', {
      headers: {
        'x-user-username': currentUser
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.soundEnabled !== undefined) {
          setSoundEnabled(data.soundEnabled);
        }
      })
      .catch(e => console.error('Failed to load settings in arena', e));

    const modeParam = searchParams.get('mode');
    if (modeParam === 'mistakes') {
      setDrillMode('mistakes');
      loadMistakesWorkout();
    }

    return () => {
      window.removeEventListener('authStatusChanged', handleAuthChange);
    };
  }, [searchParams]);

  // Audio tone synthesizer for professional audio cues
  const playTone = (freqs: number[], duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      let time = ctx.currentTime;
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
        time += duration * 0.7; // slight overlap
      });
    } catch (e) {
      console.error(e);
    }
  };

  const playSuccessTone = () => playTone([880, 1100], 0.15);
  const playErrorTone = () => playTone([220, 180], 0.25, 'sawtooth');

  // Math drills generator helper
  const generateQuestion = (op: string, diff: string, phase?: number): Question => {
    let num1 = 0;
    let num2 = 0;
    let text = '';
    let correctAnswer = '';
    let chosenOp = op;

    // Daily structured workout forces operation by phase
    if (drillMode === 'workout' && phase) {
      if (phase === 1) {
        // Phase 1: Warmup - 1-digit addition/subtraction, multiplication tables 2-10
        const warmupOps = ['addition', 'subtraction', 'multiplication'];
        chosenOp = warmupOps[Math.floor(Math.random() * warmupOps.length)] || 'addition';
        diff = 'easy';
      } else if (phase === 2) {
        // Phase 2: Core - 2-digit add/sub, division tables, 2x1 multiplication
        const coreOps = ['addition', 'subtraction', 'multiplication', 'division'];
        chosenOp = coreOps[Math.floor(Math.random() * coreOps.length)] || 'addition';
        diff = 'medium';
      } else {
        // Phase 3: Advanced - Squares, cubes, fraction-to-percent conversions
        const advOps = ['squares', 'cubes', 'fractions'];
        chosenOp = advOps[Math.floor(Math.random() * advOps.length)] || 'squares';
        diff = 'hard';
      }
    }

    if (chosenOp === 'mixed') {
      const ops = ['addition', 'subtraction', 'multiplication', 'division'];
      chosenOp = ops[Math.floor(Math.random() * ops.length)] || 'addition';
    }

    switch (chosenOp) {
      case 'addition':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 9) + 1; // 1-9
          num2 = Math.floor(Math.random() * 9) + 1;
        } else if (diff === 'medium') {
          num1 = Math.floor(Math.random() * 89) + 10; // 10-99
          num2 = Math.floor(Math.random() * 89) + 10;
        } else {
          num1 = Math.floor(Math.random() * 899) + 100; // 100-999
          num2 = Math.floor(Math.random() * 899) + 100;
        }
        text = `${num1} + ${num2}`;
        correctAnswer = (num1 + num2).toString();
        break;

      case 'subtraction':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 9) + 1;
          num2 = Math.floor(Math.random() * num1) + 1; // keep positive results
        } else if (diff === 'medium') {
          num1 = Math.floor(Math.random() * 89) + 10;
          num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
        } else {
          num1 = Math.floor(Math.random() * 899) + 100;
          num2 = Math.floor(Math.random() * (num1 - 100)) + 100;
        }
        text = `${num1} - ${num2}`;
        correctAnswer = (num1 - num2).toString();
        break;

      case 'multiplication':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 11) + 2; // 2-12
          num2 = Math.floor(Math.random() * 11) + 2;
        } else if (diff === 'medium') {
          num1 = Math.floor(Math.random() * 89) + 11; // 11-99
          num2 = Math.floor(Math.random() * 8) + 2;   // 2-9 (2x1)
        } else {
          num1 = Math.floor(Math.random() * 40) + 11;  // 11-50
          num2 = Math.floor(Math.random() * 40) + 11;  // 11-50 (2x2)
        }
        text = `${num1} × ${num2}`;
        correctAnswer = (num1 * num2).toString();
        break;

      case 'division':
        if (diff === 'easy') {
          num2 = Math.floor(Math.random() * 10) + 2; // divisor 2-11
          const quotient = Math.floor(Math.random() * 10) + 2;
          num1 = num2 * quotient; // perfect divisor
        } else if (diff === 'medium') {
          num2 = Math.floor(Math.random() * 8) + 2;  // 2-9
          const quotient = Math.floor(Math.random() * 89) + 11; // 11-99
          num1 = num2 * quotient;
        } else {
          num2 = Math.floor(Math.random() * 40) + 11; // 11-50
          const quotient = Math.floor(Math.random() * 40) + 11; // 11-50
          num1 = num2 * quotient;
        }
        text = `${num1} ÷ ${num2}`;
        correctAnswer = (num1 / num2).toString();
        break;

      case 'squares':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 19) + 2; // 2-20
        } else if (diff === 'medium') {
          num1 = Math.floor(Math.random() * 30) + 21; // 21-50
        } else {
          num1 = Math.floor(Math.random() * 50) + 51; // 51-100
        }
        text = `${num1}²`;
        correctAnswer = (num1 * num1).toString();
        break;

      case 'cubes':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 9) + 2; // 2-10
        } else if (diff === 'medium') {
          num1 = Math.floor(Math.random() * 10) + 11; // 11-20
        } else {
          num1 = Math.floor(Math.random() * 10) + 21; // 21-30
        }
        text = `${num1}³`;
        correctAnswer = (num1 * num1 * num1).toString();
        break;

      case 'fractions':
        // Commonly asked percentage equivalent fractions (e.g. 1/8 = 12.5%, 3/8 = 37.5%, etc.)
        const fractionList = [
          { q: '1/2', a: '50' },
          { q: '1/3', a: '33.3' },
          { q: '2/3', a: '66.7' },
          { q: '1/4', a: '25' },
          { q: '3/4', a: '75' },
          { q: '1/5', a: '20' },
          { q: '2/5', a: '40' },
          { q: '3/5', a: '60' },
          { q: '4/5', a: '80' },
          { q: '1/6', a: '16.7' },
          { q: '5/6', a: '83.3' },
          { q: '1/8', a: '12.5' },
          { q: '3/8', a: '37.5' },
          { q: '5/8', a: '62.5' },
          { q: '7/8', a: '87.5' },
          { q: '1/9', a: '11.1' },
          { q: '1/11', a: '9.1' },
          { q: '1/12', a: '8.3' }
        ];
        
        const selection = fractionList[Math.floor(Math.random() * fractionList.length)] || { q: '1/2', a: '50' };
        text = `${selection.q} to %`;
        correctAnswer = selection.a;
        break;

      default:
        text = '2 + 2';
        correctAnswer = '4';
    }

    return { text, correctAnswer, operation: chosenOp };
  };

  const [mistakesList, setMistakesList] = useState<any[]>([]);
  const loadMistakesWorkout = async () => {
    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    try {
      const res = await fetch('/api/mistakes', {
        headers: {
          'x-user-username': currentUser
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMistakesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateMistakeQuestion = (): Question | null => {
    if (mistakesList.length === 0) return null;
    const index = Math.floor(Math.random() * mistakesList.length);
    const m = mistakesList[index];
    return {
      text: m.questionText,
      correctAnswer: m.correctAnswer,
      operation: m.operation
    };
  };

  // Launch training sessions
  const startWorkout = () => {
    setAttempts([]);
    setCorrectCount(0);
    setSolvedCount(0);
    setStreak(0);
    setMaxStreak(0);
    setUserAnswer('');
    setFeedback('none');

    sessionStartTime.current = Date.now();
    questionStartTime.current = Date.now();

    if (drillMode === 'workout') {
      // Phase 1 of 10 minute workout (Warmup = 2 mins = 120s)
      setWorkoutPhase(1);
      setSecondsLeft(120);
      setCurrentQuestion(generateQuestion('addition', 'easy', 1));
    } else if (drillMode === 'mistakes') {
      if (mistakesList.length === 0) {
        alert("You have no logged mistakes! Complete standard sessions to log errors.");
        return;
      }
      setSecondsLeft(300); // 5 mins mistakes practice
      const q = generateMistakeQuestion();
      if (q) setCurrentQuestion(q);
    } else {
      // Custom sprint
      setSecondsLeft(timeLimit);
      setCurrentQuestion(generateQuestion(operation, difficulty));
    }

    setArenaState('active');

    // Focus input on render
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Setup visual timer
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          
          // In daily workout mode, time transition handles phase changes
          if (drillMode === 'workout') {
            handleWorkoutPhaseTransition();
            return 0;
          } else {
            handleSessionComplete();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Structured Workout Phase transitions
  const handleWorkoutPhaseTransition = () => {
    setWorkoutPhase((prevPhase) => {
      const nextPhase = prevPhase + 1;
      if (nextPhase <= 3) {
        // Prepare next phase
        const phaseDuration = nextPhase === 2 ? 240 : 240; // Phase 2: 4 mins (240s), Phase 3: 4 mins (240s)
        setSecondsLeft(phaseDuration);
        setCurrentQuestion(generateQuestion('', '', nextPhase));
        
        // Re-establish clock interval
        timerInterval.current = setInterval(() => {
          setSecondsLeft((p) => {
            if (p <= 1) {
              clearInterval(timerInterval.current!);
              handleWorkoutPhaseTransition();
              return 0;
            }
            return p - 1;
          });
        }, 1000);
        
        return nextPhase;
      } else {
        // Complete the 10-minute workout!
        handleSessionComplete();
        return 3;
      }
    });
  };

  // Handle text input changes (enables instant auto-submit for correct answers)
  const handleInputChange = (val: string) => {
    setUserAnswer(val);

    if (currentQuestion && val.trim() === currentQuestion.correctAnswer) {
      // Auto submit correct answer instantly!
      const isCorrect = true;
      
      const newAttempt: Attempt = {
        questionText: currentQuestion.text,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: val.trim(),
        isCorrect,
        operation: currentQuestion.operation
      };

      setAttempts((prev) => [...prev, newAttempt]);
      setSolvedCount((p) => p + 1);
      setCorrectCount((p) => p + 1);
      setStreak((p) => {
        const next = p + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setFeedback('correct');
      playSuccessTone();

      // Clear mistake from database if practicing in mistakes mode
      if (drillMode === 'mistakes') {
        const currentMistakeId = mistakesList.find(m => m.questionText === currentQuestion.text)?.id;
        if (currentMistakeId) {
          const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
          fetch(`/api/mistakes?id=${currentMistakeId}`, {
            method: 'DELETE',
            headers: {
              'x-user-username': currentUser
            }
          })
            .then(() => {
              setMistakesList(prev => prev.filter(m => m.id !== currentMistakeId));
            })
            .catch(err => console.error('Failed to auto-delete corrected mistake', err));
        }
      }

      setTimeout(() => {
        setFeedback('none');
        setUserAnswer('');
        
        if (drillMode === 'mistakes') {
          const updatedMistakesList = mistakesList.filter(m => m.questionText !== currentQuestion.text);
          if (updatedMistakesList.length > 0) {
            const index = Math.floor(Math.random() * updatedMistakesList.length);
            const m = updatedMistakesList[index];
            if (m) {
              setCurrentQuestion({
                text: m.questionText,
                correctAnswer: m.correctAnswer,
                operation: m.operation
              });
            }
          } else {
            handleSessionComplete();
          }
        } else {
          setCurrentQuestion(generateQuestion(operation, difficulty, workoutPhase));
        }
        
        questionStartTime.current = Date.now();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }, 200);
    }
  };

  // Submit Answer validation (used for incorrect submits via Enter key)
  const handleAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || !currentQuestion) return;

    const isCorrect = userAnswer.trim() === currentQuestion.correctAnswer;
    const timeSpentMs = Date.now() - questionStartTime.current;

    // Log attempt details
    const newAttempt: Attempt = {
      questionText: currentQuestion.text,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: userAnswer.trim(),
      isCorrect,
      operation: currentQuestion.operation
    };

    setAttempts((prev) => [...prev, newAttempt]);
    setSolvedCount((p) => p + 1);

    if (isCorrect) {
      setCorrectCount((p) => p + 1);
      setStreak((p) => {
        const next = p + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setFeedback('correct');
      playSuccessTone();

      if (drillMode === 'mistakes') {
        const currentMistakeId = mistakesList.find(m => m.questionText === currentQuestion.text)?.id;
        if (currentMistakeId) {
          const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
          fetch(`/api/mistakes?id=${currentMistakeId}`, {
            method: 'DELETE',
            headers: {
              'x-user-username': currentUser
            }
          })
            .then(() => {
              setMistakesList(prev => prev.filter(m => m.id !== currentMistakeId));
            })
            .catch(err => console.error(err));
        }
      }
    } else {
      setStreak(0);
      setFeedback('incorrect');
      playErrorTone();
    }

    // Prepare next question after a visual flash effect
    setTimeout(() => {
      setFeedback('none');
      setUserAnswer('');
      
      // Load next question
      if (drillMode === 'mistakes') {
        const updatedMistakesList = mistakesList.filter(m => m.questionText !== currentQuestion.text);
        if (updatedMistakesList.length > 0) {
          const index = Math.floor(Math.random() * updatedMistakesList.length);
          const m = updatedMistakesList[index];
          if (m) {
            setCurrentQuestion({
              text: m.questionText,
              correctAnswer: m.correctAnswer,
              operation: m.operation
            });
          }
        } else {
          handleSessionComplete();
        }
      } else {
        setCurrentQuestion(generateQuestion(operation, difficulty, workoutPhase));
      }
      
      questionStartTime.current = Date.now();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, 250);
  };

  // On session timeout or completion
  const handleSessionComplete = async () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setArenaState('results');

    const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
    const avgTimePerQuestionMs = attempts.length > 0
      ? Math.round((durationSeconds * 1000) / attempts.length)
      : 0;

    // Identify mistakes to send to the backend
    const mistakesToLog = attempts
      .filter((a) => !a.isCorrect)
      .map((a) => ({
        questionText: a.questionText,
        correctAnswer: a.correctAnswer,
        userAnswer: a.userAnswer,
        operation: a.operation
      }));

    // Skip saving logs if in guest mode
    if (!isLoggedIn) {
      console.log('Workout complete (Guest mode) - logs not saved.');
      return;
    }

    // Post workout results to database
    try {
      const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
      const localDate = new Date().toLocaleDateString('sv-SE'); // sv-SE outputs YYYY-MM-DD
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-username': currentUser
        },
        body: JSON.stringify({
          durationSeconds,
          operation: drillMode === 'workout' ? 'mix' : operation,
          correctCount,
          totalQuestions: solvedCount,
          averageTimePerQuestionMs: avgTimePerQuestionMs,
          mistakes: mistakesToLog,
          localDate
        })
      });

      if (res.ok) {
        // Dispatch local event to inform Navigation/Dashboard component to update statistics
        window.dispatchEvent(new Event('sessionCompleted'));
      }
    } catch (e) {
      console.error('Failed to save session logs', e);
    }
  };

  // Virtual Keypad click helpers
  const handleKeypadPress = (key: string) => {
    let nextVal = userAnswer;
    if (key === 'CLEAR') {
      nextVal = '';
    } else if (key === 'BACK') {
      nextVal = userAnswer.slice(0, -1);
    } else if (key === 'SUBMIT') {
      handleAnswerSubmit();
      return;
    } else {
      nextVal = userAnswer + key;
    }
    handleInputChange(nextVal);
    inputRef.current?.focus();
  };

  // Render Time string
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container + ' animate-fade'}>
      <h1 className={styles.title}>Calculation Arena</h1>
      <p className={styles.subtitle}>Supercharge your processing speed and numerical accuracy</p>

      {/* STATE 1: Config & Setup */}
      {arenaState === 'config' && (
        <div className="glass-card + styles.configCard">
          <h2 className={styles.sectionTitle}>Choose Your Workout</h2>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '16px' }}>
            <button
              onClick={() => setDrillMode('sprint')}
              className={drillMode === 'sprint' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              Custom Sprint
            </button>
            <button
              onClick={() => {
                setDrillMode('workout');
                // Auto-configure to 10 minutes total
                setTimeLimit(600);
              }}
              className={drillMode === 'workout' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              Daily 10-Min Routine
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  alert('Sign in to practice saved mistakes!');
                  return;
                }
                setDrillMode('mistakes');
                loadMistakesWorkout();
              }}
              className={drillMode === 'mistakes' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ opacity: isLoggedIn ? 1 : 0.5 }}
              title={isLoggedIn ? 'Practice saved mistakes' : 'Requires Sign In'}
            >
              Mistakes Trainer {isLoggedIn ? `(${mistakesList.length})` : '(Lock)'}
            </button>
          </div>

          {drillMode === 'sprint' && (
            <div className={styles.grid}>
              <div className={styles.optGroup}>
                <label className={styles.optLabel}>Select Operation</label>
                <div className={styles.operationsGrid}>
                  {[
                    { id: 'addition', val: '+' },
                    { id: 'subtraction', val: '-' },
                    { id: 'multiplication', val: '×' },
                    { id: 'division', val: '÷' },
                    { id: 'squares', val: 'x²' },
                    { id: 'cubes', val: 'x³' },
                    { id: 'fractions', val: '%' },
                    { id: 'mixed', val: 'Mix' }
                  ].map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setOperation(op.id)}
                      className={operation === op.id ? `${styles.opButton} ${styles.opButtonActive}` : styles.opButton}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{op.val}</span>
                      <span style={{ fontSize: '0.65rem', textTransform: 'capitalize', fontWeight: '500' }}>{op.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={styles.optGroup}>
                  <label className={styles.optLabel}>Difficulty Level</label>
                  <select
                    className={styles.select}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy (Warmup / single-digit)</option>
                    <option value="medium">Medium (Moderate / 2-digit)</option>
                    <option value="hard">Hard (Advanced / 3-digit)</option>
                  </select>
                </div>

                <div className={styles.optGroup}>
                  <label className={styles.optLabel}>Sprint Time Limit</label>
                  <select
                    className={styles.select}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                  >
                    <option value={60}>1 Minute Speedrun</option>
                    <option value={120}>2 Minutes (Standard)</option>
                    <option value={300}>5 Minutes Endurance</option>
                    <option value={600}>10 Minutes Marathon</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {drillMode === 'workout' && (
            <div style={{ margin: '20px 0 32px 0', color: 'hsl(var(--text-secondary))', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '12px' }}>
                The **Daily 10-Minute Routine** is a structured path optimized for maximum math retention and neuron activation:
              </p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <li>🔥 **Phase 1 (2 mins)**: Arithmetic Warmup (Single-digit basics to focus focus)</li>
                <li>⚡ **Phase 2 (4 mins)**: Double-digit Core speed run (Endurance and accuracy)</li>
                <li>🧬 **Phase 3 (4 mins)**: Roots, percentage equivalents, and Vedic math applications</li>
              </ul>
            </div>
          )}

          {drillMode === 'mistakes' && (
            <div style={{ margin: '20px 0 32px 0', color: 'hsl(var(--text-secondary))', lineHeight: '1.6' }}>
              {mistakesList.length > 0 ? (
                <p>
                  You will practice the **{mistakesList.length} unique math mistakes** saved in your profile. Answering correctly will remove them from the error log!
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--accent-warning))' }}>
                  <ShieldAlert size={20} />
                  <span>No mistakes logged. Train in Custom or Daily mode first.</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>Sound {soundEnabled ? 'On' : 'Off'}</span>
            </button>

            <button
              onClick={startWorkout}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '1.1rem', fontWeight: '800', boxShadow: 'var(--glow-effect)' }}
              disabled={drillMode === 'mistakes' && mistakesList.length === 0}
            >
              Start Workout
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: Workout Arena Panel */}
      {arenaState === 'active' && currentQuestion && (
        <div className={`glass-card ${styles.arenaCard}`}>
          {/* Header info */}
          <div className={styles.arenaHeader}>
            <div className={styles.progressInfo}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {drillMode === 'workout' ? `Daily Workout (Phase ${workoutPhase}/3)` : `${drillMode} training`}
              </span>
              <div className={`${styles.timer} ${secondsLeft <= 15 ? styles.timerAlert : ''}`}>
                <Clock size={20} />
                <span>{formatTime(secondsLeft)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '600' }}>
                <span>Solved: {solvedCount}</span>
                <span>Accuracy: {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 100}%</span>
              </div>

              {streak > 2 && (
                <div className={styles.streakFire}>
                  <Flame size={16} fill="hsl(var(--accent-warning))" />
                  <span>{streak} Streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Core Arena Interface */}
          <div className={styles.questionBox}>
            <div className={`${styles.equation} ${feedback === 'correct' ? styles.correctFeedback : feedback === 'incorrect' ? styles.incorrectFeedback : ''}`}>
              {currentQuestion.text} =
            </div>

            <form onSubmit={handleAnswerSubmit} className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
                className={`${styles.answerInput} ${feedback === 'correct' ? styles.answerInputCorrect : feedback === 'incorrect' ? styles.answerInputIncorrect : ''}`}
                value={userAnswer}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="?"
                autoFocus
                autoComplete="off"
              />
            </form>
          </div>

          {/* Virtual keypads for quick typing */}
          <div className={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '.'].map((k) => (
              <button key={k} onClick={() => handleKeypadPress(k)} className={styles.key}>
                {k}
              </button>
            ))}
            <button onClick={() => handleKeypadPress('CLEAR')} className={`${styles.key} ${styles.keySpecial}`} style={{ fontSize: '0.85rem' }}>
              C
            </button>
            <button onClick={() => handleKeypadPress('BACK')} className={`${styles.key} ${styles.keySpecial}`} style={{ fontSize: '0.85rem' }}>
              ⌫
            </button>
            <button onClick={() => handleKeypadPress('SUBMIT')} className={`${styles.key} ${styles.keySpecial}`} style={{ backgroundColor: 'hsl(var(--accent-primary))', color: '#0b0f17' }}>
              ⏎
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: Session Results wrap-up */}
      {arenaState === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card + styles.resultsBox">
            <div className={styles.resultsIcon}>
              <Award size={64} />
            </div>
            <h2 className={styles.resultsTitle}>Workout Complete!</h2>
            <p className={styles.resultsMessage}>
              {isLoggedIn
                ? "Awesome job! Your practice session has been registered. Regular training locks in these numerical paths in your brain."
                : "Guest Mode: Workout complete! Practice drills are fully open, but sessions aren't logged. Sign in to save streaks, operational charts, and mistake history."
              }
            </p>

            <div className={styles.resultsGrid}>
              <div className={styles.resultItem}>
                <div className={styles.resultValue}>{correctCount} / {solvedCount}</div>
                <div className={styles.resultLabel}>Correct</div>
              </div>
              <div className={styles.resultItem}>
                <div className={styles.resultValue} style={{ color: 'hsl(var(--accent-success))' }}>
                  {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0}%
                </div>
                <div className={styles.resultLabel}>Accuracy</div>
              </div>
              <div className={styles.resultItem}>
                <div className={styles.resultValue} style={{ color: 'hsl(var(--accent-warning))' }}>
                  {maxStreak} 🔥
                </div>
                <div className={styles.resultLabel}>Max Streak</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setArenaState('config')} className="btn btn-secondary">
                <RotateCcw size={16} />
                Configure New Drill
              </button>
              <button onClick={startWorkout} className="btn btn-primary">
                Repeat Workout
              </button>
            </div>
          </div>

          {/* Session mistakes list summary */}
          {attempts.filter((a) => !a.isCorrect).length > 0 && (
            <div className="glass-card + styles.mistakesTableCard">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--accent-error))' }}>
                Isolating Mistakes ({attempts.filter((a) => !a.isCorrect).length})
              </h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '16px' }}>
                {isLoggedIn
                  ? "These questions have been registered in your profile. You can practice them directly using the \"Mistakes Trainer\" mode on the setup screen."
                  : "These questions were answered incorrectly. In Logged-in mode, they are automatically logged in your Mistakes Trainer for targeted review."
                }
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {attempts
                  .filter((a) => !a.isCorrect)
                  .map((attempt, index) => (
                    <div key={index} className={styles.mistakeRow}>
                      <span className={styles.mistakeQuestion}>{attempt.questionText} = ?</span>
                      <div className={styles.mistakeAnswers}>
                        <span className={styles.mistakeUser}>Your answer: {attempt.userAnswer}</span>
                        <span className={styles.mistakeCorrect}>Correct: {attempt.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Arena() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
        Loading calculation Arena...
      </div>
    }>
      <ArenaContent />
    </Suspense>
  );
}
