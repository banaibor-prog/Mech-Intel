import { FormEvent, useState } from 'react';
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Logo } from '../components/ui';

function friendly(code: string) {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email or password is incorrect.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.';
  if (code.includes('popup-closed')) return 'Sign-in window was closed.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  return 'Could not sign in. Please try again.';
}

export default function Login({ denied }: { denied?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      setError(friendly(String((err as { code?: string }).code ?? err)));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: unknown) {
      setError(friendly(String((err as { code?: string }).code ?? err)));
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      setError('Enter your email first, then choose "Forgot password".');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(`Password reset link sent to ${email.trim()}.`);
      setError(null);
    } catch (err: unknown) {
      setError(friendly(String((err as { code?: string }).code ?? err)));
    }
  };

  return (
    <div className="login">
      <div className="login-art">
        <div className="row">
          <Logo size={44} />
          <div>
            <div className="brand-name">Got You Covered</div>
            <div className="brand-sub">Admin console</div>
          </div>
        </div>
        <div>
          <h2>Keep Meghalaya's local work network safe and running.</h2>
          <p>Review reports, manage members and jobs, and control app-wide settings.</p>
        </div>
        <svg className="contours" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
          {[0, 12, 24, 36, 48, 60].map((d, i) => (
            <path key={d} d={`M-10 ${40 + d} C 60 ${20 + d}, 120 ${70 + d}, 200 ${45 + d} S 330 ${25 + d}, 410 ${50 + d}`} fill="none" stroke="#fff" strokeOpacity={0.05 + i * 0.015} />
          ))}
        </svg>
      </div>
      <div className="login-form">
        <div className="login-card">
          {denied ? (
            <>
              <h1>No admin access</h1>
              <p className="sub">
                {auth.currentUser?.email} isn't an admin. Ask an existing admin to grant access from Users, then sign in again.
              </p>
              <button className="btn btn-dark btn-block" onClick={() => signOut(auth)}>
                Sign in with another account
              </button>
            </>
          ) : (
            <form onSubmit={submit}>
              <h1>Sign in</h1>
              <p className="sub">Use your Got You Covered admin account.</p>
              <label className="field">
                <span>Email</span>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <button className="btn btn-dark btn-block" style={{ marginTop: 20, height: 44 }} disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              <div className="row-between" style={{ marginTop: 10 }}>
                <span />
                <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                  Forgot password
                </button>
              </div>
              <div className="or">or</div>
              <button type="button" className="btn btn-outline btn-block" style={{ height: 44 }} onClick={google}>
                Continue with Google
              </button>
              {error ? <div className="notice notice-danger login-error">{error}</div> : null}
              {info ? <div className="notice notice-info login-error">{info}</div> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
