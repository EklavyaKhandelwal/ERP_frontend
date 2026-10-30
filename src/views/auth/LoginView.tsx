import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const LoginView: React.FC = () => {
  const { login, authError, setCurrentView } = useERP();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) setErrorMessage(result.error ?? 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left Branded Panel (matching #0A0B0D in Figma Login — Default.svg) */}
      <div className="login-brand-panel" style={{
        width: '45%',
        minWidth: '480px',
        backgroundColor: '#0A0B0D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Background Glow & Pattern */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '-150px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 82, 255, 0.25) 0%, rgba(10, 11, 13, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0052FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '20px',
            boxShadow: '0 8px 24px rgba(0, 82, 255, 0.4)'
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>AAVIL Inc</div>
            <div style={{ fontSize: '12px', color: '#8A8F98' }}>Enterprise Operations</div>
          </div>
        </div>

        {/* Hero Narrative */}
        <div className="login-hero" style={{ zIndex: 2, maxWidth: '620px', margin: '40px 0', width: '100%' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '400', lineHeight: '1.14', letterSpacing: '-0.025em', marginBottom: '18px' }}>
            Streamline your<br />workforce<br />operations
          </h2>
          <p style={{ fontSize: '15px', color: '#8A8F98', lineHeight: '1.6', maxWidth: '580px' }}>
            Manage employees, projects, payroll, and more · all in one platform.
          </p>

          <svg
            className="login-workforce-art"
            viewBox="0 0 620 440"
            role="img"
            aria-label="Illustration of workforce, projects, and employee management cards"
          >
            <circle cx="310" cy="220" r="180" fill="#111319" />
            <rect x="28" y="94" width="290" height="154" rx="20" fill="#17191D" stroke="#262930" strokeWidth="2" />
            <rect x="58" y="122" width="100" height="9" rx="4.5" fill="#626875" />
            <rect x="58" y="149" width="88" height="24" rx="6" fill="#FFFFFF" />
            <rect x="58" y="188" width="78" height="7" rx="3.5" fill="#00B875" />
            <rect x="202" y="212" width="18" height="36" rx="5" fill="#2A2D34" />
            <rect x="231" y="188" width="18" height="60" rx="5" fill="#2A2D34" />
            <rect x="260" y="160" width="18" height="88" rx="5" fill="#0757FF" />
            <rect x="289" y="201" width="18" height="47" rx="5" fill="#2A2D34" />

            <rect x="404" y="70" width="166" height="112" rx="20" fill="#17191D" stroke="#262930" strokeWidth="2" />
            <rect x="429" y="94" width="64" height="8" rx="4" fill="#626875" />
            <g fill="#292C33">
              <rect x="430" y="119" width="18" height="18" rx="4" />
              <rect x="456" y="119" width="18" height="18" rx="4" />
              <rect x="482" y="119" width="18" height="18" rx="4" />
              <rect x="508" y="119" width="18" height="18" rx="4" />
              <rect x="534" y="119" width="18" height="18" rx="4" />
              <rect x="430" y="145" width="18" height="18" rx="4" />
              <rect x="456" y="145" width="18" height="18" rx="4" />
              <rect x="482" y="145" width="18" height="18" rx="4" />
              <rect x="508" y="145" width="18" height="18" rx="4" />
              <rect x="534" y="145" width="18" height="18" rx="4" />
            </g>
            <rect x="482" y="119" width="18" height="18" rx="4" fill="#0757FF" />
            <rect x="508" y="145" width="18" height="18" rx="4" fill="#12429C" />

            <rect x="64" y="292" width="176" height="66" rx="33" fill="#0757FF" />
            <circle cx="98" cy="325" r="17" fill="#367BFF" />
            <path d="m90 325 6 6 11-12" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="122" y="319" width="82" height="10" rx="5" fill="#FFFFFF" />

            <rect x="248" y="238" width="322" height="170" rx="20" fill="#17191D" stroke="#262930" strokeWidth="2" />
            <rect x="278" y="264" width="130" height="8" rx="4" fill="#626875" />
            <circle cx="300" cy="310" r="17" fill="#10245A" />
            <circle cx="300" cy="306" r="6" fill="#0757FF" />
            <path d="M288 319c2-7 7-10 12-10s10 3 12 10" fill="#0757FF" />
            <rect x="330" y="302" width="102" height="8" rx="4" fill="#E8E9EB" />
            <rect x="330" y="318" width="72" height="7" rx="3.5" fill="#626875" />
            <rect x="454" y="296" width="88" height="24" rx="12" fill="#073E2D" />
            <rect x="472" y="305" width="52" height="7" rx="3.5" fill="#00B875" />
            <circle cx="300" cy="360" r="17" fill="#4B390A" />
            <circle cx="300" cy="356" r="6" fill="#FFB800" />
            <path d="M288 369c2-7 7-10 12-10s10 3 12 10" fill="#FFB800" />
            <rect x="330" y="352" width="88" height="8" rx="4" fill="#E8E9EB" />
            <rect x="330" y="368" width="72" height="7" rx="3.5" fill="#626875" />
            <rect x="454" y="346" width="88" height="24" rx="12" fill="#453507" />
            <rect x="472" y="355" width="52" height="7" rx="3.5" fill="#FFB800" />
          </svg>
        </div>

        {/* Footer info */}
        <div className="login-brand-footer" style={{ zIndex: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', fontSize: '12px', color: '#5B616E' }}>
          <span>Product by AAV Innovation Inc.</span>
        </div>
      </div>

      {/* Right Login Container (White canvas) */}
      <div className="login-form-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        backgroundColor: '#FFFFFF'
      }}>
        <div className="login-form-content" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0A0B0D', letterSpacing: '-0.02em', margin: 0 }}>
              Sign in
            </h2>
            <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '6px' }}>
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          {/* Error Banner (matching Figma Login — Error.svg) */}
          {(errorMessage || authError) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#FEECEE',
              border: '1px solid #F7BAC0',
              borderRadius: '8px',
              color: '#CF202F',
              fontSize: '13px',
              marginBottom: '20px',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage ?? authError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                <input 
                  id="login-email"
                  type="email" 
                  required
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    borderColor: errorMessage ? '#CF202F' : undefined
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    borderColor: errorMessage ? '#CF202F' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: '#8A8F98',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setCurrentView('forgot-password')}
                style={{ color: '#0052FF', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '600', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <input 
                type="checkbox" 
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0052FF', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '13px', color: '#5B616E', cursor: 'pointer', userSelect: 'none' }}>
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14.5px',
                fontWeight: '600'
              }}
            >
              <span>{isSubmitting ? 'Signing In…' : 'Sign In to AAVIL ERP'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
