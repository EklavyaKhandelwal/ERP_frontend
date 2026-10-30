import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, ChevronRight, Download, Eye, FileText, LoaderCircle, RefreshCw, UserRound, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { accountApi, type EmployeeDocument, type EmployeeDocumentType } from '../../lib/api';
import { CardGridSkeleton, SectionSkeleton } from '../../components/feedback/LoadingSkeleton';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '12px',
  marginBottom: '4px',
};

const valueStyle: React.CSSProperties = {
  color: 'var(--text-main)',
  fontSize: '14px',
  fontWeight: '500',
  overflowWrap: 'anywhere',
};

const documentLabels: Record<EmployeeDocumentType, string> = {
  offer_letter: 'Offer letter',
  education_certificate: 'Education certificate',
  government_id: 'Government ID',
};

const readDocumentFile = (file: File, documentType: EmployeeDocumentType) => new Promise<{
  documentType: EmployeeDocumentType;
  fileName: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  data: string;
}>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error('Unable to read the selected document.'));
      return;
    }
    const separator = reader.result.indexOf(',');
    if (separator < 0) {
      reject(new Error('Unable to encode the selected document.'));
      return;
    }
    resolve({
      documentType,
      fileName: file.name,
      contentType: file.type as 'application/pdf' | 'image/jpeg' | 'image/png',
      data: reader.result.slice(separator + 1),
    });
  };
  reader.onerror = () => reject(new Error('Unable to read the selected document.'));
  reader.readAsDataURL(file);
});

