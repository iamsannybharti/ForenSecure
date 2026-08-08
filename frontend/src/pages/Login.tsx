import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { LogoMark } from '../components/Logo';
import { Key, Mail, User } from 'lucide-react';

export default function Login() {
  const { login, mfaLogin, register, verifyOtp, resendOtp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Two-factor step: set once password succeeds and the account has MFA enabled.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // Email-code step: every sign-in and sign-up lands here before a session exists.
  const [otp, setOtp] = useState<{ token: string; email: string; purpose: 'signin' | 'signup' } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpNotice, setOtpNotice] = useState('');

  // Forgot-password step: swaps the form for a single email field.
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotNotice, setForgotNotice] = useState('');

  const goDest = () => navigate(searchParams.get('redirect') || '/dashboard');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const dest = searchParams.get('redirect') || '/dashboard';
      navigate(dest);
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    if (isLoginTab) {
      const res = await login(form.email, form.password);
      if (res.success) {
        goDest();
      } else if (res.mfaRequired && res.mfaToken) {
        setMfaToken(res.mfaToken);
      } else if (res.otpRequired && res.otpToken) {
        setOtp({ token: res.otpToken, email: res.email || form.email, purpose: 'signin' });
        setOtpNotice(res.message || '');
      } else {
        setErrorMessage(res.message || 'Login failed');
      }
    } else {
      if (!form.name) {
        setErrorMessage('Name is required for registration');
        setSubmitting(false);
        return;
      }
      const res = await register(form.name, form.email, form.password);
      if (res.success) {
        goDest();
      } else if (res.otpRequired && res.otpToken) {
        setOtp({ token: res.otpToken, email: res.email || form.email, purpose: 'signup' });
        setOtpNotice(res.message || '');
      } else {
        setErrorMessage(res.message || 'Registration failed');
      }
    }
    setSubmitting(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    const res = await verifyOtp(otp!.token, otpCode.trim());
    if (res.success) {
      goDest();
    } else {
      setErrorMessage(res.message || 'Verification failed');
      setOtpCode('');
    }
    setSubmitting(false);
  };

  // A resend replaces the challenge, so the page has to follow the new token —
  // the code in the older email stops working the moment this succeeds.
  const handleOtpResend = async () => {
    setErrorMessage('');
    setOtpNotice('');
    setSubmitting(true);
    const res = await resendOtp(otp!.token);
    if (res.success && res.otpToken) {
      setOtp({ ...otp!, token: res.otpToken });
      setOtpCode('');
      setOtpNotice(res.message || 'A new code is on its way.');
    } else {
      setErrorMessage(res.message || 'Could not send a new code');
    }
    setSubmitting(false);
  };

  const exitOtp = () => {
    setOtp(null);
    setOtpCode('');
    setOtpNotice('');
    setErrorMessage('');
  };

  // The API answers identically whether or not the address is registered, so the
  // UI shows that same neutral message rather than confirming an account exists.
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotNotice(data.message || 'If an account exists for that address, a reset link has been sent.');
      } else {
        setErrorMessage(data.message || 'Could not send the reset link');
      }
    } catch {
      setErrorMessage('Server communication error');
    }
    setSubmitting(false);
  };

  const exitForgot = () => {
    setForgotMode(false);
    setForgotNotice('');
    setErrorMessage('');
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    const res = await mfaLogin(mfaToken!, mfaCode.trim());
    if (res.success) {
      goDest();
    } else {
      setErrorMessage(res.message || 'Invalid authentication code');
    }
    setSubmitting(false);
  };

  return (
    <>
      <SEO 
        title={isLoginTab ? "Sign In to Portal" : "Student Registration"}
        description="Access ForenSecure's academic registry dashboard, complete assessment quizzes, and download verified digital certificates."
        canonicalPath="/login"
      />

      <div className="relative min-h-screen pt-12 pb-20 flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="absolute inset-0 digital-grid opacity-20 pointer-events-none"></div>

        <div className="w-full max-w-sm px-4 z-10">
          
          <div className="text-center mb-8">
            <LogoMark className="w-14 h-14 mx-auto mb-3 transition-transform duration-200 hover:scale-105" />
            <h1 className="text-xl font-bold heading-display text-brand-deepBlue dark:text-white leading-none">
              ForenSecure Registry
            </h1>
            <span className="text-[11px] text-slate-400 block mt-1 uppercase tracking-wider">
              Verify credentials • Complete courses
            </span>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-xl space-y-6">
            
            {/* Tab Swappers */}
            {!mfaToken && !otp && (
            <div className="flex rounded-lg bg-slate-100 dark:bg-brand-darkBg p-1">
              <button
                onClick={() => { setIsLoginTab(true); setErrorMessage(''); }}
                className={`flex-grow py-1.5 text-center text-xs font-semibold rounded-md transition-colors ${
                  isLoginTab 
                    ? 'bg-white dark:bg-brand-darkCard text-brand-deepBlue dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLoginTab(false); setErrorMessage(''); }}
                className={`flex-grow py-1.5 text-center text-xs font-semibold rounded-md transition-colors ${
                  !isLoginTab 
                    ? 'bg-white dark:bg-brand-darkCard text-brand-deepBlue dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>
            )}

            {errorMessage && (
              <p className="text-xs font-medium text-red-500 text-center">{errorMessage}</p>
            )}

            {otp && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otp-code" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Verification Code</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Enter the 6-digit code we sent to <span className="font-semibold text-brand-deepBlue dark:text-white break-all">{otp.email}</span>.
                  </p>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full h-11 px-3 rounded-lg text-center text-lg tracking-[0.4em] font-bold bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  />
                </div>

                {otpNotice && (
                  <p role="status" className="text-xs font-semibold leading-relaxed text-emerald-600 dark:text-emerald-400">
                    {otpNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || otpCode.length < 6}
                  className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan transition-all duration-300 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Verifying…' : otp.purpose === 'signup' ? 'Verify & Create Account' : 'Verify & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={handleOtpResend}
                  disabled={submitting}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-brand-glowCyan disabled:opacity-50"
                >
                  Didn't get it? Send a new code
                </button>
                <button
                  type="button"
                  onClick={exitOtp}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-brand-glowCyan"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {mfaToken && (
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <label htmlFor="mfa-code" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Authentication Code</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Enter the 6-digit code from your authenticator app.</p>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full h-11 px-3 rounded-lg text-center text-lg tracking-[0.4em] font-bold bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || mfaCode.length < 6}
                  className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan transition-all duration-300 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Verifying…' : 'Verify & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaToken(null); setMfaCode(''); setErrorMessage(''); }}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-brand-glowCyan"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {!mfaToken && !otp && forgotMode && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Enter the email address on your account and we'll send you a link to choose a new password.
                </p>

                <div>
                  <label htmlFor="forgot-email" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                    <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {forgotNotice && (
                  <p role="status" className="text-xs font-semibold leading-relaxed text-emerald-600 dark:text-emerald-400">
                    {forgotNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan transition-all duration-300 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
                <button
                  type="button"
                  onClick={exitForgot}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-brand-glowCyan"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {!mfaToken && !otp && !forgotMode && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginTab && (
                <div>
                  <label htmlFor="reg-name" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="reg-email" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  />
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  />
                  <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan transition-all duration-300 shadow-md disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : isLoginTab ? 'Sign In' : 'Register Account'}
              </button>

              {isLoginTab && (
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setErrorMessage(''); }}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-brand-glowCyan"
                >
                  Forgot your password?
                </button>
              )}
            </form>
            )}

          </div>

        </div>
      </div>
    </>
  );
}
