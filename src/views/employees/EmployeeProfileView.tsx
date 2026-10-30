import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Download,
  FileText,
  Mail, 
  Phone, 
  MapPin,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AddEmployeeModal } from '../../components/modals/AddEmployeeModal';
import { accountApi, employeesApi, type EmployeeDocument, type EmployeeProjectSummary } from '../../lib/api';
import { SectionSkeleton } from '../../components/feedback/LoadingSkeleton';
import { formatINR } from '../../lib/formatCurrency';

export const EmployeeProfileView: React.FC = () => {
  const { 
    selectedEmployeeId, 
    employees, 
    setCurrentView, 
    currentUser, 
    role,
    employeesLoading,
    projects,
    projectsLoading,
    projectsError,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'overview' | 'employment' | 'leaves' | 'projects'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [documentState, setDocumentState] = useState<{
    employeeId: string;
    documents: EmployeeDocument[];
    error: string | null;
  }>({ employeeId: '', documents: [], error: null });
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [directoryProjects, setDirectoryProjects] = useState<{
    employeeId: string;
    projects: EmployeeProjectSummary[];
    error: string | null;
  }>({ employeeId: '', projects: [], error: null });

  const employee = employees.find(e => e.id === selectedEmployeeId)
    ?? employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
  const employeeId = employee?.id;
  const isSelf = currentUser.email.toLowerCase() === employee?.email.toLowerCase();
  const assignedProjects = employee ? projects.filter(p => p.team.some(m => m.id === employee.id)) : [];
  const canViewPrivateDetails = role === 'admin' || isSelf;
  const assignedProjectSummaries: EmployeeProjectSummary[] = role === 'admin' || isSelf
    ? assignedProjects.map(project => ({
      id: project.id,
      name: project.name,
      code: project.code,
      status: project.status,
      progress: project.progress,
      deadline: project.deadline,
      role: project.team.find(member => member.id === employee?.id)?.role ?? 'Team Member',
    }))
    : directoryProjects.employeeId === employeeId ? directoryProjects.projects : [];

  useEffect(() => {
    if (!employeeId || role === 'admin' || isSelf) return;
    let active = true;
    void employeesApi.listProjects(employeeId).then(records => {
      if (active) setDirectoryProjects({ employeeId, projects: records, error: null });
    }).catch(error => {
      if (active) setDirectoryProjects({
        employeeId,
        projects: [],
        error: error instanceof Error ? error.message : 'Unable to load assigned projects.',
      });
    });
    return () => { active = false; };
  }, [employeeId, role, isSelf]);

  useEffect(() => {
    if (!employeeId || role !== 'admin') return;
    let active = true;
    void accountApi.listEmployeeDocuments(employeeId).then(result => {
      if (active) setDocumentState({ employeeId, documents: result, error: null });
    }).catch(error => {
      if (active) setDocumentState({
        employeeId,
        documents: [],
        error: error instanceof Error ? error.message : 'Unable to load employee documents.',
      });
    });
    return () => { active = false; };
  }, [employeeId, role]);

  if (!employee) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>
        {employeesLoading
          ? <SectionSkeleton rows={6} />
          : 'Employee profile not found or you do not have permission to view it.'}
      </div>
    );
  }

  const documents = documentState.employeeId === employee.id ? documentState.documents : [];
  const documentsError = documentState.employeeId === employee.id ? documentState.error : null;
  const documentsLoading = role === 'admin' && documentState.employeeId !== employee.id;

  const downloadDocument = async (document: EmployeeDocument) => {
    setDownloadingDocumentId(document.id);
    setDocumentState(previous => ({
      employeeId: employee.id,
      documents: previous.employeeId === employee.id ? previous.documents : [],
      error: null,
    }));
    try {
      const blob = await accountApi.downloadEmployeeDocument(employee.id, document);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDocumentState(previous => ({
        employeeId: employee.id,
        documents: previous.employeeId === employee.id ? previous.documents : [],
        error: error instanceof Error ? error.message : 'Unable to download this document.',
      }));
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentView('employees')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Employee Directory</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <img 
              src={employee.avatar} 
              alt={employee.firstName} 
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FFFFFF', boxShadow: 'var(--shadow-md)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="badge badge-success">
                  <span className="badge-dot" />
                  {employee.status}
                </span>
                {isSelf && (
                  <span className="badge badge-primary">You</span>
                )}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>
                {employee.designation} • <span style={{ color: '#0052FF' }}>{employee.department}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  <a href={`mailto:${employee.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{employee.email}</a>
                </span>
                {canViewPrivateDetails && employee.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={14} />
                    {employee.phone}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} />
                  {employee.location}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={`mailto:${employee.email}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Mail size={14} />
              <span>Send Email</span>
            </a>
            {role === 'admin' && (
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-primary btn-sm">
                <span>Edit Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-container" style={{ marginTop: '28px', marginBottom: 0 }}>
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Details
          </button>
          {canViewPrivateDetails && (
            <>
              <button
                className={`tab-btn ${activeTab === 'employment' ? 'active' : ''}`}
                onClick={() => setActiveTab('employment')}
              >
                Employment & Compensation
              </button>
              <button
                className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaves')}
              >
                Leave Allowances
              </button>
            </>
          )}
          <button 
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Assigned Projects ({assignedProjectSummaries.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
          {/* General Information */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
              Employee Personnel Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Employee Code</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{employee.employeeCode}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Join Date</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{employee.joinDate}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Direct Manager</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{employee.manager}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Work Authorization</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{employee.status}</div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Core Competencies & Skills</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {employee.skills.map(skill => (
                  <span key={skill} style={{ backgroundColor: '#F1F3F5', color: '#0A0B0D', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Work Snapshot */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
              Work Snapshot
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Department</span>
                <strong style={{ color: 'var(--text-main)' }}>{employee.department}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Projects</span>
                <strong style={{ color: 'var(--primary)' }}>{assignedProjectSummaries.filter(project => project.status === 'Active' || project.status === 'In Progress').length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Skills listed</span>
                <strong style={{ color: 'var(--text-main)' }}>{employee.skills.length}</strong>
              </div>
            </div>
          </div>
        </div>
        {role === 'admin' && (
          <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 16px' }}>
              Employee documents
            </h3>
            {documentsError && <p role="alert" style={{ color: '#CF202F', fontSize: '13px' }}>{documentsError}</p>}
            {documentsLoading && <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Loading documents…</p>}
            {!documentsLoading && !documentsError && documents.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No onboarding documents have been uploaded.</p>
            )}
            <div style={{ display: 'grid', gap: '10px' }}>
              {documents.map(document => (
                <div key={document.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <FileText size={18} color="#0052FF" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>{document.fileName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{document.documentType.replaceAll('_', ' ')}</div>
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={downloadingDocumentId === document.id} onClick={() => void downloadDocument(document)}>
                    <Download size={14} /> {downloadingDocumentId === document.id ? 'Downloading…' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
      )}

      {canViewPrivateDetails && activeTab === 'employment' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            Compensation & Payroll Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Base Salary</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                {employee.salary === undefined ? 'Not set' : formatINR(employee.salary)}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay Frequency</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                Monthly
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tax Configuration</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                Deductions entered manually
              </div>
            </div>
          </div>
        </div>
      )}

      {canViewPrivateDetails && activeTab === 'leaves' && employee.leaveBalance && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Annual Leave Available</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0052FF', marginTop: '6px' }}>
              {employee.leaveBalance.annual} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>/ {employee.leaveBalance.annualTotal} days</span>
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sick Leave Available</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#05B169', marginTop: '6px' }}>
              {employee.leaveBalance.sick} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>/ {employee.leaveBalance.sickTotal} days</span>
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Casual Leave Available</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#F4B000', marginTop: '6px' }}>
              {employee.leaveBalance.casual} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>/ {employee.leaveBalance.casualTotal} days</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            Assigned Enterprise Initiatives
          </h3>
          {(role === 'admin' || isSelf) && projectsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading assigned projects…</p>
          ) : (role === 'admin' || isSelf) && projectsError ? (
            <p role="alert" style={{ color: '#CF202F', fontSize: '13px' }}>{projectsError}</p>
          ) : role !== 'admin' && !isSelf && directoryProjects.employeeId !== employee.id ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading assigned projects…</p>
          ) : role !== 'admin' && !isSelf && directoryProjects.error ? (
            <p role="alert" style={{ color: '#CF202F', fontSize: '13px' }}>{directoryProjects.error}</p>
          ) : assignedProjectSummaries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No assigned projects.</p>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {assignedProjectSummaries.map(proj => (
              <div key={proj.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{proj.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {proj.code} · {proj.role}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-primary">{proj.progress}%</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Due: {proj.deadline}</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
      {role === 'admin' && (
        <AddEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={employee}
        />
      )}
    </div>
  );
};
