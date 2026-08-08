import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher' | 'faculty';
  mfaEnabled?: boolean;
  enrolledCourses: any[];
  successfulPayments?: any[];
  completedQuizzes: any[];
  certificates: any[];
  courseProgress?: {
    courseId: string;
    completedSubTopics: string[];
    quizScores: {
      topicTitle: string;
      subTopicTitle: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      answers: number[];
    }[];
    assignmentSubmissions: {
      topicTitle: string;
      subTopicTitle: string;
      assignmentTitle: string;
      submissionType: 'text' | 'file';
      textSubmission?: string;
      fileName?: string;
      status: 'pending' | 'graded';
      grade?: number;
      feedback?: string;
      submittedAt: string;
    }[];
  }[];
}

/** Password or registration details accepted, but no session yet: the emailed
 *  code still has to come back through verifyOtp. */
interface AuthStepResult {
  success: boolean;
  message?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  otpRequired?: boolean;
  otpToken?: string;
  email?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthStepResult>;
  mfaLogin: (mfaToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<AuthStepResult>;
  verifyOtp: (otpToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  resendOtp: (otpToken: string) => Promise<AuthStepResult>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        // Token is expired or invalid
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.mfaRequired) {
          return { success: false, mfaRequired: true, mfaToken: data.mfaToken };
        }
        if (data.otpRequired) {
          return { success: false, otpRequired: true, otpToken: data.otpToken, email: data.email, message: data.message };
        }
        localStorage.setItem('token', data.token);
        setToken(data.token);
        // Profile fetch is triggered by token effect
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const mfaLogin = async (mfaToken: string, code: string) => {
    try {
      const res = await fetch('/api/auth/mfa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Verification failed' };
    } catch (err) {
      return { success: false, message: 'Server communication error' };
    }
  };

  // No role argument: the server always creates a student and ignores anything
  // a client sends, so accepting one here would only imply otherwise.
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // The account is not created until the emailed code is confirmed, so
        // there is no token to store at this point.
        if (data.otpRequired) {
          return { success: false, otpRequired: true, otpToken: data.otpToken, email: data.email, message: data.message };
        }
        localStorage.setItem('token', data.token);
        setToken(data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server communication error' };
    }
  };

  // Final step of both sign-in and sign-up.
  const verifyOtp = async (otpToken: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken, code })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Verification failed' };
    } catch (err) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const resendOtp = async (otpToken: string): Promise<AuthStepResult> => {
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, otpToken: data.otpToken, email: data.email, message: data.message };
      }
      return { success: false, message: data.message || 'Could not send a new code' };
    } catch (err) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    mfaLogin,
    register,
    verifyOtp,
    resendOtp,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