export const MyProfileView: React.FC = () => {
  const { currentUser, employees, employeesLoading, updateProfileAvatar } = useERP();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const documentFileInput = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[] | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewRequestId = useRef(0);
  const [replaceDocumentType, setReplaceDocumentType] = useState<EmployeeDocumentType | null>(null);
  const [uploadingDocumentType, setUploadingDocumentType] = useState<EmployeeDocumentType | null>(null);
  const employee = employees.find(record => (
    record.email.toLowerCase() === currentUser.email.toLowerCase()
  ));

  useEffect(() => {
    if (currentUser.role !== 'employee') return;
    let active = true;
    void accountApi.listMyDocuments()
      .then(records => {
        if (active) setDocuments(records);
      })
      .catch(loadError => {
        if (active) {
          setDocuments([]);
          setDocumentsError(loadError instanceof Error ? loadError.message : 'Unable to load your documents.');
        }
      });
    return () => { active = false; };
  }, [currentUser.role, currentUser.id]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!documentPreviewUrl) return;
    return () => URL.revokeObjectURL(documentPreviewUrl);
  }, [documentPreviewUrl]);

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image that is 5 MB or smaller.');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const savePhoto = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateProfileAvatar(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update your profile photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadReplacementDocument = async (file?: File) => {
    const documentType = replaceDocumentType;
    if (!file || !documentType) return;
    setReplaceDocumentType(null);
    if (documentFileInput.current) documentFileInput.current.value = '';
    setDocumentsError(null);
    setDocumentSuccess(null);
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setDocumentsError('Choose a PDF, JPG, or PNG document.');
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setDocumentsError('Choose a document larger than 0 bytes and no larger than 5 MB.');
      return;
    }

    setUploadingDocumentType(documentType);
    try {
      const payload = await readDocumentFile(file, documentType);
      const result = await accountApi.replaceMyDocument(payload);
      setDocuments(previous => {
        const currentDocuments = previous ?? [];
        const alreadyListed = currentDocuments.some(document => document.documentType === documentType);
        return alreadyListed
          ? currentDocuments.map(document => document.documentType === documentType ? result.document : document)
          : [...currentDocuments, result.document];
      });
      setDocumentSuccess(`${documentLabels[documentType]} replaced successfully.`);
    } catch (uploadError) {
      setDocumentsError(uploadError instanceof Error ? uploadError.message : 'Unable to replace this document.');
    } finally {
      setUploadingDocumentType(null);
    }
  };

  const downloadDocument = async (document: EmployeeDocument) => {
    setDocumentsError(null);
    setDocumentSuccess(null);
    try {
      const blob = await accountApi.downloadMyDocument(document);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadError) {
      setDocumentsError(downloadError instanceof Error ? downloadError.message : 'Unable to download this document.');
    }
  };

  const openDocumentPreview = async (document: EmployeeDocument) => {
    const requestId = ++previewRequestId.current;
    setDocumentsError(null);
    setDocumentPreviewUrl(null);
    setPreviewDocument(document);
    setIsPreviewLoading(true);
    try {
      const blob = await accountApi.downloadMyDocument(document);
      const url = URL.createObjectURL(blob);
      if (previewRequestId.current === requestId) setDocumentPreviewUrl(url);
      else URL.revokeObjectURL(url);
    } catch (previewError) {
      if (previewRequestId.current === requestId) {
        setPreviewDocument(null);
        setDocumentsError(previewError instanceof Error ? previewError.message : 'Unable to preview this document.');
      }
    } finally {
      if (previewRequestId.current === requestId) setIsPreviewLoading(false);
    }
  };

  const closeDocumentPreview = () => {
    previewRequestId.current += 1;
    setPreviewDocument(null);
    setDocumentPreviewUrl(null);
    setIsPreviewLoading(false);
  };

  const fullName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : currentUser.name;
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not provided';
    const parsedDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsedDate.getTime())
      ? 'Not provided'
      : parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
        <div>
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Your profile, in one place</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            View your account and employment information, and update your profile photo.
          </p>
        </div>
        {!selectedFile ? (
          <button className="btn btn-primary" onClick={() => fileInput.current?.click()}>
            <Camera size={16} />
            Change photo
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setError(null);
              if (fileInput.current) fileInput.current.value = '';
            }} disabled={isSaving}>
              <X size={15} />
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => void savePhoto()} disabled={isSaving}>
              {isSaving ? <LoaderCircle size={15} /> : <Check size={15} />}
              {isSaving ? 'Saving…' : 'Save photo'}
            </button>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Choose a profile photo"
          style={{ display: 'none' }}
          onChange={event => choosePhoto(event.target.files?.[0])}
        />
      </div>

      {error && (
        <div role="alert" style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          color: 'var(--danger)',
          background: 'var(--danger-bg)',
        }}>
          {error}
        </div>
      )}

      <section className="interactive-lift-card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={previewUrl ?? currentUser.avatar}
            alt={`${fullName}'s profile`}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '18px',
              objectFit: 'cover',
              background: 'var(--bg-subtle)',
            }}
          />
          {selectedFile && (
            <span style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF',
              background: 'var(--primary)',
              border: '2px solid #FFFFFF',
            }}>
              <Camera size={13} />
            </span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '21px', margin: 0, fontWeight: '700' }}>{fullName}</h3>
            {employee?.status && (
              <span className="badge badge-success">
                <span className="badge-dot" />
                {employee.status}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {employee?.designation ?? currentUser.designation} · {employee?.department ?? currentUser.department}
          </p>
          {employee && (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '5px 0 0' }}>
              Employee ID: {employee.employeeCode}
            </p>
          )}
          {selectedFile && (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '5px 0 0' }}>
              Photo selected. Save to apply it to your account. PNG, JPEG, or WebP up to 5 MB.
            </p>
          )}
        </div>
      </section>

      {employeesLoading && !employee ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          <CardGridSkeleton count={1} minHeight={110} />
          <SectionSkeleton rows={5} />
        </div>
      ) : (
        <>
          <section className="interactive-lift-card" style={{ ...cardStyle, marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', margin: '0 0 20px', fontWeight: '700' }}>Personal &amp; contact information</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px 28px',
            }}>
              <div><p style={labelStyle}>Full name</p><p style={valueStyle}>{fullName}</p></div>
              <div><p style={labelStyle}>Work email</p><p style={valueStyle}>{currentUser.email}</p></div>
              <div><p style={labelStyle}>Mobile number</p><p style={valueStyle}>{employee?.phone || 'Not provided'}</p></div>
              <div><p style={labelStyle}>Date of birth</p><p style={valueStyle}>{formatDate(employee?.dateOfBirth)}</p></div>
              <div><p style={labelStyle}>Department</p><p style={valueStyle}>{employee?.department ?? currentUser.department}</p></div>
              <div><p style={labelStyle}>Job title</p><p style={valueStyle}>{employee?.designation ?? currentUser.designation}</p></div>
              <div><p style={labelStyle}>Work location</p><p style={valueStyle}>{employee?.location ?? 'Not provided'}</p></div>
              <div><p style={labelStyle}>Reporting manager</p><p style={valueStyle}>{employee?.manager || 'Not provided'}</p></div>
              <div><p style={labelStyle}>Start date</p><p style={valueStyle}>{formatDate(employee?.joinDate)}</p></div>
            </div>
          </section>

          <section className="interactive-lift-card" style={cardStyle}>
            <h3 style={{ fontSize: '15px', margin: '0 0 20px', fontWeight: '700' }}>Account information</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px 28px',
            }}>
              <div><p style={labelStyle}>Account type</p><p style={valueStyle}>{currentUser.role === 'admin' ? 'Administrator' : 'Employee'}</p></div>
              {currentUser.role === 'admin' && (
                <div><p style={labelStyle}>Access</p><p style={valueStyle}>{currentUser.isOwner ? 'Company owner' : 'HR administrator'}</p></div>
              )}
              <div><p style={labelStyle}>Onboarding</p><p style={valueStyle}>{currentUser.onboardingComplete ? 'Complete' : 'Pending'}</p></div>
              {!employee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <UserRound size={16} />
                  <span>No linked employee record</span>
                </div>
              )}
            </div>
          </section>
          {currentUser.role === 'employee' && (
            <section className="interactive-lift-card" style={{ ...cardStyle, marginTop: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '18px',
              }}>
                <div>
                  <h3 style={{ fontSize: '15px', margin: 0, fontWeight: '700' }}>My onboarding documents</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0', fontSize: '12px' }}>
                    Your documents are private. You can view, download, or replace each one.
                  </p>
                </div>
                <input
                  ref={documentFileInput}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  aria-label="Choose a replacement onboarding document"
                  style={{ display: 'none' }}
                  onChange={event => void uploadReplacementDocument(event.target.files?.[0])}
                />
              </div>

              {documentsError && (
                <div role="alert" style={{
                  padding: '10px 12px',
                  marginBottom: '14px',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  background: 'var(--danger-bg)',
                }}>
                  {documentsError}
                </div>
              )}
              {documentSuccess && (
                <div role="status" style={{
                  padding: '10px 12px',
                  marginBottom: '14px',
                  borderRadius: '8px',
                  color: 'var(--success)',
                  background: 'var(--success-bg)',
                }}>
                  {documentSuccess}
                </div>
              )}

              {documents === null ? (
                <SectionSkeleton rows={3} />
              ) : documents.length === 0 && !documentsError ? (
                <p style={{ color: 'var(--text-secondary)' }}>No onboarding documents were found on your account.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {(documents ?? []).map(document => (
                    <div key={document.id} className="interactive-lift-card" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      flexWrap: 'wrap',
                    }}>
                      <FileText size={20} color="var(--primary)" />
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <p style={{ ...valueStyle, margin: 0 }}>{documentLabels[document.documentType]}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '3px 0 0', overflowWrap: 'anywhere' }}>
                          {document.fileName} · Uploaded {formatDate(document.uploadedAt.toString().slice(0, 10))}
                        </p>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => void openDocumentPreview(document)}>
                        <Eye size={14} />
                        View
                        <ChevronRight className="arrow-lift-trigger" size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => void downloadDocument(document)}>
                        <Download size={14} />
                        Download
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={uploadingDocumentType !== null}
                        onClick={() => {
                          setReplaceDocumentType(document.documentType);
                          documentFileInput.current?.click();
                        }}
                      >
                        {uploadingDocumentType === document.documentType
                          ? <LoaderCircle size={14} />
                          : <RefreshCw size={14} />}
                        Replace
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '14px 0 0' }}>
                Accepted files: PDF, JPG, or PNG. Maximum 5 MB per document.
              </p>
            </section>
          )}
        </>
      )}
      {previewDocument && (
        <div
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeDocumentPreview();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: 'rgba(10, 11, 13, 0.56)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            style={{
              width: 'min(680px, 100%)',
              maxHeight: 'min(680px, 85vh)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <header style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <div style={{ minWidth: 0 }}>
                <h3 id="document-preview-title" style={{ fontSize: '15px', margin: 0 }}>
                  {documentLabels[previewDocument.documentType]}
                </h3>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  margin: '3px 0 0',
                  overflowWrap: 'anywhere',
                }}>
                  {previewDocument.fileName}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label="Close document preview"
                onClick={closeDocumentPreview}
              >
                <X size={16} />
              </button>
            </header>
            <div style={{
              minHeight: '300px',
              height: 'min(560px, 70vh)',
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
              overflow: 'auto',
              background: 'var(--bg-subtle)',
            }}>
              {isPreviewLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                  <LoaderCircle size={18} />
                  Loading secure preview…
                </div>
              ) : documentPreviewUrl && previewDocument.contentType.startsWith('image/') ? (
                <img
                  src={documentPreviewUrl}
                  alt={previewDocument.fileName}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
              ) : documentPreviewUrl && previewDocument.contentType === 'application/pdf' ? (
                <iframe
                  title={`Preview of ${previewDocument.fileName}`}
                  src={documentPreviewUrl}
                  style={{ width: '100%', height: '100%', minHeight: '400px', border: 0, background: '#FFFFFF' }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>This document type cannot be previewed.</p>
              )}
            </div>
            <footer style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '12px 18px',
              borderTop: '1px solid var(--border-light)',
            }}>
              <button className="btn btn-secondary" onClick={closeDocumentPreview}>Close preview</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
