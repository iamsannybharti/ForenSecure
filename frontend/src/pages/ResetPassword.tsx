import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setValid(false);
      return;
    }

    // Verify token validity
    fetch('/api/auth/verify-magic-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setValid(true);
          setEmail(data.email);
          setName(data.name);
        }
        setVerifying(false);
      })
      .catch(() => {
        setValid(false);
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long for security compliance.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password setup complete! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrorMsg(data.message || 'Error setting password.');
      }
    } catch (err) {
      setErrorMsg('Server connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Setup Credentials" description="Initialize your secure registry password and enable account permissions." canonicalPath="/reset-password" />
      
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder p-8 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-glowCyan/5 pointer-events-none"></div>

          {valid ? (
            <div className="relative z-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-lg font-extrabold text-brand-deepBlue dark:text-white leading-tight">
                  Configure Setup Password
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Hi <strong>{name}</strong> ({email}), please establish a secure password to activate your LMS profile privileges.
                </p>
              </div>

              {errorMsg && <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded">{errorMsg}</div>}
              {message && <div className="p-3 bg-green-100 border border-green-200 text-green-700 text-xs rounded">{message}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 rounded-lg bg-brand-deepBlue text-white hover:bg-brand-glowBlue text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Setting up...' : 'Setup Credentials'}
                </button>
              </form>
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-extrabold text-brand-deepBlue dark:text-white leading-tight">
                Setup Link Invalid
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                This invitation magic link is invalid or has expired. Please contact your System Administrator to reissue a secure token.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-lg"
              >
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
