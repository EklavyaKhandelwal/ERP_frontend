import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Lock, ShieldCheck, Upload } from 'lucide-react';
import { accountApi, type EmployeeDocumentType, type EmployeeOnboardingDocument } from '../../lib/api';

const documentFields: { type: EmployeeDocumentType; label: string }[] = [
  { type: 'offer_letter', label: 'Offer letter' },
  { type: 'education_certificate', label: 'Educational certificates' },
  { type: 'government_id', label: 'Government ID proof' },
];
const latestDateOfBirth = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getContentType = (file: File): EmployeeOnboardingDocument['contentType'] | null => {
  if (file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/png') return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  return null;
};

const encodeFile = async (documentType: EmployeeDocumentType, file: File): Promise<EmployeeOnboardingDocument> => {
  const contentType = getContentType(file);
  if (!contentType) throw new Error(`${file.name}: upload a PDF, JPG, or PNG file.`);
  if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: each document must be no larger than 5 MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return { documentType, fileName: file.name, contentType, data: btoa(binary) };
};

export const AccountSetupView: React.FC<{
  adminInvite?: boolean;
  employeeOnboarding?: boolean;
}> = ({ adminInvite = false, employeeOnboarding = false }) => {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [files, setFiles] = useState<Partial<Record<EmployeeDocumentType, File>>>({});
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const needsEmployeeDetails = !adminInvite;

  useEffect(() => {
    if (!employeeOnboarding) {
      window.history.replaceState({}, document.title, adminInvite ? '/account/admin-setup' : '/account/setup');
    }
  }, [adminInvite, employeeOnboarding]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!employeeOnboarding && !token) {
      setError('This access link is missing its token. Ask an administrator for a new link.');
      return;
    }
    if (needsEmployeeDetails && (!fullName.trim() || !dateOfBirth || !phone.trim())) {
      setError('Complete your name, date of birth, and contact number.');
      return;
    }
    if (needsEmployeeDetails && documentFields.some(({ type }) => !files[type])) {
      setError('Upload all three required documents to continue.');
      return;
    }
    if (!employeeOnboarding && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (adminInvite) {
        await accountApi.completeAdminSetup(token, password);
      } else {
        const documents = await Promise.all(documentFields.map(({ type }) => encodeFile(type, files[type]!)));
        const profile = { fullName, dateOfBirth, phone, documents };
        if (employeeOnboarding) await accountApi.submitEmployeeOnboarding(profile);
        else await accountApi.completeSetup(token, password, profile);
      }
      setComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save your account details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = complete
    ? (adminInvite ? 'Password set' : 'Onboarding complete')
    : adminInvite
      ? 'Set up your HR admin account'
      : employeeOnboarding
        ? 'Complete your employee profile'
        : 'Set up your employee account';

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#F8F9FA', padding: '24px' }}>
      <div className="card" style={{ maxWidth: needsEmployeeDetails ? '680px' : '460px', width: '100%', padding: 'clamp(24px, 5vw, 40px)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#E5EDFF', display: 'grid', placeItems: 'center', color: '#0052FF', marginBottom: '20px' }}>
          {complete ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0A0B0D', margin: 0 }}>{title}</h1>
        {complete ? (
          <div>
            <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '10px', lineHeight: 1.5 }}>
              {adminInvite
                ? 'Your password has been saved. Sign in using your work email and new password.'
                : 'Your profile and documents are securely saved. Sign in using your work email to continue.'}
            </p>
            <a href="/" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', textDecoration: 'none' }}>
              Continue to sign in
            </a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#5B616E', marginTop: '10px', lineHeight: 1.5 }}>
              {employeeOnboarding
                ? 'Complete every required field and upload your documents before you can access the AAVIL dashboard.'
                : `This one-time ${adminInvite ? 'invitation' : 'access'} link expires after 24 hours.`}
            </p>
            <form onSubmit={submit} style={{ marginTop: '24px' }}>
              {needsEmployeeDetails && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="full-name">Full name *</label>
                      <input id="full-name" className="form-control" autoComplete="name" required maxLength={200} value={fullName} onChange={event => setFullName(event.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="date-of-birth">Date of birth *</label>
                      <input id="date-of-birth" type="date" className="form-control" required max={latestDateOfBirth} value={dateOfBirth} onChange={event => setDateOfBirth(event.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-number">Contact number *</label>
                    <input id="contact-number" type="tel" className="form-control" autoComplete="tel" required maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} />
                  </div>
                  <div style={{ margin: '22px 0 16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: 'var(--text-main)' }}>Required documents</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>PDF, JPG, or PNG; maximum 5 MB each and 15 MB total.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {documentFields.map(({ type, label }) => (
                      <label key={type} className="card" style={{ display: 'grid', gap: '8px', padding: '14px', border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                          {files[type] ? <FileText size={16} color="#05B169" /> : <Upload size={16} color="#0052FF" />}
                          {label} *
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {files[type]?.name ?? 'Choose a file'}
                        </span>
                        <input
                          type="file"
                          required
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                          onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) setFiles(previous => ({ ...previous, [type]: file }));
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}
              {!employeeOnboarding && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">New password *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                      <input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="form-control" style={{ paddingLeft: '38px' }} value={password} onChange={event => setPassword(event.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">Confirm password *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A8F98' }} />
                      <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="form-control" style={{ paddingLeft: '38px' }} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
                    </div>
                  </div>
                </>
              )}
              {error && <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitting || (!employeeOnboarding && !token)} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {isSubmitting ? 'Saving…' : employeeOnboarding ? 'Save details and continue' : adminInvite ? 'Set password' : 'Save details and set password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
