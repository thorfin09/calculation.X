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
  Dimensions,
  Platform
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
  Check,
  LogOut,
  ChevronRight,
  TrendingUp,
  Brain
} from 'lucide-react-native';
import { API } from './lib/api';

const { width, height } = Dimensions.get('window');

// Vedic tricks metadata
const TRICKS = [
  {
    id: 'squares_5',
    title: 'Squaring Ending in 5',
    desc: 'Multiply the first digit n by (n + 1) and append 25 at the end.',
    example: 'e.g., 65² = 6 × 7 = 42 → append 25 → 4225',
    op: 'squares_5'
  },
  {
    id: 'near_100',
    title: 'Multiplication near 100',
    desc: 'Add cross differences from base 100, then append product of differences.',
    example: 'e.g., 96 × 97 → (96 - 3) = 93 → append (4 × 3) = 9312',
    op: 'near_100'
  },
  {
    id: 'eleven_mult',
    title: 'Multiplying by 11',
    desc: 'Add adjacent digits of the number and sandwich them in between.',
    example: 'e.g., 43 × 11 → 4, (4+3), 3 → 473',
    op: 'eleven_mult'
  },
  {
    id: 'fraction_tables',
    title: 'Fraction to Percentage conversion',
    desc: 'Instantly convert key fractions to round percentages for fast approximations.',
    example: 'e.g., 1/8 = 12.5%, 5/6 = 83.3%',
    op: 'fractions'
  }
];

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
  
  // Login input states
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  
  // Registration input states
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
  const [settingsGoal, setSettingsGoal] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Arena states
  const [drillMode, setDrillMode] = useState<'sprint' | 'workout' | 'mistakes'>('sprint');
  const [chosenOp, setChosenOp] = useState<string>('addition');
  const [chosenDiff, setChosenDiff] = useState<string>('easy');
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [mistakesList, setMistakesList] = useState<any[]>([]);

  // Active training states
  const [arenaState, setArenaState] = useState<'config' | 'active' | 'results'>('config');
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [attempts, setAttempts] = useState<any[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [workoutPhase, setWorkoutPhase] = useState<number>(1);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');

  // Tricks practice state
  const [activeTrickPractice, setActiveTrickPractice] = useState<any>(null);
  const [showTrickModal, setShowTrickModal] = useState<boolean>(false);

  const sessionStartTime = useRef<number>(0);
  const questionStartTime = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch stats on login changes
  useEffect(() => {
    fetchStats();
  }, [isLoggedIn, username]);

  const fetchStats = async () => {
    if (!isLoggedIn || username === 'Guest') {
      setDashboardStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const data = await API.getDashboardStats(username);
      setDashboardStats(data);
      setSettingsGoal(data.user?.dailyGoalMinutes || 10);
      setSoundEnabled(data.user?.soundEnabled !== false);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogin = async () => {
    if (!loginInput.trim() || !loginPassword) return;
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await API.login(loginInput.trim(), loginPassword);
      if (res.success && res.username) {
        setUsername(res.username);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginInput('');
        setLoginPassword('');
      } else {
        setAuthError(res.error || 'Authentication credentials not recognized.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Server network authentication error.');
    }
  };

  const handleSignup = async () => {
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword) return;
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await API.signup(
        signupUsername.trim(),
        signupEmail.trim(),
        signupPhone.trim(),
        signupPassword
      );
      if (res.success) {
        setAuthSuccess('Account created successfully! Switching to Login...');
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
        setAuthError(res.error || 'Sign up registration failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration connection error.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out? Local records will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
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

  // Math equations generator matching Vedic layouts
  const generateQuestion = (op: string, diff: string, phase: number = 1) => {
    let text = '';
    let correctAnswer = '';
    let chosenOp = op;

    if (op === 'mixed') {
      const list = ['addition', 'subtraction', 'multiplication', 'division'];
      chosenOp = list[Math.floor(Math.random() * list.length)] || 'addition';
    } else if (op === 'mix') {
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

      // Special Vedic Trick Questions Generator
      case 'squares_5':
        num1 = (Math.floor(Math.random() * 8) + 1) * 10 + 5; // e.g. 15, 25, 35 ... 85, 95
        text = `${num1}²`;
        correctAnswer = String(num1 * num1);
        break;
      
      case 'near_100':
        num1 = Math.floor(Math.random() * 9) + 91; // 91 - 99
        num2 = Math.floor(Math.random() * 9) + 91; // 91 - 99
        text = `${num1} × ${num2}`;
        correctAnswer = String(num1 * num2);
        break;

      case 'eleven_mult':
        num1 = Math.floor(Math.random() * 89) + 10; // 10 - 99
        text = `${num1} × 11`;
        correctAnswer = String(num1 * 11);
        break;

      default:
        text = '2 + 2';
        correctAnswer = '4';
    }

    return { text, correctAnswer, operation: chosenOp };
  };

  // Launch Arena
  const startWorkout = async () => {
    setAttempts([]);
    setSolvedCount(0);
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setFeedback('none');
    setUserAnswer('');

    if (drillMode === 'workout') {
      setTimeLimit(600); // 10 mins
      setSecondsLeft(600);
      setWorkoutPhase(1);
      setCurrentQuestion(generateQuestion('mix', chosenDiff, 1));
    } else if (drillMode === 'mistakes') {
      try {
        const data = await API.getMistakes(username);
        if (data.length === 0) {
          Alert.alert('Clean Profile', 'You have no calculation errors to review!');
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

  // Real-time digit validation (Auto-submit on Correct matches)
  const handleInputChange = (val: string) => {
    setUserAnswer(val);
    if (!currentQuestion) return;

    if (val.trim() === currentQuestion.correctAnswer) {
      const newAttempt = {
        questionText: currentQuestion.text,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: val.trim(),
        isCorrect: true,
        operation: currentQuestion.operation
      };

      setAttempts((p) => [...p, newAttempt]);
      setSolvedCount((c) => c + 1);
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setFeedback('correct');
      Vibration.vibrate(30);

      if (drillMode === 'mistakes') {
        const currentMistake = mistakesList[0];
        if (currentMistake) {
          API.removeMistake(username, currentMistake.id).catch(console.error);
          setMistakesList((p) => p.slice(1));
        }
      }

      setTimeout(() => {
        setFeedback('none');
        setUserAnswer('');

        if (drillMode === 'workout') {
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
      }, 200);
    }
  };

  // Manual Trigger (Submit key/incorrect check)
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

    setAttempts((p) => [...p, newAttempt]);
    setSolvedCount((c) => c + 1);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setFeedback('correct');
      Vibration.vibrate(30);
    } else {
      setStreak(0);
      setFeedback('incorrect');
      Vibration.vibrate([0, 60, 40, 60]);
    }

    setTimeout(() => {
      setFeedback('none');
      setUserAnswer('');

      if (drillMode === 'workout') {
        setCurrentQuestion(generateQuestion('mix', chosenDiff, workoutPhase));
      } else if (drillMode === 'mistakes') {
        if (mistakesList.length > 1) {
          setMistakesList((p) => p.slice(1));
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

    if (!isLoggedIn || username === 'Guest') return;

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
      console.error('Failed to log workout session details:', e);
    }
  };

  // Keyboard keypad inputs mapping
  const handleKeypadPress = (key: string) => {
    if (key === 'C') {
      setUserAnswer('');
    } else if (key === '⌫') {
      setUserAnswer((p) => p.slice(0, -1));
    } else if (key === '⏎') {
      handleManualSubmit();
    } else {
      handleInputChange(userAnswer + key);
    }
  };

  // Vedic Trick Practice Modal triggers
  const startTrickPractice = (trick: any) => {
    setActiveTrickPractice({
      trick,
      solved: 0,
      correct: 0,
      streak: 0,
      maxStreak: 0,
      currentQuestion: generateQuestion(trick.op, 'easy'),
      userAnswer: '',
      feedback: 'none'
    });
    setShowTrickModal(true);
  };

  const handleTrickKeypadPress = (key: string) => {
    if (!activeTrickPractice) return;
    
    let currentAns = activeTrickPractice.userAnswer;
    if (key === 'C') {
      currentAns = '';
    } else if (key === '⌫') {
      currentAns = currentAns.slice(0, -1);
    } else if (key === '⏎') {
      const isCorrect = currentAns.trim() === activeTrickPractice.currentQuestion.correctAnswer;
      const nextStreak = isCorrect ? activeTrickPractice.streak + 1 : 0;
      const nextMaxStreak = Math.max(activeTrickPractice.maxStreak, nextStreak);
      
      setActiveTrickPractice((prev: any) => ({
        ...prev,
        solved: prev.solved + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
        feedback: isCorrect ? 'correct' : 'incorrect',
        userAnswer: ''
      }));

      Vibration.vibrate(isCorrect ? 30 : [0, 60, 40, 60]);

      setTimeout(() => {
        setActiveTrickPractice((prev: any) => ({
          ...prev,
          feedback: 'none',
          currentQuestion: generateQuestion(prev.trick.op, 'easy')
        }));
      }, 250);
      return;
    } else {
      currentAns = currentAns + key;
    }

    // Auto submit on correct values
    if (currentAns.trim() === activeTrickPractice.currentQuestion.correctAnswer) {
      const nextStreak = activeTrickPractice.streak + 1;
      const nextMaxStreak = Math.max(activeTrickPractice.maxStreak, nextStreak);
      Vibration.vibrate(30);

      setActiveTrickPractice((prev: any) => ({
        ...prev,
        solved: prev.solved + 1,
        correct: prev.correct + 1,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
        feedback: 'correct',
        userAnswer: ''
      }));

      setTimeout(() => {
        setActiveTrickPractice((prev: any) => ({
          ...prev,
          feedback: 'none',
          currentQuestion: generateQuestion(prev.trick.op, 'easy')
        }));
      }, 200);
    } else {
      setActiveTrickPractice((prev: any) => ({
        ...prev,
        userAnswer: currentAns
      }));
    }
  };

  // Preference update
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await API.updateUserSettings(username, {
        dailyGoalMinutes: settingsGoal,
        soundEnabled: soundEnabled
      });
      Alert.alert('Settings Saved', 'Your calculation settings have been updated.');
      fetchStats();
    } catch (err) {
      Alert.alert('Sync Error', 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearMistakesLog = async () => {
    Alert.alert(
      'Reset Errors Log',
      'Are you sure you want to clear your saved calculation mistake log?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await API.clearMistakes(username);
              Alert.alert('Reset Successful', 'Calculation errors database wiped.');
            } catch (err) {
              Alert.alert('Sync Error', 'Failed to clear mistakes.');
            }
          }
        }
      ]
    );
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // SVG dimensions
  const radius = 68;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const percentComplete = dashboardStats ? Math.min(100, Math.round((dashboardStats.minutesToday / dashboardStats.user?.dailyGoalMinutes) * 100)) : 0;
  const strokeDashoffset = circumference * (1 - percentComplete / 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER NAVBAR (Brand & Streak Flame) */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          calculation<Text style={{ color: 'rgb(139, 92, 246)' }}>.X</Text>
        </Text>
        
        <View style={styles.headerRight}>
          {isLoggedIn && dashboardStats && (
            <View style={styles.streakIndicator}>
              <Flame size={15} color="#f59e0b" fill="#f59e0b" />
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

      {/* MAIN VIEW CONTENT CONTAINER */}
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* VIEW 1: DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <View style={styles.tabWrapper}>
              
              {/* Welcome text card */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeText}>Hello, {isLoggedIn ? username : 'Guest'}</Text>
                <Text style={styles.welcomeSubtext}>
                  {isLoggedIn 
                    ? 'Invest 10 minutes today to boost your calculation speeds.'
                    : 'Train freely in guest mode. Sign in to log errors and save session analytics!'
                  }
                </Text>
              </View>

              <View style={{ position: 'relative' }}>
                {!isLoggedIn && (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockCard}>
                      <Key size={30} color="rgb(139, 92, 246)" style={{ marginBottom: 12 }} />
                      <Text style={styles.lockCardTitle}>Premium Dashboard Locked</Text>
                      <Text style={styles.lockCardDesc}>
                        Sign in to track progress rings, logs, mistakes reviewer, and training histories.
                      </Text>
                      <TouchableOpacity style={styles.lockCardBtn} onPress={() => setShowLoginModal(true)}>
                        <Text style={styles.lockCardBtnText}>Sign In / Create Account</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={{ opacity: isLoggedIn ? 1 : 0.4 }}>
                  {/* Circular Progress Ring */}
                  <View style={styles.ringCard}>
                    <View style={styles.ringLeft}>
                      <Text style={styles.ringCardTitle}>Daily Progress</Text>
                      <Text style={styles.ringCardDesc}>
                        Accumulate 10 minutes of math drills daily to build your quantitative memory.
                      </Text>
                      {dashboardStats && (
                        <Text style={styles.ringTimeStats}>
                          Today: {dashboardStats.minutesToday}m / {dashboardStats.user?.dailyGoalMinutes}m
                        </Text>
                      )}
                    </View>

                    <View style={styles.ringOuter}>
                      <Svg width="140" height="140" style={styles.ringSvg}>
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#1a1a26"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        <Circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="rgb(139, 92, 246)"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </Svg>
                      <View style={styles.ringTextOverlay}>
                        <Text style={styles.ringPercentText}>{percentComplete}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Solved metrics grid */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Target size={18} color="rgb(139, 92, 246)" style={{ marginBottom: 4 }} />
                      <Text style={styles.metricValue}>{dashboardStats?.averageAccuracy || 0}%</Text>
                      <Text style={styles.metricLabel}>Accuracy</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Zap size={18} color="rgb(139, 92, 246)" style={{ marginBottom: 4 }} />
                      <Text style={styles.metricValue}>{dashboardStats?.averageSpeed || 0} Q/m</Text>
                      <Text style={styles.metricLabel}>Speed</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <CheckCircle2 size={18} color="rgb(139, 92, 246)" style={{ marginBottom: 4 }} />
                      <Text style={styles.metricValue}>{dashboardStats?.totalCorrect || 0}</Text>
                      <Text style={styles.metricLabel}>Solved</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Clock size={18} color="rgb(139, 92, 246)" style={{ marginBottom: 4 }} />
                      <Text style={styles.metricValue}>{dashboardStats?.totalTimeMin || 0}m</Text>
                      <Text style={styles.metricLabel}>Trained</Text>
                    </View>
                  </View>

                  {/* Recent Workouts list */}
                  <View style={styles.panelCard}>
                    <Text style={styles.panelCardTitle}>Recent Session History</Text>
                    {dashboardStats && dashboardStats.recentSessions?.length > 0 ? (
                      dashboardStats.recentSessions.map((session: any, idx: number) => (
                        <View key={session.id || idx} style={styles.sessionListItem}>
                          <View>
                            <Text style={styles.sessionName}>{session.operation} session</Text>
                            <Text style={styles.sessionDate}>Solved {session.totalQuestions} questions</Text>
                          </View>
                          <Text style={styles.sessionAcc}>{Math.round((session.correctCount / session.totalQuestions) * 100)}% Acc</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptySessionText}>No logged session history found.</Text>
                    )}
                  </View>
                </View>
              </View>

            </View>
          )}

          {/* VIEW 2: ARENA TAB */}
          {activeTab === 'arena' && (
            <View style={styles.tabWrapper}>
              
              {/* Configuration setups */}
              {arenaState === 'config' && (
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Choose Drill Mode</Text>

                  {/* Mode select tabs */}
                  <View style={styles.tabSelectGroup}>
                    {['sprint', 'workout', 'mistakes'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => {
                          if (mode === 'mistakes' && !isLoggedIn) {
                            Alert.alert('Verification Required', 'Sign in to review saved calculation errors.');
                            return;
                          }
                          setDrillMode(mode as any);
                        }}
                        style={[styles.tabSelectBtn, drillMode === mode && styles.tabSelectBtnActive]}
                      >
                        <Text style={[styles.tabSelectText, drillMode === mode && styles.tabSelectTextActive]}>
                          {mode === 'mistakes' && !isLoggedIn ? 'Mistakes 🔒' : mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {drillMode === 'sprint' && (
                    <View style={{ gap: 16 }}>
                      <Text style={styles.fieldSectionLabel}>Select Operation</Text>
                      <View style={styles.opSelectionGrid}>
                        {OPERATIONS.map((op) => (
                          <TouchableOpacity
                            key={op.id}
                            onPress={() => setChosenOp(op.id)}
                            style={[styles.opItem, chosenOp === op.id && styles.opItemActive]}
                          >
                            <Text style={[styles.opItemText, chosenOp === op.id && styles.opItemTextActive]}>
                              {op.val}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.fieldSectionLabel}>Select Difficulty</Text>
                      <View style={styles.difficultyRow}>
                        {DIFFICULTIES.map((diff) => (
                          <TouchableOpacity
                            key={diff}
                            onPress={() => setChosenDiff(diff)}
                            style={[styles.diffBtn, chosenDiff === diff && styles.diffBtnActive]}
                          >
                            <Text style={[styles.diffBtnText, chosenDiff === diff && styles.diffBtnTextActive]}>
                              {diff}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {drillMode === 'workout' && (
                    <Text style={styles.drillDescription}>
                      Launches a comprehensive 10-minute training block spanning multiplication matrices, Vedic divisions, and fraction percentage tables.
                    </Text>
                  )}

                  {drillMode === 'mistakes' && (
                    <Text style={styles.drillDescription}>
                      Review and correct arithmetic logs of previously failed questions. Correct solutions dynamically wipe them from your records.
                    </Text>
                  )}

                  <TouchableOpacity style={styles.primaryActionBtn} onPress={startWorkout}>
                    <Text style={styles.primaryActionBtnText}>Launch Workout</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Training Screen */}
              {arenaState === 'active' && currentQuestion && (
                <View style={[styles.panelCard, styles.arenaActivePanel]}>
                  
                  {/* Status columns */}
                  <View style={styles.arenaActiveHeader}>
                    <View>
                      <Text style={styles.arenaHeadingLabel}>{drillMode} training</Text>
                      <Text style={[styles.arenaCountdownText, secondsLeft <= 15 && styles.textRed]}>
                        {formatTime(secondsLeft)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.statsHeaderText}>Solved: {solvedCount}</Text>
                      <Text style={styles.statsHeaderText}>
                        Accuracy: {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 100}%
                      </Text>
                    </View>
                  </View>

                  {/* Math calculation presentation */}
                  <View style={styles.arenaEquationWrapper}>
                    <Text style={[
                      styles.equationMainText,
                      feedback === 'correct' && styles.textGreen,
                      feedback === 'incorrect' && styles.textRed
                    ]}>
                      {currentQuestion.text} =
                    </Text>
                    
                    <View style={[
                      styles.equationAnswerInputBox,
                      feedback === 'correct' && styles.borderGreen,
                      feedback === 'incorrect' && styles.borderRed
                    ]}>
                      <Text style={styles.equationAnswerInputText}>{userAnswer || '?'}</Text>
                    </View>
                  </View>

                  {/* Native Grid Keypad */}
                  <View style={styles.keypadLayout}>
                    {/* Row 1 */}
                    <View style={styles.keypadRow}>
                      {['1', '2', '3'].map(k => (
                        <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeypadPress(k)}>
                          <Text style={styles.keypadBtnText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Row 2 */}
                    <View style={styles.keypadRow}>
                      {['4', '5', '6'].map(k => (
                        <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeypadPress(k)}>
                          <Text style={styles.keypadBtnText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Row 3 */}
                    <View style={styles.keypadRow}>
                      {['7', '8', '9'].map(k => (
                        <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeypadPress(k)}>
                          <Text style={styles.keypadBtnText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Row 4 */}
                    <View style={styles.keypadRow}>
                      {['-', '0', '.'].map(k => (
                        <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeypadPress(k)}>
                          <Text style={styles.keypadBtnText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Row 5 Special controls */}
                    <View style={styles.keypadRow}>
                      <TouchableOpacity style={[styles.keypadBtn, styles.keypadSpecialBtn]} onPress={() => handleKeypadPress('C')}>
                        <Text style={styles.keypadBtnText}>C</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.keypadBtn, styles.keypadSpecialBtn]} onPress={() => handleKeypadPress('⌫')}>
                        <Text style={styles.keypadBtnText}>⌫</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.keypadBtn, styles.keypadSubmitBtn]} onPress={() => handleKeypadPress('⏎')}>
                        <Text style={[styles.keypadBtnText, { color: '#0d0d12' }]}>⏎</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              )}

              {/* Workout finished metrics report */}
              {arenaState === 'results' && (
                <View style={styles.panelCard}>
                  <CheckCircle2 size={46} color="#10b981" style={{ alignSelf: 'center', marginBottom: 12 }} />
                  <Text style={styles.resultsPanelTitle}>Session Complete!</Text>

                  <View style={styles.resultsMetricGrid}>
                    <View style={styles.resultsMetricCol}>
                      <Text style={styles.resultsMetricValue}>{correctCount} / {solvedCount}</Text>
                      <Text style={styles.resultsMetricLabel}>Correct</Text>
                    </View>
                    <View style={styles.resultsMetricCol}>
                      <Text style={[styles.resultsMetricValue, { color: '#10b981' }]}>
                        {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0}%
                      </Text>
                      <Text style={styles.resultsMetricLabel}>Accuracy</Text>
                    </View>
                    <View style={styles.resultsMetricCol}>
                      <Text style={[styles.resultsMetricValue, { color: '#f59e0b' }]}>{maxStreak} 🔥</Text>
                      <Text style={styles.resultsMetricLabel}>Max Streak</Text>
                    </View>
                  </View>

                  {attempts.filter(a => !a.isCorrect).length > 0 && (
                    <View style={{ marginTop: 12, marginBottom: 20 }}>
                      <Text style={styles.mistakeBlockHeader}>Review Errors</Text>
                      {attempts.filter(a => !a.isCorrect).map((attempt, idx) => (
                        <View key={idx} style={styles.mistakeReviewRow}>
                          <Text style={styles.mistakeReviewQuestion}>{attempt.questionText} = {attempt.correctAnswer}</Text>
                          <Text style={styles.mistakeReviewWrongAns}>Entered: {attempt.userAnswer}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setArenaState('config')}>
                    <Text style={styles.primaryActionBtnText}>Review Screen</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          )}

          {/* VIEW 3: VEDIC SPEED TRICKS TAB */}
          {activeTab === 'tricks' && (
            <View style={styles.tabWrapper}>
              <Text style={styles.tricksHeadingTitle}>Vedic Mental Speed Math</Text>
              <Text style={styles.tricksHeadingSub}>Tap any shortcut rule to launch an interactive practice drill session!</Text>

              {TRICKS.map((trick) => (
                <TouchableOpacity 
                  key={trick.id} 
                  style={styles.trickOverviewCard}
                  onPress={() => startTrickPractice(trick)}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.trickOverviewTitle}>{trick.title}</Text>
                    <Text style={styles.trickOverviewDesc}>{trick.desc}</Text>
                    <Text style={styles.trickOverviewExample}>{trick.example}</Text>
                  </View>
                  <ChevronRight size={18} color="rgb(139, 92, 246)" style={{ alignSelf: 'center' }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* VIEW 4: SETTINGS CONFIGURATOR TAB */}
          {activeTab === 'settings' && (
            <View style={styles.tabWrapper}>
              
              <View style={styles.panelCard}>
                <Text style={styles.panelTitle}>Preferences Configuration</Text>
                
                <Text style={styles.fieldSectionLabel}>Daily Focus Goal (Minutes)</Text>
                <View style={styles.goalControllerRow}>
                  <TouchableOpacity onPress={() => setSettingsGoal(p => Math.max(1, p - 1))} style={styles.goalBtn}>
                    <Text style={styles.goalBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.goalValueText}>{settingsGoal} Minutes</Text>
                  <TouchableOpacity onPress={() => setSettingsGoal(p => Math.min(60, p + 1))} style={styles.goalBtn}>
                    <Text style={styles.goalBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.settingToggleRow}>
                  <View>
                    <Text style={styles.settingToggleTitle}>Haptics & Feedback</Text>
                    <Text style={styles.settingToggleDesc}>Provide physical vibrations on correct calculations.</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{ false: '#1a1a26', true: 'rgb(139, 92, 246)' }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSaveSettings} disabled={savingSettings || !isLoggedIn}>
                  <Text style={styles.primaryActionBtnText}>{savingSettings ? 'Saving...' : 'Save Configuration'}</Text>
                </TouchableOpacity>
              </View>

              {isLoggedIn && (
                <View style={styles.panelCard}>
                  <Text style={[styles.panelTitle, { color: '#ef4444' }]}>Profile Clean Actions</Text>
                  <TouchableOpacity style={styles.dangerActionBtn} onPress={handleClearMistakesLog}>
                    <Text style={styles.dangerActionBtnText}>Reset Calculation Mistakes Database</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          )}

        </ScrollView>
      </View>

      {/* FIXED BOTTOM NAVIGATION BAR (Placed Outside ScrollView to prevent ANY overlapping!) */}
      <View style={styles.bottomTabBar}>
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
              style={styles.tabBarBtn}
              onPress={() => {
                Vibration.vibrate(10);
                setActiveTab(tab.id as any);
              }}
            >
              <Icon size={20} color={active ? 'rgb(139, 92, 246)' : '#9ca3af'} />
              <Text style={[styles.tabBarBtnText, active && styles.tabBarBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* INTERACTIVE TRICKS DRILLS OVERLAY MODAL */}
      <Modal
        visible={showTrickModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTrickModal(false)}
      >
        <View style={styles.modalOverlay}>
          {activeTrickPractice && (
            <View style={[styles.panelCard, styles.trickPracticeCard]}>
              <TouchableOpacity style={styles.closeTrickModalBtn} onPress={() => setShowTrickModal(false)}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>

              <Text style={styles.trickPracticeTitle}>{activeTrickPractice.trick.title}</Text>
              <Text style={styles.trickPracticeSub}>{activeTrickPractice.trick.desc}</Text>

              {/* Solved Acc counter */}
              <View style={styles.trickStatsRow}>
                <Text style={styles.trickStatsText}>Correct: {activeTrickPractice.correct} / {activeTrickPractice.solved}</Text>
                <Text style={styles.trickStatsText}>Streak: {activeTrickPractice.streak} 🔥</Text>
              </View>

              {/* Question display */}
              <View style={styles.trickQuestionArea}>
                <Text style={[
                  styles.equationMainText,
                  activeTrickPractice.feedback === 'correct' && styles.textGreen,
                  activeTrickPractice.feedback === 'incorrect' && styles.textRed
                ]}>
                  {activeTrickPractice.currentQuestion.text} =
                </Text>
                <View style={[
                  styles.equationAnswerInputBox,
                  activeTrickPractice.feedback === 'correct' && styles.borderGreen,
                  activeTrickPractice.feedback === 'incorrect' && styles.borderRed
                ]}>
                  <Text style={styles.equationAnswerInputText}>{activeTrickPractice.userAnswer || '?'}</Text>
                </View>
              </View>

              {/* Practice Keypad */}
              <View style={styles.keypadLayout}>
                {/* Row 1 */}
                <View style={styles.keypadRow}>
                  {['1', '2', '3'].map(k => (
                    <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleTrickKeypadPress(k)}>
                      <Text style={styles.keypadBtnText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 2 */}
                <View style={styles.keypadRow}>
                  {['4', '5', '6'].map(k => (
                    <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleTrickKeypadPress(k)}>
                      <Text style={styles.keypadBtnText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 3 */}
                <View style={styles.keypadRow}>
                  {['7', '8', '9'].map(k => (
                    <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleTrickKeypadPress(k)}>
                      <Text style={styles.keypadBtnText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 4 */}
                <View style={styles.keypadRow}>
                  {['-', '0', '.'].map(k => (
                    <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleTrickKeypadPress(k)}>
                      <Text style={styles.keypadBtnText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 5 */}
                <View style={styles.keypadRow}>
                  <TouchableOpacity style={[styles.keypadBtn, styles.keypadSpecialBtn]} onPress={() => handleTrickKeypadPress('C')}>
                    <Text style={styles.keypadBtnText}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.keypadBtn, styles.keypadSpecialBtn]} onPress={() => handleTrickKeypadPress('⌫')}>
                    <Text style={styles.keypadBtnText}>⌫</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.keypadBtn, styles.keypadSubmitBtn]} onPress={() => handleTrickKeypadPress('⏎')}>
                    <Text style={[styles.keypadBtnText, { color: '#0d0d12' }]}>⏎</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* CREDENTIALS LOGIN OVERLAY MODAL */}
      <Modal
        visible={showLoginModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeLoginModalBtn} onPress={() => setShowLoginModal(false)}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Modal Tabs switcher */}
            <View style={styles.modalTabHeader}>
              <TouchableOpacity 
                onPress={() => { setAuthTab('signin'); setAuthError(''); setAuthSuccess(''); }}
                style={[styles.modalTabHeaderBtn, authTab === 'signin' && styles.modalTabHeaderBtnActive]}
              >
                <Text style={[styles.modalTabHeaderText, authTab === 'signin' && styles.modalTabHeaderTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setAuthTab('signup'); setAuthError(''); setAuthSuccess(''); }}
                style={[styles.modalTabHeaderBtn, authTab === 'signup' && styles.modalTabHeaderBtnActive]}
              >
                <Text style={[styles.modalTabHeaderText, authTab === 'signup' && styles.modalTabHeaderTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {authError ? <Text style={styles.modalErrorAlert}>{authError}</Text> : null}
            {authSuccess ? <Text style={styles.modalSuccessAlert}>{authSuccess}</Text> : null}

            {authTab === 'signin' ? (
              /* SIGN IN FORM VIEW */
              <View style={{ gap: 12 }}>
                <Text style={styles.modalInputLabel}>Username, Email, or Phone</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={loginInput}
                    onChangeText={setLoginInput}
                    placeholder="Username / Email / Phone"
                    placeholderTextColor="#55556a"
                    style={styles.modalTextInput}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.modalInputLabel}>Password</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#55556a"
                    secureTextEntry={!showPassword}
                    style={styles.modalTextInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.modalEyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.modalActionButton} onPress={handleLogin}>
                  <Text style={styles.modalActionButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* SIGN UP FORM VIEW */
              <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalInputLabel}>Username</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={signupUsername}
                    onChangeText={setSignupUsername}
                    placeholder="e.g. mentalathlete"
                    placeholderTextColor="#55556a"
                    style={styles.modalTextInput}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.modalInputLabel}>Email Address</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                    placeholder="username@gmail.com"
                    placeholderTextColor="#55556a"
                    style={styles.modalTextInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.modalInputLabel}>Phone Number</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={signupPhone}
                    onChangeText={setSignupPhone}
                    placeholder="e.g. +91 99999 99999"
                    placeholderTextColor="#55556a"
                    style={styles.modalTextInput}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.modalInputLabel}>Password</Text>
                <View style={styles.modalTextInputBox}>
                  <TextInput
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#55556a"
                    secureTextEntry={!showPassword}
                    style={styles.modalTextInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.modalEyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.modalActionButton} onPress={handleSignup}>
                  <Text style={styles.modalActionButtonText}>Create Account</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a26',
    backgroundColor: '#0d0d12',
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '800',
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
    fontWeight: '800',
    fontSize: 12,
  },
  contentContainer: {
    flex: 1, // Let scroll content occupy remaining space above tab bar
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24, // Normal padding since bottom navigation is an independent layout sibling
  },
  tabWrapper: {
    gap: 16,
  },
  welcomeCard: {
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtext: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'rgba(13, 13, 18, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  lockCard: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  lockCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockCardDesc: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 20,
  },
  lockCardBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  lockCardBtnText: {
    color: '#0d0d12',
    fontWeight: '800',
    fontSize: 13,
  },
  panelCard: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 20,
    marginBottom: 12,
  },
  ringCard: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringLeft: {
    flex: 1,
    paddingRight: 12,
  },
  ringCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  ringCardDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  ringTimeStats: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  ringOuter: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  ringTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#13131c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 14,
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  panelCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  sessionListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  sessionName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  sessionDate: {
    color: '#9ca3af',
    fontSize: 11,
  },
  sessionAcc: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 13,
  },
  emptySessionText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  tabSelectGroup: {
    flexDirection: 'row',
    backgroundColor: '#1a1a26',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tabSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabSelectBtnActive: {
    backgroundColor: 'rgb(139, 92, 246)',
  },
  tabSelectText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  tabSelectTextActive: {
    color: '#0d0d12',
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  opSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  opItem: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a26',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  opItemActive: {
    borderColor: 'rgb(139, 92, 246)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  opItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  opItemTextActive: {
    color: 'rgb(139, 92, 246)',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a26',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  diffBtnActive: {
    borderColor: 'rgb(139, 92, 246)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  diffBtnText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  diffBtnTextActive: {
    color: 'rgb(139, 92, 246)',
  },
  drillDescription: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryActionBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#0d0d12',
    fontWeight: '900',
    fontSize: 15,
  },
  arenaActivePanel: {
    minHeight: 450,
    justifyContent: 'space-between',
  },
  arenaActiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
    paddingBottom: 10,
  },
  arenaHeadingLabel: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  arenaCountdownText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 4,
  },
  statsHeaderText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  arenaEquationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
    gap: 16,
  },
  equationMainText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  equationAnswerInputBox: {
    backgroundColor: '#1a1a26',
    borderWidth: 2,
    borderColor: '#37374f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  equationAnswerInputText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  keypadLayout: {
    marginTop: 10,
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadBtn: {
    flex: 1,
    backgroundColor: '#1a1a26',
    borderWidth: 1,
    borderColor: '#37374f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  keypadSpecialBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  keypadSubmitBtn: {
    backgroundColor: 'rgb(139, 92, 246)',
    borderColor: 'rgb(139, 92, 246)',
  },
  resultsPanelTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsMetricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#1a1a26',
    borderRadius: 12,
    paddingVertical: 12,
  },
  resultsMetricCol: {
    alignItems: 'center',
  },
  resultsMetricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  resultsMetricLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  mistakeBlockHeader: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  mistakeReviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  mistakeReviewQuestion: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  mistakeReviewWrongAns: {
    color: '#ef4444',
    fontSize: 12,
  },
  tricksHeadingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  tricksHeadingSub: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  trickOverviewCard: {
    backgroundColor: '#13131c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trickOverviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  trickOverviewDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  trickOverviewExample: {
    color: 'rgb(139, 92, 246)',
    fontWeight: '700',
    fontSize: 12,
  },
  goalControllerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a26',
    borderRadius: 8,
    padding: 6,
    marginBottom: 16,
  },
  goalBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#37374f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  goalValueText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingToggleTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  settingToggleDesc: {
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
  dangerActionBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dangerActionBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 13,
  },
  bottomTabBar: {
    backgroundColor: '#13131c',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8, // Handle iOS bottom safe area spacing!
  },
  tabBarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  tabBarBtnText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  tabBarBtnTextActive: {
    color: 'rgb(139, 92, 246)',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  closeLoginModalBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalTabHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a26',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  modalTabHeaderBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalTabHeaderBtnActive: {
    backgroundColor: 'rgb(139, 92, 246)',
  },
  modalTabHeaderText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '800',
  },
  modalTabHeaderTextActive: {
    color: '#0d0d12',
  },
  modalErrorAlert: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  modalSuccessAlert: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalTextInputBox: {
    backgroundColor: '#1a1a26',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#37374f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modalTextInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  modalEyeBtn: {
    padding: 4,
  },
  modalActionButton: {
    backgroundColor: 'rgb(139, 92, 246)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalActionButtonText: {
    color: '#0d0d12',
    fontWeight: '900',
    fontSize: 14,
  },
  closeLoginModalBtnText: {
    color: '#fff',
  },
  textRed: {
    color: '#ef4444',
  },
  textGreen: {
    color: '#10b981',
  },
  borderGreen: {
    borderColor: '#10b981',
  },
  borderRed: {
    borderColor: '#ef4444',
  },
  trickPracticeCard: {
    width: '100%',
    maxWidth: 380,
    position: 'relative',
  },
  closeTrickModalBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  trickPracticeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    paddingRight: 24,
  },
  trickPracticeSub: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  trickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a26',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  trickStatsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  trickQuestionArea: {
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  fractionRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  fractionText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
});
