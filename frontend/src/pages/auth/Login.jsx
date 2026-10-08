import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaQrcode, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Loader from '../dashboard/Loader';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyOTP, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setResendTimer(30);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to resend OTP.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <Loader />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!email || !password) {
        setError('Please fill in all fields');
        toast.error('Please fill in all fields');
        return;
      }
      setLoading(true);
      try {
        const res = await login(email, password);
        if (res?.requires2FA) {
          setStep(2);
          setResendTimer(30);
        } else {
          navigate('/admin');
        }
      } catch (err) {
        const errMsg = err.response?.data?.error || 'Login failed. Please try again.';
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!otp) {
        setError('Please enter the OTP');
        toast.error('Please enter the OTP');
        return;
      }
      setLoading(true);
      try {
        await verifyOTP(email, otp);
        navigate('/admin');
      } catch (err) {
        const errMsg = err.response?.data?.error || 'Invalid OTP. Please try again.';
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-orb login-bg-orb-1"></div>
      <div className="login-bg-orb login-bg-orb-2"></div>
      <div className="login-bg-grid"></div>

      <div className="container">
        <div className="row justify-content-center ">
          <div className="col-sm-8 col-md-6 col-lg-5 col-xl-4">
            <div className="login-card">
              <div className="login-header text-center mb-3">
                <div className="login-logo-wrapper">
                  <div className="login-logo">
                    <FaQrcode size={28} />
                  </div>
                </div>
                <h2 className="login-title">AKKSYS Admin</h2>
                <p className="login-subtitle">
                  {step === 1 ? 'Sign in to manage your business campaigns' : 'Enter the verification code sent to your email'}
                </p>
              </div>

              {error && (
                <div className="login-error">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                {step === 1 ? (
                  <>
                    <div className="login-field mb-3">
                      <label className="login-label">Email Address</label>
                      <div className="login-input-wrapper">
                        <input
                          type="email"
                          className="login-input"
                          placeholder="admin@akksys.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="login-field mb-3">
                      <label className="login-label d-flex justify-content-between">
                        <span>Password</span>
                      </label>
                      <div className="login-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="login-input"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="login-eye-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="login-field mb-3">
                      <label className="login-label">Verification Code (OTP)</label>
                      <div className="login-input-wrapper">
                        <input
                          type="text"
                          className="login-input text-center"
                          style={{ letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }}
                          placeholder="------"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className='mb-3 text-end'>
                  {/* <button type="button" className="login-forgot-btn" onClick={() => navigate('/forgot-password')}>Forgot password?</button> */}
                </div>

                <button
                  type="submit"
                  className="thm-btn w-100"
                  style={{ padding: "12px 16px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinner spin me-2" /> {step === 1 ? 'Signing in...' : 'Verifying...'}
                    </>
                  ) : (
                    step === 1 ? 'Sign In' : 'Verify & Login'
                  )}
                </button>
                {step === 2 && (
                  <div className="text-center mt-3 d-flex flex-column gap-2 align-items-center">
                    <div>
                      {resendTimer > 0 ? (
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>Resend code in {resendTimer}s</span>
                      ) : (
                        <button 
                          type="button" 
                          className="login-link-btn" 
                          onClick={handleResendOTP}
                          disabled={loading}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="login-link-btn" 
                      onClick={() => { setStep(1); setError(''); setOtp(''); setResendTimer(0); }}
                    >
                      Back to login
                    </button>
                  </div>
                )}
              </form>
              <div className="login-divider">
                <span>or</span>
              </div>

              <div className="login-social-btns">
                <button className="thm-btn outline w-100" style={{ padding: "12px 16px" }} type="button">
                  Continue as Guest
                </button>
              </div>

              <div className="login-footer">
                <p className="login-footer-text">
                  Don't have an account?{' '}
                  <button type="button" className="login-link-btn">Contact Sales</button>
                </p>
              </div>
            </div>

            <div className="login-back text-center mt-3">
              <button type="button" className="login-back-btn" onClick={() => navigate('/')}>
                ← Back to Website
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
