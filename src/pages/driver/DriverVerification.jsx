import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  User,
  Phone,
  FileCheck,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AMBULANCE_TYPES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';

export const DriverVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerDriver, loading } = useAuth();

  const initialPhone = location.state?.phone || '';

  const [formData, setFormData] = useState({
    fullName: '',
    phone: initialPhone,
    licenseNumber: '',
    ambulanceNumber: '',
    ambulanceType: AMBULANCE_TYPES[0].value,
    hospitalAffiliation: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedVal = value;

    if (name === 'phone') {
      formattedVal = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'licenseNumber' || name === 'ambulanceNumber') {
      formattedVal = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [name]: formattedVal }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFillDemo = () => {
    setFormData({
      fullName: 'Vikram Sundaram',
      phone: formData.phone || '9876501234',
      licenseNumber: 'KA01 2021008899',
      ambulanceNumber: 'KA-01-EA-9988',
      ambulanceType: 'Advanced Life Support (ALS)',
      hospitalAffiliation: 'Manipal Trauma Care Hospital',
    });
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!formData.phone || formData.phone.length !== 10) {
      errs.phone = 'Valid 10-digit mobile number required.';
    }
    if (!formData.licenseNumber.trim()) {
      errs.licenseNumber = 'Commercial driving license number required.';
    }
    if (!formData.ambulanceNumber.trim()) {
      errs.ambulanceNumber = 'Vehicle registration plate number required.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const newDriver = await registerDriver({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        ambulanceNumber: formData.ambulanceNumber.trim(),
        ambulanceType: formData.ambulanceType,
        hospitalAffiliation: formData.hospitalAffiliation.trim() || 'General Emergency Dispatch',
      });

      setSuccessMsg(`Driver verification successful! Welcome ${newDriver.fullName}. Redirecting to dispatch dashboard...`);
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 700);
    } catch (err) {
      setServerError(err.message || 'Driver registration failed. Please review your credentials.');
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '620px',
        margin: '1rem auto 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Back Link */}
      <Link
        to="/driver/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.875rem',
          color: 'var(--slate-400)',
          fontWeight: 600,
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        Back to Driver Login
      </Link>

      {/* Verification Card */}
      <Card
        variant="emergency"
        style={{
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <ShieldCheck size={30} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Badge variant="red" size="sm">
              New Driver Onboarding
            </Badge>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Ambulance Driver Verification
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginTop: '4px' }}>
            Register your commercial credentials to receive live emergency dispatch dispatches
          </p>
        </div>

        {/* Feedback Messages */}
        {serverError && (
          <Toast
            type="error"
            message={serverError}
            onClose={() => setServerError('')}
          />
        )}

        {successMsg && (
          <Toast
            type="success"
            message={successMsg}
          />
        )}

        {/* Demo Auto-fill Helper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(11, 18, 32, 0.7)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
            Need quick demo test data?
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Sparkles}
            onClick={handleFillDemo}
            style={{ color: '#38bdf8' }}
          >
            Auto-fill Credentials
          </Button>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <Input
              id="fullName"
              name="fullName"
              label="Driver Full Name"
              placeholder="e.g. Ramesh Kumar"
              icon={User}
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
            />

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Registered Mobile Number"
              placeholder="9876543210"
              prefix="+91"
              icon={Phone}
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              maxLength={10}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              label="Commercial Driving License"
              placeholder="e.g. KA01 2018001234"
              icon={FileCheck}
              value={formData.licenseNumber}
              onChange={handleChange}
              error={errors.licenseNumber}
              required
            />

            <Input
              id="ambulanceNumber"
              name="ambulanceNumber"
              label="Ambulance Plate / RC Number"
              placeholder="e.g. KA-01-EA-1088"
              icon={Truck}
              value={formData.ambulanceNumber}
              onChange={handleChange}
              error={errors.ambulanceNumber}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <Select
              id="ambulanceType"
              name="ambulanceType"
              label="Ambulance Capability / Type"
              options={AMBULANCE_TYPES}
              value={formData.ambulanceType}
              onChange={handleChange}
              icon={Truck}
              required
            />

            <Input
              id="hospitalAffiliation"
              name="hospitalAffiliation"
              label="Base Hospital / Trauma Center"
              placeholder="e.g. Apollo Hospital, Manipal"
              icon={Building2}
              value={formData.hospitalAffiliation}
              onChange={handleChange}
              helperText="Optional base station reference"
            />
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <Button
              type="submit"
              variant="emergency"
              size="lg"
              fullWidth
              iconRight={ArrowRight}
              loading={loading}
            >
              Complete Verification & Enter Dashboard
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DriverVerification;
