import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';

// Self-contained two-factor (TOTP) enrollment / disable panel for the dashboard.
export default function MfaSettings() {
  const { user, token, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [disarming, setDisarming] = useState(false);

  const enabled = !!user?.mfaEnabled;
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const post = async (path: string, body?: any) => {
    const res = await fetch(path, { method: 'POST', headers: auth, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  };

  const startSetup = async () => {
    setBusy(true); setMessage('');
    const { ok, data } = await post('/api/auth/mfa/setup');
    if (ok) { setSetupSecret(data.secret); setOtpauthUrl(data.otpauthUrl); }
    else setMessage(data.message || 'Could not start setup');
    setBusy(false);
  };

  const confirmEnable = async () => {
    setBusy(true); setMessage('');
    const { ok, data } = await post('/api/auth/mfa/verify', { code: code.trim() });
    if (ok) { setSetupSecret(''); setOtpauthUrl(''); setCode(''); await refreshProfile(); }
    else setMessage(data.message || 'Invalid code');
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true); setMessage('');
    const { ok, data } = await post('/api/auth/mfa/disable', { code: code.trim() });
    if (ok) { setDisarming(false); setCode(''); await refreshProfile(); }
    else setMessage(data.message || 'Invalid code');
    setBusy(false);
  };

  const copySecret = () => {
    navigator.clipboard?.writeText(setupSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const codeInput = (onSubmitLabel: string, onSubmit: () => void) => (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text" inputMode="numeric" value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="123456"
        className="w-32 h-9 px-3 rounded-lg text-center tracking-[0.3em] font-bold bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none focus:ring-1 focus:ring-brand-glowCyan"
      />
      <button
        onClick={onSubmit}
        disabled={busy || code.length < 6}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors disabled:opacity-50"
      >
        {busy ? 'Working…' : onSubmitLabel}
      </button>
    </div>
  );

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {enabled ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
        <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">Two-Factor Authentication</h3>
        <span className={`ml-auto text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-brand-darkBg'}`}>
          {enabled ? 'Enabled' : 'Off'}
        </span>
      </div>

      {message && <p className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan mb-3">{message}</p>}

      {/* ENABLED: offer disable (requires a current code) */}
      {enabled && (
        !disarming ? (
          <button onClick={() => { setDisarming(true); setMessage(''); }} className="text-xs font-bold text-red-500 hover:underline">
            Disable 2FA
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter a current code to turn 2FA off.</p>
            {codeInput('Disable', disable)}
          </div>
        )
      )}

      {/* DISABLED: enroll */}
      {!enabled && !setupSecret && (
        <button onClick={startSetup} disabled={busy} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors disabled:opacity-50">
          {busy ? 'Preparing…' : 'Enable 2FA'}
        </button>
      )}

      {!enabled && setupSecret && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Scan this QR code using Google Authenticator, Authy, or Microsoft Authenticator, then enter the 6-digit verification code below.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-brand-darkBg/60 border border-slate-200 dark:border-brand-darkBorder">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpauthUrl)}`}
                alt="2FA Setup QR Code"
                className="w-36 h-36 select-none"
              />
            </div>

            <div className="space-y-2 text-xs flex-grow w-full">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                1. Scan QR Code with Authenticator App
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Open Google Authenticator / Authy, tap <strong>"+"</strong> and select <strong>"Scan a QR code"</strong>.
              </p>

              <div className="pt-2 border-t border-slate-200 dark:border-brand-darkBorder/60">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Or enter secret key manually:
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-grow font-mono text-[11px] font-bold text-brand-deepBlue dark:text-brand-glowCyan px-2.5 py-1.5 rounded-lg bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder break-all">
                    {setupSecret}
                  </code>
                  <button onClick={copySecret} className="p-2 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan bg-white dark:bg-brand-darkCard" title="Copy secret key">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              2. Enter 6-Digit Authenticator Code
            </span>
            {codeInput('Confirm & Enable 2FA', confirmEnable)}
          </div>
        </div>
      )}
    </div>
  );
}
