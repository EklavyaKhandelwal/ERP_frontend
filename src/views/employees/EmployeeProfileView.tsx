import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AddEmployeeModal } from '../../components/modals/AddEmployeeModal';

export const EmployeeProfileView: React.FC = () => {
  const { 
    selectedEmployeeId, 
    employees, 
    setCurrentView, 
    currentUser, 
    role,
    employeesLoading,
    projects, 
    setFigmaOverlayAsset 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'overview' | 'employment' | 'leaves' | 'projects'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const employee = employees.find(e => e.id === selectedEmployeeId)
    ?? employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase());
  const assignedProjects = employee ? projects.filter(p => p.team.some(m => m.id === employee.id)) : [];

  if (!employee) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>
        {employeesLoading ? 'Loading employee profile…' : 'Employee profile not found or you do not have permission to view it.'}
      </div>
    );
  }

  const isSelf = currentUser.email.toLowerCase() === employee.email.toLowerCase();

  return (
    <div style={{ padding: '32px' }}>
      {/* Back & Spec Bar */}
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

        <button
          onClick={() => setFigmaOverlayAsset(
            isSelf 
              ? '/design-assets/Employees/Employee — My Profile.svg' 
              : '/design-assets/Employees/Employee — Profile.svg'
          )}
          className="btn btn-secondary btn-sm"
        >
          <Sparkles size={14} color="#0052FF" />
          <span>Compare Figma {isSelf ? 'My Profile' : 'Profile'} Spec</span>
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
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  {employee.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} />
                  {employee.phone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} />
                  {employee.location}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm">
              <Mail size={14} />
              <span>Send Email</span>
            </button>
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
          <button 
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Assigned Projects ({assignedProjects.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
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
                <div style={{ fontWeight: '600', marginTop: '2px' }}>Full-time Permanent (W-2)</div>
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

          {/* Quick Stats Summary */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
              Performance & Attendance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Attendance Record</span>
                <strong style={{ color: '#05B169' }}>98.4% (Spotless)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Latest Performance Rating</span>
                <strong style={{ color: '#0052FF' }}>4.8 / 5.0 (Exceeds)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Billable Utilization</span>
                <strong style={{ color: 'var(--text-main)' }}>86% Billable</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            Compensation & Payroll Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Annual Base Salary</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                ${employee.salary.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay Frequency</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                Bi-Monthly (Semi-monthly)
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tax Jurisdiction</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                United States (Federal + State)
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {assignedProjects.map(proj => (
              <div key={proj.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{proj.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {proj.code} • Client: {proj.client}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-primary">{proj.progress}%</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Due: {proj.deadline}</span>
                </div>
              </div>
            ))}
          </div>
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
