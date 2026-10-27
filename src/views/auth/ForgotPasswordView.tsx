import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useERP } from '../../context/ERPContext';

export const ForgotPasswordView: React.FC = () => {
  const { setCurrentView, setFigmaOverlayAsset } = useERP();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to request a password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
        <button
          onClick={() => setCurrentView('login')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#5B616E', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500', marginBottom: '24px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </button>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#E5EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0052FF', marginBottom: '20px' }}>
          {submitted ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0A0B0D', letterSpacing: '-0.02em', margin: 0 }}>
          {submitted ? 'Check your email' : 'Reset your password'}
        </h2>
        {submitted ? (
          <p role="status" style={{ fontSize: '13.5px', color: '#5B616E', marginTop: '8px', lineHeight: '1.5' }}>
            If an active account matches that email, a password reset link will be sent shortly. The link expires after 60 minutes. If you do not receive it, contact an administrator.
          </p>
        ) : (
          <>
            <p style={{ fontSize: '13.5px', color: '#5B616E', marginTop: '8px', lineHeight: '1.5' }}>
              Enter your work email and, if it matches an active account, we’ll send you a one-time reset link.
            </p>
            <form onSubmit={submit} style={{ marginTop: '24px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Corporate email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="name@aavil.inc"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setFigmaOverlayAsset('/design-assets/Forgot Password.svg')}
            style={{ color: '#0052FF', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
          >
            Inspect Figma Spec ↗
          </button>
        </div>
      </div>
    </div>
  );
};
