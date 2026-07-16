import { Pool } from 'pg';

export interface UserProfile {
  name: string;
  dailyGoalMinutes: number;
  soundEnabled: boolean;
}

export interface MathSession {
  id: string;
  timestamp: string; // ISO String
  durationSeconds: number;
  operation: string; // 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions' | 'mix'
  correctCount: number;
  totalQuestions: number;
  averageTimePerQuestionMs: number;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  minutesSpent: number;
  goalAchieved: boolean;
}

export interface MistakeQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  operation: string;
  timestamp: string;
}

// Read Connection String from environment or Fallback to the user's provided Neon Database URL
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fyw63CcHjIdo@ep-silent-lake-auyqw55e-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for serverless database environments
  }
});

let tablesInitialized = false;

// Idempotent schema initialization
async function ensureTables() {
  if (tablesInitialized) return;
  const client = await pool.connect();
  try {
    // Create necessary database tables sequentially
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(100) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        daily_goal_minutes INT NOT NULL DEFAULT 10,
        sound_enabled BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_seconds INT NOT NULL,
        operation VARCHAR(50) NOT NULL,
        correct_count INT NOT NULL,
        total_questions INT NOT NULL,
        average_time_per_question_ms INT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_progress (
        username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE,
        date DATE NOT NULL,
        minutes_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
        goal_achieved BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (username, date)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mistakes (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        correct_answer VARCHAR(100) NOT NULL,
        user_answer VARCHAR(100) NOT NULL,
        operation VARCHAR(50) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    tablesInitialized = true;
    console.log('PostgreSQL database schemas verified successfully.');
  } catch (err) {
    console.error('Critical database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export class DB {
  // Validate or Register a user with their password
  static async authenticateUser(username: string, passwordAttempt: string): Promise<{ success: boolean; error?: string }> {
    await ensureTables();
    const key = username.trim();
    if (!key) return { success: false, error: 'Username cannot be blank.' };

    const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    
    if (res.rows.length === 0) {
      // Auto-register user with password credentials
      await pool.query(
        'INSERT INTO users (username, password, daily_goal_minutes, sound_enabled) VALUES ($1, $2, 10, TRUE)',
        [key, passwordAttempt]
      );
      return { success: true };
    }

    const user = res.rows[0];
    if (user.password === passwordAttempt) {
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect password for this username. Please try again.' };
    }
  }

  // Get user profile details
  static async getUser(username: string): Promise<UserProfile> {
    await ensureTables();
    const key = username.trim();
    const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    
    if (res.rows.length === 0) {
      return { name: 'Guest', dailyGoalMinutes: 10, soundEnabled: true };
    }
    
    const user = res.rows[0];
    return {
      name: user.username,
      dailyGoalMinutes: user.daily_goal_minutes,
      soundEnabled: user.sound_enabled
    };
  }

  // Update user preferences
  static async updateUser(username: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    await ensureTables();
    const key = username.trim();
    
    const currentRes = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    if (currentRes.rows.length === 0) {
      return { name: 'Guest', dailyGoalMinutes: 10, soundEnabled: true };
    }
    
    const user = currentRes.rows[0];
    const newGoal = profile.dailyGoalMinutes !== undefined ? profile.dailyGoalMinutes : user.daily_goal_minutes;
    const newSound = profile.soundEnabled !== undefined ? profile.soundEnabled : user.sound_enabled;
    const actualUsername = user.username;

    await pool.query(
      'UPDATE users SET daily_goal_minutes = $1, sound_enabled = $2 WHERE LOWER(username) = LOWER($3)',
      [newGoal, newSound, key]
    );
    
    return {
      name: actualUsername,
      dailyGoalMinutes: newGoal,
      soundEnabled: newSound
    };
  }

  // Add training session logs
  static async addSession(username: string, sessionData: Omit<MathSession, 'id' | 'timestamp'>, clientDate?: string): Promise<MathSession> {
    await ensureTables();
    const key = username.trim();
    const sessionId = Math.random().toString(36).substring(2, 9);
    const nowStr = new Date().toISOString();

    const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    if (userCheck.rows.length === 0) {
      return {
        ...sessionData,
        id: sessionId,
        timestamp: nowStr
      };
    }

    const actualUsername = userCheck.rows[0].username;

    // Log the math session
    await pool.query(
      `INSERT INTO sessions (id, username, timestamp, duration_seconds, operation, correct_count, total_questions, average_time_per_question_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionId,
        actualUsername,
        nowStr,
        sessionData.durationSeconds,
        sessionData.operation,
        sessionData.correctCount,
        sessionData.totalQuestions,
        sessionData.averageTimePerQuestionMs
      ]
    );

    // Update progress stats for clientDate
    const dateStr = clientDate || new Date().toISOString().split('T')[0];
    const minutesAdded = sessionData.durationSeconds / 60;

    const progressRes = await pool.query(
      'SELECT * FROM daily_progress WHERE LOWER(username) = LOWER($1) AND date = $2',
      [key, dateStr]
    );

    let currentMins = 0;
    if (progressRes.rows.length > 0) {
      currentMins = Number(progressRes.rows[0].minutes_spent);
    }

    const newMins = parseFloat((currentMins + minutesAdded).toFixed(2));
    const dailyGoal = userCheck.rows[0].daily_goal_minutes;
    const goalAchieved = newMins >= dailyGoal;

    await pool.query(
      `INSERT INTO daily_progress (username, date, minutes_spent, goal_achieved)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username, date)
       DO UPDATE SET minutes_spent = $3, goal_achieved = $4`,
      [actualUsername, dateStr, newMins, goalAchieved]
    );

    return {
      ...sessionData,
      id: sessionId,
      timestamp: nowStr
    };
  }

  // Mistakes lists management
  static async getMistakes(username: string): Promise<MistakeQuestion[]> {
    await ensureTables();
    const key = username.trim();
    const res = await pool.query('SELECT * FROM mistakes WHERE LOWER(username) = LOWER($1) ORDER BY timestamp DESC', [key]);
    return res.rows.map((row) => ({
      id: row.id,
      questionText: row.question_text,
      correctAnswer: row.correct_answer,
      userAnswer: row.user_answer,
      operation: row.operation,
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp)
    }));
  }

  static async addMistakes(username: string, questions: Omit<MistakeQuestion, 'id' | 'timestamp'>[]): Promise<void> {
    await ensureTables();
    const key = username.trim();
    const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    if (userCheck.rows.length === 0) return;

    const actualUsername = userCheck.rows[0].username;
    const timestamp = new Date().toISOString();

    for (const q of questions) {
      const dupCheck = await pool.query(
        'SELECT id FROM mistakes WHERE LOWER(username) = LOWER($1) AND question_text = $2',
        [key, q.questionText]
      );
      if (dupCheck.rows.length > 0) continue;

      const id = Math.random().toString(36).substring(2, 9);
      await pool.query(
        `INSERT INTO mistakes (id, username, question_text, correct_answer, user_answer, operation, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
         [id, actualUsername, q.questionText, q.correctAnswer, q.userAnswer, q.operation, timestamp]
      );
    }

    // Keep mistakes size limited to 100
    await pool.query(
      `DELETE FROM mistakes WHERE username = $1 AND id NOT IN (
         SELECT id FROM mistakes WHERE username = $1 ORDER BY timestamp DESC LIMIT 100
       )`,
      [actualUsername]
    );
  }

  static async removeMistake(username: string, id: string): Promise<void> {
    await ensureTables();
    const key = username.trim();
    await pool.query('DELETE FROM mistakes WHERE LOWER(username) = LOWER($1) AND id = $2', [key, id]);
  }

  static async clearMistakes(username: string): Promise<void> {
    await ensureTables();
    const key = username.trim();
    await pool.query('DELETE FROM mistakes WHERE LOWER(username) = LOWER($1)', [key]);
  }

  // Dashboard calculations
  static async getDashboardStats(username: string, clientDate?: string) {
    await ensureTables();
    const key = username.trim();

    const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [key]);
    if (userCheck.rows.length === 0) {
      return {
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
      };
    }

    const user = userCheck.rows[0];
    const actualUsername = user.username;

    // Fetch all user daily progress
    const progressRes = await pool.query(
      'SELECT * FROM daily_progress WHERE username = $1 ORDER BY date DESC',
      [actualUsername]
    );

    const progressMap: Record<string, { date: string; minutesSpent: number; goalAchieved: boolean }> = {};
    progressRes.rows.forEach(row => {
      // Postgres DATE type parses as local Date object or string
      const dateString = row.date instanceof Date 
        ? row.date.toLocaleDateString('sv-SE') 
        : String(row.date).split('T')[0] || '';
      progressMap[dateString] = {
        date: dateString,
        minutesSpent: Number(row.minutes_spent),
        goalAchieved: Boolean(row.goal_achieved)
      };
    });

    const todayStr = clientDate || new Date().toISOString().split('T')[0] || '';

    // Streak logic
    let currentStreak = 0;
    let checkDate: Date | null = new Date();

    if (clientDate) {
      const parts = clientDate.split('-');
      if (parts.length === 3) {
        checkDate.setFullYear(parseInt(parts[0] || '2026'), parseInt(parts[1] || '1') - 1, parseInt(parts[2] || '1'));
      }
    }

    const formatToCheck = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayCheckStr = formatToCheck(checkDate);
    const yesterdayDate = new Date(checkDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayCheckStr = formatToCheck(yesterdayDate);

    if (progressMap[todayCheckStr]?.goalAchieved) {
      // Start checking from today
    } else if (progressMap[yesterdayCheckStr]?.goalAchieved) {
      // Check starting from yesterday (if today's goal isn't met yet)
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // No active streak
      checkDate = null;
    }

    if (checkDate) {
      while (true) {
        const checkStr = formatToCheck(checkDate);
        if (progressMap[checkStr]?.goalAchieved) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const minutesToday = progressMap[todayStr]?.minutesSpent || 0;

    // Fetch session details
    const sessionsRes = await pool.query(
      'SELECT * FROM sessions WHERE username = $1 ORDER BY timestamp DESC',
      [actualUsername]
    );

    const sessions: MathSession[] = sessionsRes.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
      durationSeconds: Number(row.duration_seconds),
      operation: row.operation,
      correctCount: Number(row.correct_count),
      totalQuestions: Number(row.total_questions),
      averageTimePerQuestionMs: Number(row.average_time_per_question_ms)
    }));

    const totalSessions = sessions.length;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTimeSec = 0;
    const accuracyByOperation: Record<string, { correct: number; total: number }> = {};

    sessions.forEach((s) => {
      totalQuestions += s.totalQuestions;
      totalCorrect += s.correctCount;
      totalTimeSec += s.durationSeconds;

      let opData = accuracyByOperation[s.operation];
      if (!opData) {
        opData = { correct: 0, total: 0 };
        accuracyByOperation[s.operation] = opData;
      }
      opData.correct += s.correctCount;
      opData.total += s.totalQuestions;
    });

    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalTimeMin = parseFloat((totalTimeSec / 60).toFixed(1));
    const averageSpeed = totalTimeSec > 0 ? (totalQuestions / (totalTimeSec / 60)) : 0;

    // Build last 7 days chart data
    const last7Days: { date: string; minutes: number; achieved: boolean }[] = [];
    const baseDate = clientDate ? new Date(clientDate) : new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dStr = formatToCheck(d);
      last7Days.push({
        date: dStr,
        minutes: progressMap[dStr]?.minutesSpent || 0,
        achieved: progressMap[dStr]?.goalAchieved || false,
      });
    }

    const operationsSummary = Object.keys(accuracyByOperation).map((op) => {
      const data = accuracyByOperation[op] || { correct: 0, total: 0 };
      return {
        operation: op,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        totalSolved: data.total,
      };
    });

    return {
      user: {
        name: actualUsername,
        dailyGoalMinutes: user.daily_goal_minutes,
        soundEnabled: user.sound_enabled
      },
      currentStreak,
      minutesToday,
      totalSessions,
      totalQuestions,
      totalCorrect,
      averageAccuracy: parseFloat(averageAccuracy.toFixed(1)),
      averageSpeed: parseFloat(averageSpeed.toFixed(1)),
      totalTimeMin,
      last7Days,
      operationsSummary,
      recentSessions: sessions.slice(0, 5)
    };
  }
}
