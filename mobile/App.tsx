import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
  Switch,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import {
  BarChart2,
  Award,
  BookOpen,
  Settings as SettingsIcon,
  Flame,
  Moon,
  Sun,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  User,
  Key,
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Check
} from 'lucide-react-native';
import { API } from './lib/api';

const { width } = Dimensions.get('window');

// Operations and difficulty presets
const OPERATIONS = [
  { id: 'addition', val: '+' },
  { id: 'subtraction', val: '-' },
  { id: 'multiplication', val: '×' },
  { id: 'division', val: '÷' },
  { id: 'squares', val: 'x²' },
  { id: 'cubes', val: 'x³' },
  { id: 'fractions', val: '%' },
  { id: 'mixed', val: 'Mix' }
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arena' | 'tricks' | 'settings'>('dashboard');
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('Guest');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  
  // Form states
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Dashboard states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Settings states
  const [settingsName, setSettingsName] = useState<string>('');
  const [settingsGoal, setSettingsGoal] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Arena setup states
  const [drillMode, setDrillMode] = useState<'sprint' | 'workout' | 'mistakes'>('sprint');
  const [chosenOp, setChosenOp] = useState<string>('addition');
  const [chosenDiff, setChosenDiff] = useState<string>('easy');
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [mistakesList, setMistakesList] = useState<any[]>([]);

  // Active workout states
  const [arenaState, setArenaState] = useState<'config' | 'active' | 'results'>('config');
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [attempts, setAttempts] = useState<any[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [workoutPhase, setWorkoutPhase] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');

  // References
  const sessionStartTime = useRef<number>(0);
  const questionStartTime = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Load auth on mount
  useEffect(() => {
    // Check if user credentials exist in local storage mock (React Native has AsyncStorage,
    // but for simplicity we will simulate session caching or default to Guest).
    fetchStats();
  }, [isLoggedIn]);

  const fetchStats = async () => {
    if (!isLoggedIn) {
      setDashboardStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const data = await API.getDashboardStats(username);
      setDashboardStats(data);
      setSettingsName(data.user?.name || username);
      setSettingsGoal(data.user?.dailyGoalMinutes || 10);
      setSoundEnabled(data.user?.soundEnabled !== false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogin = async () => {
    if (!loginInput.trim() || !loginPassword) return;
    setAuthError('');
    try {
      const res = await API.login(loginInput.trim(), loginPassword);
      if (res.success && res.username) {
        setUsername(res.username);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginInput('');
        setLoginPassword('');
      } else {
        setAuthError(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed.');
    }
  };

  const handleSignup = async () => {
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword) return;
    setAuthError('');
    try {
      const res = await API.signup(
        signupUsername.trim(),
        signupEmail.trim(),
        signupPhone.trim(),
        signupPassword
      );
      if (res.success) {
        setAuthSuccess('Account created! Logging in...');
        setLoginInput(signupUsername.trim());
        setSignupUsername('');
        setSignupEmail('');
        setSignupPhone('');
        setSignupPassword('');
        setTimeout(() => {
          setAuthTab('signin');
          setAuthSuccess('');
        }, 1200);
      } else {
        setAuthError(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            setIsLoggedIn(false);
            setUsername('Guest');
            setDashboardStats(null);
            setActiveTab('dashboard');
          }
        }
      ]
    );
  };

  // Generation logic (Vedic calculation generator matching web)
  const generateQuestion = (op: string, diff: string, phase: number = 1) => {
    let text = '';
    let correctAnswer = '';
    let chosenOp = op;

    if (op === 'mixed') {
      const list = ['addition', 'subtraction', 'multiplication', 'division'];
      chosenOp = list[Math.floor(Math.random() * list.length)] || 'addition';
    } else if (op === 'mix') {
      // Workout phases logic
      if (phase === 1) chosenOp = Math.random() > 0.5 ? 'addition' : 'subtraction';
      else if (phase === 2) chosenOp = Math.random() > 0.7 ? 'addition' : 'multiplication';
      else chosenOp = Math.random() > 0.5 ? 'squares' : 'fractions';
    }

    let num1 = 1, num2 = 1;

    switch (chosenOp) {
      case 'addition':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 89) + 10;
          num2 = Math.floor(Math.random() * 89) + 10;
        } else {
          num1 = Math.floor(Math.random() * 899) + 100;
          num2 = Math.floor(Math.random() * 899) + 100;
        }
        text = `${num1} + ${num2}`;
        correctAnswer = String(num1 + num2);
        break;

      case 'subtraction':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 89) + 10;
          num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
        } else {
          num1 = Math.floor(Math.random() * 899) + 100;
          num2 = Math.floor(Math.random() * (num1 - 100)) + 100;
        }
        text = `${num1} - ${num2}`;
        correctAnswer = String(num1 - num2);
        break;

      case 'multiplication':
        if (diff === 'easy') {
          num1 = Math.floor(Math.random() * 17) + 3;
          num2 = Math.floor(Math.random() * 8) + 2;
        } else {
          num1 = Math.floor(Math.random() * 89) + 11;
          num2 = Math.floor(Math.random() * 8) + 2;
        }
        text = `${num1} × ${num2}`;
        correctAnswer = String(num1 * num2);
        break;

      case 'division':
        if (diff === 'easy') {
          num2 = Math.floor(Math.random() * 8) + 2;
          const quot = Math.floor(Math.random() * 12) + 2;
          num1 = num2 * quot;
        } else {
          num2 = Math.floor(Math.random() * 15) + 3;
          const quot = Math.floor(Math.random() * 30) + 5;
          num1 = num2 * quot;
        }
        text = `${num1} ÷ ${num2}`;
        correctAnswer = String(num1 / num2);
        break;

      case 'squares':
        num1 = diff === 'easy' ? Math.floor(Math.random() * 20) + 11 : Math.floor(Math.random() * 70) + 30;
        text = `${num1}²`;
        correctAnswer = String(num1 * num1);
        break;

      case 'cubes':
        num1 = diff === 'easy' ? Math.floor(Math.random() * 10) + 2 : Math.floor(Math.random() * 15) + 11;
        text = `${num1}³`;
        correctAnswer = String(num1 * num1 * num1);
        break;

      case 'fractions':
        const fractionList = [
          { q: '1/2', a: '50' },
          { q: '1/3', a: '33.3' },
          { q: '2/3', a: '66.6' },
          { q: '1/4', a: '25' },
          { q: '3/4', a: '75' },
          { q: '1/5', a: '20' },
          { q: '1/6', a: '16.6' },
          { q: '5/6', a: '83.3' },
          { q: '1/8', a: '12.5' },
          { q: '3/8', a: '37.5' },
          { q: '5/8', a: '62.5' }
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

  // Workout initiation
  const startWorkout = async () => {
    setAttempts([]);
    setSolvedCount(0);
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setFeedback('none');
    setUserAnswer('');
    
    if (drillMode === 'workout') {
      setTimeLimit(600); // 10 minutes
      setSecondsLeft(600);
      setWorkoutPhase(1);
      setCurrentQuestion(generateQuestion('mix', chosenDiff, 1));
    } else if (drillMode === 'mistakes') {
      try {
        const data = await API.getMistakes(username);
        if (data.length === 0) {
          Alert.alert('Perfect Profile', 'No calculation mistakes logged to review!');
          return;
        }
        setMistakesList(data);
        setCurrentQuestion({
          text: data[0].questionText,
          correctAnswer: data[0].correctAnswer,
          operation: data[0].operation
        });
        setTimeLimit(120);
        setSecondsLeft(120);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSecondsLeft(timeLimit);
      setCurrentQuestion(generateQuestion(chosenOp, chosenDiff));
    }

    setArenaState('active');
    sessionStartTime.current = Date.now();
    questionStartTime.current = Date.now();

    // Start timer interval
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Real-time input change checks (auto-submit correct answers)
  const handleInputChange = (val: string) => {
    setUserAnswer(val);

    if (!currentQuestion) return;

    // Checks matching
    if (val.trim() === currentQuestion.correctAnswer) {
      const isCorrect = true;
      const newAttempt = {
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

      // Vibration indicator
      Vibration.vibrate(30);

      // Auto delete if mistake practice mode
      if (drillMode === 'mistakes') {
        const currentMistake = mistakesList[0];
        if (currentMistake) {
          API.removeMistake(username, currentMistake.id).catch(console.error);
          setMistakesList(prev => prev.slice(1));
        }
      }

      // Transition after visual delays
      setTimeout(() => {
        setFeedback('none');
        setUserAnswer('');

        if (drillMode === 'workout') {
          // Adjust phase based on time
          const elapsed = 600 - secondsLeft;
          let phase = 1;
          if (elapsed > 360) phase = 3;
          else if (elapsed > 120) phase = 2;
          setWorkoutPhase(phase);
          setCurrentQuestion(generateQuestion('mix', chosenDiff, phase));
        } else if (drillMode === 'mistakes') {
          if (mistakesList.length > 1) {
            setCurrentQuestion({
              text: mistakesList[1].questionText,
              correctAnswer: mistakesList[1].correctAnswer,
              operation: mistakesList[1].operation
            });
          } else {
            handleSessionComplete();
          }
        } else {
          setCurrentQuestion(generateQuestion(chosenOp, chosenDiff));
        }
        questionStartTime.current = Date.now();
      }, 220);
    }
  };

  // Trigger manual submit/incorrect entry
  const handleManualSubmit = () => {
    if (!userAnswer.trim() || !currentQuestion) return;
    
    const isCorrect = userAnswer.trim() === currentQuestion.correctAnswer;
    const newAttempt = {
      questionText: currentQuestion.text,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: userAnswer.trim(),
      isCorrect,
      operation: currentQuestion.operation
    };

    setAttempts((prev) => [...prev, newAttempt]);
    setSolvedCount((p) => p + 1);

    if (isCorrect) {
      // (This block is redundant due to change check, but kept as safety fallback)
      setCorrectCount((p) => p + 1);
      setStreak((p) => {
        const next = p + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setFeedback('correct');
      Vibration.vibrate(30);
    } else {
      setStreak(0);
      setFeedback('incorrect');
      // Vibrate longer on incorrect input
      Vibration.vibrate([0, 80, 50, 80]);
    }

    setTimeout(() => {
      setFeedback('none');
      setUserAnswer('');
      if (drillMode === 'workout') {
        setCurrentQuestion(generateQuestion('mix', chosenDiff, workoutPhase));
      } else if (drillMode === 'mistakes') {
        if (mistakesList.length > 1) {
          setMistakesList(prev => prev.slice(1));
          setCurrentQuestion({
            text: mistakesList[1].questionText,
            correctAnswer: mistakesList[1].correctAnswer,
            operation: mistakesList[1].operation
          });
        } else {
          handleSessionComplete();
        }
      } else {
        setCurrentQuestion(generateQuestion(chosenOp, chosenDiff));
      }
      questionStartTime.current = Date.now();
    }, 250);
  };

  const handleSessionComplete = async () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setArenaState('results');

    const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
    const avgTimePerQuestionMs = attempts.length > 0
      ? Math.round((durationSeconds * 1000) / attempts.length)
      : 0;

    const mistakesToLog = attempts
      .filter((a) => !a.isCorrect)
      .map((a) => ({
        questionText: a.questionText,
        correctAnswer: a.correctAnswer,
        userAnswer: a.userAnswer,
        operation: a.operation
      }));

    if (!isLoggedIn) return;

    try {
      await API.addSession(username, {
        durationSeconds,
        operation: drillMode === 'workout' ? 'mix' : chosenOp,
        correctCount,
        totalQuestions: solvedCount,
        averageTimePerQuestionMs: avgTimePerQuestionMs,
        mistakes: mistakesToLog
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeypadPress = (key: string) => {
    if (key === 'C') {
      setUserAnswer('');
    } else if (key === '⌫') {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else if (key === '⏎') {
      handleManualSubmit();
    } else {
      handleInputChange(userAnswer + key);
    }
  };

  // Settings Save
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await API.updateUserSettings(username, {
        name: settingsName,
        dailyGoalMinutes: settingsGoal,
        soundEnabled: soundEnabled
      });
      Alert.alert('Saved', 'Preferences saved successfully.');
      fetchStats();
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearMistakesLog = async () => {
    Alert.alert(
      'Clear mistakes',
      'Are you sure you want to permanently clear your mistake history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await API.clearMistakes(username);
              Alert.alert('Cleared', 'Mistakes history cleared.');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear mistakes.');
            }
          }
        }
      ]
    );
  };

  // Rendering Helper: format countdown timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // SVG Progress circle calculation helper
  const radius = 75;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const percentComplete = dashboardStats ? Math.min(100, Math.round((dashboardStats.minutesToday / dashboardStats.user?.dailyGoalMinutes) * 100)) : 0;
  const strokeDashoffset = circumference * (1 - percentComplete / 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Panel */}
      <View style={styles.header}>
        <Text style={styles.logo}>calculation<Text style={{ color: 'rgb(139, 92, 246)' }}>.X</Text></Text>
        
        <View style={styles.headerWidgets}>
          {isLoggedIn && dashboardStats && (
            <View style={[styles.badge, styles.streakBadge]}>
              <Flame size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.streakText}>{dashboardStats.currentStreak}d</Text>
            </View>
          )}

          {isLoggedIn ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color="#ef4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signInBtn} onPress={() => setShowLoginModal(true)}>
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Tab Render Block */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <View style={styles.tabContent}>
            {/* Header welcome banner */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>Welcome, {isLoggedIn ? username : 'Guest'}</Text>
              <Text style={styles.welcomeSub}>
                {isLoggedIn 
                  ? 'Ready to sharpen your numerical speed today?'
                  : 'Practice math drills fully open! Sign in to save statistics, tracking, and streaks.'
                }
              </Text>
            </View>

            {/* Dashboard Panels */}
            <View style={{ position: 'relative' }}>
              {!isLoggedIn && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockedCard}>
                    <Key size={32} color="rgb(139, 92, 246)" style={{ marginBottom: 12 }} />
                    <Text style={styles.lockedTitle}>Track Progress & Analytics</Text>
                    <Text style={styles.lockedDesc}>
                      Sign in to accumulate streaks, analyze operation strengths, and log calculation errors.
                    </Text>
                    <TouchableOpacity style={styles.lockedBtn} onPress={() => setShowLoginModal(true)}>
                      <Text style={styles.lockedBtnText}>Sign In / Join Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ opacity: isLoggedIn ? 1 : 0.45 }}>
                {/* SVG Progress Ring Card */}
                <View style={styles.card}>
                  <View style={styles.progressRow}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text style={styles.progressCardTitle}>10-Minute Focus Ring</Text>
                      <Text style={styles.progressCardDesc}>
                        Practice 10 minutes of calculations daily to maintain your quantitative streak!
                      </Text>
                      {dashboardStats && (
                        <Text style={styles.progressRemaining}>
                          Today: {dashboardStats.minutesToday}m / {dashboardStats.user?.dailyGoalMinutes}m
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.ringContainer}>
                      <Svg width="160" height="160" style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle
                          cx="80"
                          cy="80"
                          r={radius}
                          stroke="#1f1f2e"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        <Circle
                          cx="80"
                          cy="80"
                          r={radius}
                          stroke="rgb(139, 92, 246)"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </Svg>
                      <View style={styles.ringTextContainer}>
                        <Text style={styles.ringPercentText}>{percentComplete}%</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Dashboard Stats Metrics Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statMiniCard}>
                    <Target size={20} color="rgb(139, 92, 246)" />
                    <Text style={styles.statValText}>{dashboardStats?.averageAccuracy || 0}%</Text>
                    <Text style={styles.statLabelText}>Accuracy</Text>
                  </View>
                  <View style={styles.statMiniCard}>
                    <Zap size={20} color="rgb(139, 92, 246)" />
                    <Text style={styles.statValText}>{dashboardStats?.averageSpeed || 0} Q/m</Text>
                    <Text style={styles.statLabelText}>Speed</Text>
                  </View>
                  <View style={styles.statMiniCard}>
                    <CheckCircle2 size={20} color="rgb(139, 92, 246)" />
                    <Text style={styles.statValText}>{dashboardStats?.totalCorrect || 0}</Text>
                    <Text style={styles.statLabelText}>Solved</Text>
                  </View>
                  <View style={styles.statMiniCard}>
                    <Clock size={20} color="rgb(139, 92, 246)" />
                    <Text style={styles.statValText}>{dashboardStats?.totalTimeMin || 0}m</Text>
                    <Text style={styles.statLabelText}>Trained</Text>
                  </View>
                </View>

                {/* Streaks active calendar preview */}
                <View style={styles.card}>
                  <Text style={styles.cardSectionTitle}>Recent Workouts</Text>
                  {dashboardStats && dashboardStats.recentSessions?.length > 0 ? (
                    dashboardStats.recentSessions.map((session: any, idx: number) => (
                      <View key={session.id || idx} style={styles.workoutItem}>
                        <View>
                          <Text style={styles.workoutTitle}>{session.operation} session</Text>
                          <Text style={styles.workoutDate}>Solved {session.totalQuestions}</Text>
                        </View>
                        <Text style={styles.workoutAccuracy}>{Math.round((session.correctCount / session.totalQuestions) * 100)}% Acc</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No workout logs stored yet.</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* VIEW 2: ARENA SCREEN */}
        {activeTab === 'arena' && (
          <View style={styles.tabContent}>
            
            {/* Config Screen Setup */}
            {arenaState === 'config' && (
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>Choose Workout Drill</Text>
                
                {/* Mode tabs */}
                <View style={styles.modeTabs}>
                  {['sprint', 'workout', 'mistakes'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => {
                        if (mode === 'mistakes' && !isLoggedIn) {
                          Alert.alert('Sign In Required', 'Login to review saved mistakes.');
                          return;
                        }
                        setDrillMode(mode as any);
                      }}
                      style={[styles.modeTabButton, drillMode === mode && styles.modeTabActive]}
                    >
                      <Text style={[styles.modeTabText, drillMode === mode && styles.modeTabTextActive]}>
                        {mode === 'mistakes' && !isLoggedIn ? 'Mistakes 🔒' : mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {drillMode === 'sprint' && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.fieldLabel}>Select Operation</Text>
                    <View style={styles.operationGrid}>
                      {OPERATIONS.map((op) => (
                        <TouchableOpacity
                          key={op.id}
                          onPress={() => setChosenOp(op.id)}
                          style={[styles.opSelector, chosenOp === op.id && styles.opSelectorActive]}
                        >
                          <Text style={[styles.opSelectorText, chosenOp === op.id && styles.opSelectorTextActive]}>
                            {op.val}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.fieldLabel}>Difficulty</Text>
                    <View style={styles.diffTabs}>
                      {DIFFICULTIES.map((diff) => (
                        <TouchableOpacity
                          key={diff}
                          onPress={() => setChosenDiff(diff)}
                          style={[styles.diffTabButton, chosenDiff === diff && styles.diffTabActive]}
                        >
                          <Text style={[styles.diffTabText, chosenDiff === diff && styles.diffTabTextActive]}>
                            {diff}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {drillMode === 'workout' && (
                  <Text style={styles.descText}>
                    Starts a structured 10-Minute Daily challenge combining single digit warmups, double digit core multiplication, and fractional Vedic roots.
                  </Text>
                )}

                {drillMode === 'mistakes' && (
                  <Text style={styles.descText}>
                    Review logged arithmetic mistakes saved in your profile. Correct answers will isolate and remove them from database.
                  </Text>
                )}

                <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
                  <Text style={styles.startBtnText}>Start Drill</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Arena Active workout state */}
            {arenaState === 'active' && currentQuestion && (
              <View style={[styles.card, styles.arenaActiveCard]}>
                <View style={styles.arenaHeaderRow}>
                  <View>
                    <Text style={styles.arenaSubtitle}>{drillMode} drill</Text>
                    <Text style={[styles.arenaTimer, secondsLeft <= 15 && styles.timerAlert]}>
                      {formatTime(secondsLeft)}
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statsLabel}>Solved: {solvedCount}</Text>
                    <Text style={styles.statsLabel}>
                      Accuracy: {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 100}%
                    </Text>
                  </View>
                </View>

                {/* Equation box display */}
                <View style={styles.equationContainer}>
                  <Text style={[
                    styles.equationText,
                    feedback === 'correct' && styles.textCorrect,
                    feedback === 'incorrect' && styles.textIncorrect
                  ]}>
                    {currentQuestion.text} =
                  </Text>
                  
                  {/* Virtual Input Display Box */}
                  <View style={[
                    styles.inputFieldBox,
                    feedback === 'correct' && styles.fieldCorrect,
                    feedback === 'incorrect' && styles.fieldIncorrect
                  ]}>
                    <Text style={styles.inputFieldText}>{userAnswer || '?'}</Text>
                  </View>
                </View>

                {/* Mobile Customized Virtual Keypad */}
                <View style={styles.keypadContainer}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '.'].map((key) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleKeypadPress(key)}
                      style={styles.keypadKey}
                    >
                      <Text style={styles.keypadKeyText}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => handleKeypadPress('C')} style={[styles.keypadKey, styles.keypadSpecial]}>
                    <Text style={styles.keypadKeyText}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleKeypadPress('⌫')} style={[styles.keypadKey, styles.keypadSpecial]}>
                    <Text style={styles.keypadKeyText}>⌫</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleKeypadPress('⏎')} style={[styles.keypadKey, styles.keypadSubmit]}>
                    <Text style={[styles.keypadKeyText, { color: '#0d0d12' }]}>⏎</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Workout session completed results */}
            {arenaState === 'results' && (
              <View style={styles.card}>
                <CheckCircle2 size={48} color="#10b981" style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={styles.resultsTitle}>Workout Complete!</Text>
                
                <View style={styles.resultsGrid}>
                  <View style={styles.resultCol}>
                    <Text style={styles.resultValue}>{correctCount} / {solvedCount}</Text>
                    <Text style={styles.resultLabel}>Correct</Text>
                  </View>
                  <View style={styles.resultCol}>
                    <Text style={[styles.resultValue, { color: '#10b981' }]}>
                      {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0}%
                    </Text>
                    <Text style={styles.resultLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.resultCol}>
                    <Text style={[styles.resultValue, { color: '#f59e0b' }]}>{maxStreak} 🔥</Text>
                    <Text style={styles.resultLabel}>Streak</Text>
                  </View>
                </View>

                {attempts.filter(a => !a.isCorrect).length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.mistakesHeading}>Mistakes review ({attempts.filter(a => !a.isCorrect).length})</Text>
                    {attempts.filter(a => !a.isCorrect).map((attempt, idx) => (
                      <View key={idx} style={styles.mistakeRow}>
                        <Text style={styles.mistakeQuestion}>{attempt.questionText} = {attempt.correctAnswer}</Text>
                        <Text style={styles.mistakeUserAnswer}>typed: {attempt.userAnswer}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.startBtn} onPress={() => setArenaState('config')}>
                  <Text style={styles.startBtnText}>New Workout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* VIEW 3: TRICKS PREVIEW */}
        {activeTab === 'tricks' && (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.tricksTitle}>Speed Math Shortcuts</Text>
            
            <View style={styles.card}>
              <Text style={styles.trickHeader}>1. Squaring numbers ending in 5</Text>
              <Text style={styles.trickDesc}>
                Multiply the first digit by (first digit + 1), then append 25.
              </Text>
              <Text style={styles.trickExample}>e.g., 65² = 6 × 7 = 42 → 4225</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.trickHeader}>2. Multiplying double digits near 100</Text>
              <Text style={styles.trickDesc}>
                Add the base difference of one number to another, then append the product of the differences.
              </Text>
              <Text style={styles.trickExample}>e.g., 96 × 97 → (96-3) = 93 → append (-4 × -3) 12 = 9312</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.trickHeader}>3. Percentage fraction conversion tables</Text>
              <Text style={styles.trickDesc}>
                Learn key percentages for rapid fraction arithmetic:
              </Text>
              <View style={styles.fractionRow}><Text style={styles.fractionText}>1/3 = 33.3%</Text><Text style={styles.fractionText}>2/3 = 66.6%</Text></View>
              <View style={styles.fractionRow}><Text style={styles.fractionText}>1/6 = 16.6%</Text><Text style={styles.fractionText}>5/6 = 83.3%</Text></View>
              <View style={styles.fractionRow}><Text style={styles.fractionText}>1/8 = 12.5%</Text><Text style={styles.fractionText}>3/8 = 37.5%</Text></View>
            </View>
          </ScrollView>
        )}

        {/* VIEW 4: SETTINGS SCREEN */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Preferences</Text>
              
              <Text style={styles.fieldLabel}>Goal Minutes Daily</Text>
              <View style={styles.goalCounter}>
                <TouchableOpacity onPress={() => setSettingsGoal(p => Math.max(1, p - 1))} style={styles.counterBtn}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{settingsGoal} Minutes</Text>
                <TouchableOpacity onPress={() => setSettingsGoal(p => Math.min(60, p + 1))} style={styles.counterBtn}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingSwitchRow}>
                <View>
                  <Text style={styles.switchLabel}>Audio Tones</Text>
                  <Text style={styles.switchDesc}>Play synthesized double beeps on correct entries.</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#1f1f2e', true: 'rgb(139, 92, 246)' }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={savingSettings || !isLoggedIn}>
                <Text style={styles.saveBtnText}>{savingSettings ? 'Saving...' : 'Save Preferences'}</Text>
              </TouchableOpacity>
            </View>

            {isLoggedIn && (
              <View style={styles.card}>
                <Text style={[styles.cardHeaderTitle, { color: '#ef4444' }]}>System Actions</Text>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleClearMistakesLog}>
                  <Text style={styles.dangerBtnText}>Reset Mistakes Log</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
          { id: 'arena', label: 'Arena', icon: Award },
          { id: 'tricks', label: 'Tricks', icon: BookOpen },
          { id: 'settings', label: 'Settings', icon: SettingsIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navButton}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Icon size={20} color={active ? 'rgb(139, 92, 246)' : '#9ca3af'} />
              <Text style={[styles.navButtonText, active && styles.navActiveText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* AUTHENTICATION OVERLAY MODAL */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowLoginModal(false)}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.modalTabs}>
              <TouchableOpacity
                onPress={() => { setAuthTab('signin'); setAuthError(''); }}
                style={[styles.modalTabBtn, authTab === 'signin' && styles.modalTabActive]}
              >
                <Text style={[styles.modalTabText, authTab === 'signin' && styles.modalTabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setAuthTab('signup'); setAuthError(''); }}
                style={[styles.modalTabBtn, authTab === 'signup' && styles.modalTabActive]}
              >
                <Text style={[styles.modalTabText, authTab === 'signup' && styles.modalTabTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {authError ? <Text style={styles.errorAlertText}>{authError}</Text> : null}
            {authSuccess ? <Text style={styles.successAlertText}>{authSuccess}</Text> : null}

            {authTab === 'signin' ? (
              /* SIGN IN */
              <View style={{ gap: 14 }}>
                <Text style={styles.fieldLabel}>Username, Email, or Phone</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={loginInput}
                    onChangeText={setLoginInput}
                    placeholder="e.g., mentalathlete"
                    placeholderTextColor="#555570"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#555570"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleLogin}>
                  <Text style={styles.modalSubmitBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* SIGN UP */
              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 12 }}>
                <Text style={styles.fieldLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={signupUsername}
                    onChangeText={setSignupUsername}
                    placeholder="e.g., mentalathlete"
                    placeholderTextColor="#555570"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                    placeholder="username@gmail.com"
                    placeholderTextColor="#555570"
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={signupPhone}
                    onChangeText={setSignupPhone}
                    placeholder="+91 99999 99999"
                    placeholderTextColor="#555570"
                    style={styles.input}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#555570"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSignup}>
                  <Text style={styles.modalSubmitBtnText}>Create Account</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styling system matching dark space obsidian aesthetics
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerWidgets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  signInBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  signInBtnText: {
    color: '#0d0d12',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tabContent: {
    gap: 16,
  },
  welcomeBanner: {
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSub: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 20,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  progressCardDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  progressRemaining: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
  },
  ringTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statMiniCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#13131c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 14,
    gap: 4,
  },
  statValText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statLabelText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  workoutTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  workoutDate: {
    color: '#9ca3af',
    fontSize: 11,
  },
  workoutAccuracy: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 12,
    fontSize: 13,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'rgba(13, 13, 18, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  lockedCard: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockedDesc: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 20,
  },
  lockedBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  lockedBtnText: {
    color: '#0d0d12',
    fontWeight: '700',
    fontSize: 13,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1f1f2e',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  modeTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: 'rgb(139, 92, 246)',
  },
  modeTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modeTabTextActive: {
    color: '#0d0d12',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  operationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  opSelector: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1f1f2e',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  opSelectorActive: {
    borderColor: 'rgb(139, 92, 246)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  opSelectorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  opSelectorTextActive: {
    color: 'rgb(139, 92, 246)',
  },
  diffTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  diffTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1f1f2e',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  diffTabActive: {
    borderColor: 'rgb(139, 92, 246)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  diffTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  diffTabTextActive: {
    color: 'rgb(139, 92, 246)',
  },
  descText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: 'rgb(139, 92, 246)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  startBtnText: {
    color: '#0d0d12',
    fontWeight: '800',
    fontSize: 15,
  },
  arenaActiveCard: {
    minHeight: 400,
    justifyContent: 'space-between',
  },
  arenaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
    paddingBottom: 10,
  },
  arenaSubtitle: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  arenaTimer: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 4,
  },
  timerAlert: {
    color: '#ef4444',
  },
  statsLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  equationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    gap: 12,
  },
  equationText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  textCorrect: {
    color: '#10b981',
  },
  textIncorrect: {
    color: '#ef4444',
  },
  inputFieldBox: {
    backgroundColor: '#1f1f2e',
    borderWidth: 2,
    borderColor: '#373750',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  inputFieldText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldCorrect: {
    borderColor: '#10b981',
  },
  fieldIncorrect: {
    borderColor: '#ef4444',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
  },
  keypadKey: {
    width: '31%',
    backgroundColor: '#1f1f2e',
    borderWidth: 1,
    borderColor: '#373750',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  keypadSpecial: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  keypadSubmit: {
    backgroundColor: 'rgb(139, 92, 246)',
    borderColor: 'rgb(139, 92, 246)',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#1f1f2e',
    borderRadius: 12,
    paddingVertical: 12,
  },
  resultCol: {
    alignItems: 'center',
  },
  resultValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  resultLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  mistakesHeading: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  mistakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  mistakeQuestion: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  mistakeUserAnswer: {
    color: '#ef4444',
    fontSize: 12,
  },
  tricksTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  trickHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  trickDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  trickExample: {
    color: 'rgb(139, 92, 246)',
    fontWeight: '600',
    fontSize: 12,
  },
  fractionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fractionText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  goalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f1f2e',
    borderRadius: 8,
    padding: 6,
    marginBottom: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#373750',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  counterVal: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  settingSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  switchLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  switchDesc: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
    maxWidth: '80%',
  },
  saveBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0d0d12',
    fontWeight: '700',
    fontSize: 13,
  },
  dangerBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dangerBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#13131c',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    zIndex: 100,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  navButtonText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  navActiveText: {
    color: 'rgb(139, 92, 246)',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#13131c',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    position: 'relative',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: '#1f1f2e',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalTabActive: {
    backgroundColor: 'rgb(139, 92, 246)',
  },
  modalTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  modalTabTextActive: {
    color: '#0d0d12',
  },
  errorAlertText: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  successAlertText: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#1f1f2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#373750',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 4,
  },
  modalSubmitBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#0d0d12',
    fontWeight: '800',
    fontSize: 14,
  },
});
