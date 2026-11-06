import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types/erp';
import type { EmployeeInput } from '../../lib/api';
import { CountryStateLocationField } from '../forms/CountryStateLocationField';
import { getLocationCountryCode } from '../forms/locationCountries';
import { PhoneNumberField } from '../forms/PhoneNumberField';
import { EmployeeJoinDateField } from '../forms/EmployeeJoinDateField';

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
  const [skillsInput, setSkillsInput] = useState(() => employee?.skills.join(', ') ?? '');
  const [salaryInput, setSalaryInput] = useState(() => String(employee ? employee.salary ?? 0 : 110000));

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
      bankName: employee.bankName ?? '',
      bankAccountNumber: employee.bankAccountNumber ?? '',
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
      bankName: '',
      bankAccountNumber: '',
      location: '',
      status: 'Active',
      manager: '',
      skills: [],
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.joinDate) {
      setError('Select the employee join date.');
      return;
    }
    const salary = salaryInput.trim() === '' ? 0 : Number(salaryInput);
    if (!Number.isFinite(salary) || salary < 0) {
      setError('Enter a valid non-negative salary.');
      return;
    }
    setIsSubmitting(true);
    try {
      const input = {
        ...formData,
        salary,
        manager: employee?.manager ?? '',
        skills: skillsInput.split(/[,\s]+/).map(skill => skill.trim()).filter(Boolean),
      };
      if (employee) {
        const { avatar: _avatar, ...updates } = input;
        await updateEmployee(employee.id, updates);
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
      <div className="modal-content employee-form-modal">
        {/* Modal Header */}
        <div className="employee-form-header">
          <div>
            <h3 className="employee-form-title">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <p className="employee-form-subtitle">
              Add employee details. You can send their account setup link after saving.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close employee form"
            className="employee-form-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="employee-form-body">
          {error && (
            <div role="alert" className="employee-form-error">
              {error}
            </div>
          )}
          <section className="employee-form-section">
            <div className="employee-form-section-heading">
              <h4>Personal details</h4>
              <p>Basic contact information for the employee.</p>
            </div>
            <div className="employee-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="employee-first-name">First name *</label>
                <input
                  id="employee-first-name"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Liam"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employee-last-name">Last name *</label>
                <input
                  id="employee-last-name"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. O'Connor"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="employee-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="employee-email">Corporate email *</label>
                <input
                  id="employee-email"
                  type="email"
                  required
                  className="form-control"
                  placeholder="name@aavil.inc"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <PhoneNumberField
                label="Phone Number"
                value={formData.phone}
                defaultCountryCode={getLocationCountryCode(formData.location)}
                onChange={phone => setFormData(previous => ({ ...previous, phone }))}
              />
            </div>
          </section>

          <section className="employee-form-section">
            <div className="employee-form-section-heading">
              <h4>Work details</h4>
              <p>Set the employee’s role and start date.</p>
            </div>
            <div className="employee-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="employee-department">Department *</label>
                <select
                  id="employee-department"
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
                <label className="form-label" htmlFor="employee-designation">Designation *</label>
                <input
                  id="employee-designation"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Senior Cloud Architect"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>
            </div>

            <EmployeeJoinDateField
              value={formData.joinDate}
              onChange={joinDate => setFormData(previous => ({ ...previous, joinDate }))}
            />
          </section>

          <section className="employee-form-section">
            <div className="employee-form-section-heading">
              <h4>Payroll &amp; bank details</h4>
              <p>Salary and bank details are saved securely and used for payroll.</p>
            </div>
            <div className="employee-form-grid employee-form-grid-three">
              <div className="form-group">
                <label className="form-label" htmlFor="employee-salary">Monthly base salary (₹)</label>
                <input
                  id="employee-salary"
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={salaryInput}
                  onChange={e => setSalaryInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employee-bank-name">Bank name</label>
                <input
                  id="employee-bank-name"
                  type="text"
                  maxLength={120}
                  className="form-control"
                  placeholder="e.g. HDFC Bank"
                  value={formData.bankName ?? ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employee-bank-account">Bank account number</label>
                <input
                  id="employee-bank-account"
                  type="text"
                  maxLength={64}
                  autoComplete="off"
                  className="form-control"
                  placeholder="Enter account number"
                  value={formData.bankAccountNumber ?? ''}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="employee-form-section">
            <div className="employee-form-section-heading">
              <h4>Workplace &amp; skills</h4>
              <p>Add the employee’s location, status, and relevant skills.</p>
            </div>
            <div className="employee-form-grid">
              <CountryStateLocationField
                value={formData.location}
                onChange={location => setFormData(previous => ({ ...previous, location }))}
              />

              <div className="form-group">
                <label className="form-label" htmlFor="employee-status">Status</label>
                <select
                  id="employee-status"
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
              <label className="form-label" htmlFor="employee-skills">Skills</label>
              <input
                id="employee-skills"
                type="text"
                className="form-control"
                placeholder="e.g. React, TypeScript, communication"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
              />
              <span className="employee-form-hint">Separate skills with commas or spaces.</span>
            </div>
          </section>

          <div className="employee-form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Saving…' : employee ? 'Save Changes' : 'Save Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
