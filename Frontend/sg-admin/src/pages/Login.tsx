import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verify2faLogin } from '../lib/admin-api';
import { loginWithResult, saveSession } from '../lib/auth';
import { Icon } from '../lib/icons';

export function Login() {
  const navigate = useNavigate();

  // Step 1 — email + password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  // Step 2 — 2FA
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // ── Step 1: submit email + password ──────────────────────────────────────
  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await loginWithResult(email, password);
    setBusy(false);

    if (result.type === 'success') {
      navigate('/dashboard');
    } else if (result.type === '2fa_required') {
      setTempToken(result.tempToken);
      setStep('2fa');
    } else {
      setError(result.message ?? 'Invalid email or password. Please try again.');
    }
  };

  // ── Step 2: submit 2FA code ───────────────────────────────────────────────
  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Enter the 6-digit code from your authenticator app'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await verify2faLogin({ tempToken, code });
      saveSession(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code — try again');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">SG</div>
          <span className="text-base font-bold text-gray-900">SG Pro Growth</span>
        </div>
        <a href="https://sharvaconsulting.com/register" className="text-sm font-semibold text-brand-600 hover:underline">
          Back to registration
        </a>
      </header>

      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full"
        >
          {step === 'credentials' ? (
            <>
              <h1 className="text-center text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-2 text-center text-sm text-gray-500">Log in to the admin portal.</p>

              <form onSubmit={submitCredentials} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Email Address</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Icon name={show ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>

                {error && <p className="alert-warn px-3 py-2 text-sm font-medium">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Icon name={busy ? 'refresh' : 'logout'} size={16} className={busy ? 'animate-spin' : 'rotate-180'} />
                  {busy ? 'Signing in…' : 'Log In'}
                </motion.button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                  <Icon name="shield" size={28} className="text-brand-600" />
                </div>
                <h1 className="text-center text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
                <p className="text-center text-sm text-gray-500">
                  Open <strong>Google Authenticator</strong> or <strong>Authy</strong> and enter the 6-digit code for SG Pro Growth.
                </p>
              </div>

              <form onSubmit={submitCode} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Authentication Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className={`${inputCls} text-center font-mono text-2xl tracking-[0.5em]`}
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                {error && <p className="alert-warn px-3 py-2 text-sm font-medium">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="btn-primary w-full gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Icon name={busy ? 'refresh' : 'check-circle'} size={16} className={busy ? 'animate-spin' : ''} />
                  {busy ? 'Verifying…' : 'Verify'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
            <Icon name="lock" size={12} />
            Secure admin access · authorized personnel only
          </p>
        </motion.div>
      </div>
    </div>
  );
}
