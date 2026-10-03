import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, ArrowLeft, ShieldCheck, HeartPulse, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService, DEMO_COMMON_USERS } from '../../services/authService';
import { isValidPhoneNumber } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';

export const CommonLogin = () => {
  const navigate = useNavigate();
  const { loginCommon, loading } = useAuth();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(rawVal);
    if (error) setError('');
  };

  const handleQuickDemoSelect = (demoUser) => {
    setPhone(demoUser.phone);
    setName(demoUser.name);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!isValidPhoneNumber(cleanPhone)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    try {
      const result = await loginCommon(cleanPhone, name.trim() || 'Citizen User');
      if (result.success) {
        setSuccessMessage(`Welcome back, ${result.user.name}! Redirecting to dashboard...`);
        setTimeout(() => {
          navigate('/common/dashboard');
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please try again.');
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '480px',
        margin: '1.5rem auto 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Back Link */}
      <Link
        to="/"
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
        Back to Role Selection
      </Link>

      {/* Login Card */}
      <Card
        variant="primary"
        style={{
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(37, 99, 235, 0.18)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            <User size={30} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Badge variant="blue" size="sm">
              Citizen Emergency Access
            </Badge>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Emergency Response Network
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginTop: '4px' }}>
            Secure access for faster ambulance coordination and emergency SOS dispatch
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <Toast
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {successMessage && (
          <Toast
            type="success"
            message={successMessage}
          />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="common-phone"
            name="phone"
            type="tel"
            label="Mobile Number"
            placeholder="98765 43210"
            prefix="+91"
            icon={Phone}
            value={phone}
            onChange={handlePhoneChange}
            required
            maxLength={10}
            autoComplete="tel"
            helperText="We will use this to connect you with nearby dispatchers"
          />

          <Input
            id="common-name"
            name="name"
            type="text"
            label="Full Name (Optional for Demo)"
            placeholder="e.g. Aarav Patel"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Sign In to Common Dashboard
          </Button>
        </form>

        {/* Quick Demo Helper Section */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--slate-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={14} color="#38bdf8" />
              Quick 1-Click Demo Profiles
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_COMMON_USERS.map((demo) => (
              <button
                key={demo.phone}
                type="button"
                onClick={() => handleQuickDemoSelect(demo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: phone === demo.phone ? 'rgba(37, 99, 235, 0.25)' : 'rgba(11, 18, 32, 0.7)',
                  border: phone === demo.phone ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {demo.name}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    +91 {demo.phone} &bull; Blood: {demo.bloodGroup}
                  </span>
                </div>
                {phone === demo.phone && (
                  <Badge variant="blue" size="sm">
                    <Check size={12} /> Selected
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--slate-400)',
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Encrypted Emergency Dispatch Session</span>
        </div>
      </Card>
    </div>
  );
};

export default CommonLogin;

