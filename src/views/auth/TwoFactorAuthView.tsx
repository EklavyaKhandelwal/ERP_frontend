import React, { useState, useRef } from 'react';
import { ShieldCheck, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const TwoFactorAuthView: React.FC = () => {
  const { setCurrentView, currentUser } = useERP();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setError(null);

    // Auto advance focus
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < 6) newDigits.push('');
      setDigits(newDigits);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 verification digits.');
      return;
    }

    setError('Two-factor authentication is not enabled yet.');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
        <button
          onClick={() => setCurrentView('login')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#5B616E',
            background: 'none',
            border: 'none',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </button>

        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          backgroundColor: '#E5EDFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0052FF',
          marginBottom: '20px'
        }}>
          <KeyRound size={26} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0A0B0D', letterSpacing: '-0.02em', margin: 0 }}>
          Two-Factor Authentication
        </h2>
        <p style={{ fontSize: '13.5px', color: '#5B616E', marginTop: '8px', lineHeight: '1.5' }}>
          An authentication code has been sent to your registered authenticator or corporate email ({currentUser.email}).
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#FEECEE',
            border: '1px solid #F7BAC0',
            borderRadius: '8px',
            color: '#CF202F',
            fontSize: '12.5px',
            marginTop: '20px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '28px' }}>
          {/* OTP Digit Inputs */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputsRef.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: '52px',
                  height: '56px',
                  fontSize: '22px',
                  fontWeight: '700',
                  textAlign: 'center',
                  borderRadius: '10px',
                  border: error ? '2px solid #CF202F' : '1px solid var(--border-default)',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  color: '#0A0B0D',
                  transition: 'all 0.15s ease'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0052FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 82, 255, 0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = error ? '#CF202F' : 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            ))}
          </div>

          <div style={{ marginBottom: '24px', fontSize: '13px', color: '#8A8F98' }}>
            Two-factor verification is not available yet.
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            <ShieldCheck size={16} />
            <span>Verify & Authenticate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
