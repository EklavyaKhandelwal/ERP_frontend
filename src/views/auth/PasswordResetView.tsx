import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { authApi } from '../../lib/api';

export const PasswordResetView: React.FC = () => {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, document.title, '/account/password-reset');
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('This reset link is missing its token. Request a new password reset link.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#F8F9FA', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#E5EDFF', display: 'grid', placeItems: 'center', color: '#0052FF', marginBottom: '20px' }}>
          {complete ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0A0B0D', margin: 0 }}>
          {complete ? 'Password reset' : 'Choose a new password'}
        </h1>
        {complete ? (
          <div>
            <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '10px', lineHeight: 1.5 }}>
              Your password has been updated and your existing sessions have been signed out.
            </p>
            <a href="/" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', textDecoration: 'none' }}>
              Go to sign in
            </a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '10px', lineHeight: 1.5 }}>
              Choose a password with at least 12 characters. This one-time link expires after 60 minutes.
            </p>
            <form onSubmit={submit} style={{ marginTop: '24px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={72}
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={72}
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {isSubmitting ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
