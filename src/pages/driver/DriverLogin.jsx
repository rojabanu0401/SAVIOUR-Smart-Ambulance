import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Phone, ArrowLeft, ShieldCheck, ArrowRight, Sparkles, Check, FileCheck, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { driverService } from '../../services/driverService';
import { isValidPhoneNumber } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';

export const DriverLogin = () => {
  const navigate = useNavigate();
  const { checkDriverPhone, loginDriver, loading } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const demoDrivers = driverService.getDemoDrivers();

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(rawVal);
    if (error) setError('');
    if (statusMessage) setStatusMessage('');
  };

  const handleQuickDemoSelect = (demoPhone) => {
    setPhone(demoPhone);
    setError('');
    setStatusMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Please enter your registered 10-digit mobile number.');
      return;
    }

    if (!isValidPhoneNumber(cleanPhone)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    try {
      const checkResult = await checkDriverPhone(cleanPhone);

      if (checkResult.isRegistered && checkResult.driver) {
        // Driver already registered -> log in & direct to dashboard
        setStatusMessage(`Registered driver found (${checkResult.driver.fullName}). Redirecting to Driver Dashboard...`);
        await loginDriver(checkResult.driver);
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 500);
      } else {
        // New driver -> redirect to verification form with pre-filled phone number
        setStatusMessage('Mobile number not registered. Redirecting to Driver Verification...');
        setTimeout(() => {
          navigate('/driver/verification', { state: { phone: cleanPhone } });
        }, 400);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify driver phone number. Please try again.');
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '500px',
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

      {/* Driver Login Card */}
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
              width: '58px',
              height: '58px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <Truck size={30} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <Badge variant="red" size="sm">
              Emergency Fleet Access
            </Badge>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Ambulance Driver Portal
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginTop: '4px' }}>
            Enter your mobile number to access dispatch dashboard or complete driver verification
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

        {statusMessage && (
          <Toast
            type="info"
            message={statusMessage}
          />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="driver-phone"
            name="phone"
            type="tel"
            label="Driver Registered Mobile Number"
            placeholder="98765 43210"
            prefix="+91"
            icon={Phone}
            value={phone}
            onChange={handlePhoneChange}
            required
            maxLength={10}
            autoComplete="tel"
            helperText="Registered drivers go to Dashboard; new drivers go to Verification"
          />

          <Button
            type="submit"
            variant="emergency"
            size="lg"
            fullWidth
            iconRight={ArrowRight}
            loading={loading}
          >
            Continue to Driver Portal
          </Button>
        </form>

        {/* Testing Guide / Quick Demo Profiles */}
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
              <Sparkles size={14} color="#ef4444" />
              Demo Test Credentials
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Existing Drivers */}
            {demoDrivers.slice(0, 2).map((drv) => (
              <button
                key={drv.phone}
                type="button"
                onClick={() => handleQuickDemoSelect(drv.phone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: phone === drv.phone ? 'rgba(239, 68, 68, 0.2)' : 'rgba(11, 18, 32, 0.7)',
                  border: phone === drv.phone ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      {drv.fullName}
                    </p>
                    <Badge variant="green" size="sm">
                      Existing Driver
                    </Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    +91 {drv.phone} &bull; {drv.ambulanceNumber} ({drv.ambulanceType.split(' ')[0]})
                  </span>
                </div>
                {phone === drv.phone && (
                  <Badge variant="red" size="sm">
                    <Check size={12} />
                  </Badge>
                )}
              </button>
            ))}

            {/* Test New Unregistered Driver */}
            <button
              type="button"
              onClick={() => handleQuickDemoSelect('9123456789')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                backgroundColor: phone === '9123456789' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(11, 18, 32, 0.7)',
                border: phone === '9123456789' ? '1.5px solid #f59e0b' : '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    New Unregistered Driver
                  </p>
                  <Badge variant="amber" size="sm">
                    Triggers Verification
                  </Badge>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  +91 9123456789 &bull; Tests Verification Flow
                </span>
              </div>
              {phone === '9123456789' && (
                <Badge variant="amber" size="sm">
                  <Check size={12} />
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Verification Info Callout */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(11, 18, 32, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--slate-400)',
            textAlign: 'left',
          }}
        >
          <Info size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong style={{ color: '#f8fafc' }}>Verification Policy:</strong> First-time ambulance drivers must register driving license and vehicle registration to receive emergency dispatch permissions.
          </span>
        </div>
      </Card>
    </div>
  );
};

export default DriverLogin;

