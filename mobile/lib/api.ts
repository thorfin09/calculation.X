import { Platform } from 'react-native';

// NOTE: Set this to your deployed Vercel URL, or if testing locally, 
// use your computer's local IP address (e.g., http://192.168.1.50:3000).
// 'localhost' or '127.0.0.1' will NOT work when running Expo on physical mobile devices.
const BACKEND_URL = 'https://calculation-x-web.vercel.app'; 

// Fetch wrapper that handles timeouts and prints debug logs
async function request(path: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${path}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);

  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal
    });
    
    clearTimeout(id);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please check if the server is running.');
    }
    console.error(`API Request failed on [${url}]:`, error);
    throw error;
  }
}

export const API = {
  // Check credentials on Next.js backend
  async login(loginInput: string, passwordAttempt: string) {
    return request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        loginInput,
        password: passwordAttempt
      })
    });
  },

  // Register new account on Next.js backend
  async signup(username: string, email: string, phone: string, passwordAttempt: string) {
    return request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'signup',
        username,
        email,
        phone,
        password: passwordAttempt
      })
    });
  },

  // Fetch stats for streaks, graphs, solved metrics
  async getDashboardStats(username: string) {
    const localDate = new Date().toLocaleDateString('sv-SE'); // Swedish YYYY-MM-DD
    return request(`/api/dashboard?localDate=${localDate}`, {
      method: 'GET',
      headers: {
        'x-user-username': username
      }
    });
  },

  // Post completed workout session
  async addSession(username: string, sessionData: {
    durationSeconds: number;
    operation: string;
    correctCount: number;
    totalQuestions: number;
    averageTimePerQuestionMs: number;
    mistakes: any[];
  }) {
    const localDate = new Date().toLocaleDateString('sv-SE');
    return request('/api/session', {
      method: 'POST',
      headers: {
        'x-user-username': username
      },
      body: JSON.stringify({
        ...sessionData,
        localDate
      })
    });
  },

  // Get saved mistakes
  async getMistakes(username: string) {
    return request('/api/mistakes', {
      method: 'GET',
      headers: {
        'x-user-username': username
      }
    });
  },

  // Delete corrected mistake
  async removeMistake(username: string, id: string) {
    return request(`/api/mistakes?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-username': username
      }
    });
  },

  // Delete all mistakes
  async clearMistakes(username: string) {
    return request('/api/mistakes', {
      method: 'DELETE',
      headers: {
        'x-user-username': username
      }
    });
  },

  // Get user settings
  async getUserSettings(username: string) {
    return request('/api/settings', {
      method: 'GET',
      headers: {
        'x-user-username': username
      }
    });
  },

  // Save settings (daily goal minutes, sound toggles)
  async updateUserSettings(username: string, settings: {
    name?: string;
    dailyGoalMinutes?: number;
    soundEnabled?: boolean;
  }) {
    return request('/api/settings', {
      method: 'POST',
      headers: {
        'x-user-username': username
      },
      body: JSON.stringify(settings)
    });
  }
};
