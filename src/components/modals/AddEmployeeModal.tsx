import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types/erp';
import type { EmployeeInput } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

export const AddEmployeeModal: React.FC<Props> = props => (
  props.isOpen ? <EmployeeFormModal key={props.employee?.id ?? 'new'} {...props} /> : null
);

const EmployeeFormModal: React.FC<Props> = ({ onClose, employee }) => {
  const { addEmployee, updateEmployee } = useERP();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EmployeeInput>(() => employee ? {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone ?? '',
      avatar: employee.avatar,
      role: employee.role,
      department: employee.department,
      designation: employee.designation,
      joinDate: employee.joinDate,
      salary: employee.salary ?? 0,
      location: employee.location,
      status: employee.status,
      manager: employee.manager,
      skills: employee.skills,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: '/favicon.svg',
      role: 'employee',
      department: 'Engineering',
      designation: '',
      joinDate: '',
      salary: 110000,
      location: 'San Francisco, CA',
      status: 'Active',
      manager: '',
      skills: ['React', 'TypeScript'],
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input = formData;
      if (employee) {
        await updateEmployee(employee.id, input);
      } else {
        await addEmployee(input);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Create an employee profile. You can issue a one-time login setup link after saving.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '8px', color: '#CF202F', backgroundColor: '#FEECEE', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input 
                type="text" 
                required
                className="form-control"
                placeholder="e.g. Liam"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input 
                type="text" 
                required
                className="form-control"
                placeholder="e.g. O'Connor"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Corporate Email</label>
              <input 
                type="email" 
                required
                className="form-control"
                placeholder="name@aavil.inc"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-control"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input 
                type="text" 
                required
                className="form-control"
                placeholder="e.g. Senior Cloud Architect"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Join Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.joinDate}
                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Manager</label>
              <input
                type="text"
                className="form-control"
                value={formData.manager}
                onChange={e => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Monthly Base Salary (₹)</label>
              <input 
                type="number" 
                className="form-control"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Employee['status'] })}
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills (comma separated)</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="React, Node.js, GraphQL, Docker"
              value={formData.skills.join(', ')}
              onChange={e => setFormData({ ...formData, skills: e.target.value.split(',').map(skill => skill.trim()).filter(Boolean) })}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                <UserPlus size={16} />
                <span>{isSubmitting ? 'Saving…' : employee ? 'Save Changes' : 'Save Employee'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
