import React, { useState, useEffect } from 'react';
import './LoginForm.css';

interface LoginFormProps {
  onLoginSuccess: (userInfo: any, token: string) => void;
  onNavigateToRegister: () => void;
}

interface LoginFormState {
  username: string;
  password: string;
  phoneNumber: string;
  verificationCode: string;
  error: string;
  isLoading: boolean;
  countdown: number;
  loginType: 'password' | 'sms';
}

// 接口ID: UI-LoginForm
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [state, setState] = useState<LoginFormState>({
    username: '',
    password: '',
    phoneNumber: '',
    verificationCode: '',
    error: '',
    isLoading: false,
    countdown: 0,
    loginType: 'sms'
  });

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.countdown > 0) {
      timer = setTimeout(() => {
        setState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [state.countdown]);

  // 验证手机号格式
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendVerificationCode = async () => {
    // 验证手机号格式
    if (!validatePhoneNumber(state.phoneNumber)) {
      setState(prev => ({ ...prev, error: '请输入正确的手机号码' }));
      return;
    }

    setState(prev => ({ ...prev, error: '', isLoading: true }));

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: state.phoneNumber }),
      });

      if (response.ok) {
        setState(prev => ({ ...prev, countdown: 60, error: '' }));
      } else {
        const data = await response.json();
        setState(prev => ({ ...prev, error: data.error || '发送验证码失败' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: '网络错误，请重试' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePasswordLogin = async () => {
    // 验证输入
    if (!state.username) {
      setState(prev => ({ ...prev, error: '请输入账号/邮箱/手机号' }));
      return;
    }

    if (!state.password) {
      setState(prev => ({ ...prev, error: '请输入密码' }));
      return;
    }

    setState(prev => ({ ...prev, error: '', isLoading: true }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: state.username,
          password: state.password,
          loginType: 'password'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const data = await response.json();
        setState(prev => ({ ...prev, error: data.error || '登录失败' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: '网络错误，请重试' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSmsLogin = async () => {
    // 验证输入
    if (!validatePhoneNumber(state.phoneNumber)) {
      setState(prev => ({ ...prev, error: '请输入正确的手机号码' }));
      return;
    }

    if (!state.verificationCode) {
      setState(prev => ({ ...prev, error: '请输入验证码' }));
      return;
    }

    setState(prev => ({ ...prev, error: '', isLoading: true }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: state.phoneNumber,
          verificationCode: state.verificationCode,
          loginType: 'sms'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.userInfo, data.token);
      } else {
        const data = await response.json();
        setState(prev => ({ ...prev, error: data.error || '登录失败' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: '网络错误，请重试' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="login-form-container">
      {/* 淘宝Logo背景 */}
      <div className="background-logo">
        <svg width="120" height="48" viewBox="0 0 120 48" fill="none">
          <text x="0" y="36" fontSize="30" fontWeight="bold" fill="#ff6600" opacity="0.3">淘宝</text>
          <text x="0" y="45" fontSize="12" fill="#ff6600" opacity="0.3">Taobao</text>
        </svg>
      </div>
      
      <div className="login-form">
        <div className="form-header">
          <div className="login-tabs">
            <span 
              className={`tab-item ${state.loginType === 'password' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, loginType: 'password', error: '' }))}
            >
              密码登录
            </span>
            <span 
              className={`tab-item ${state.loginType === 'sms' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, loginType: 'sms', error: '' }))}
            >
              短信登录
            </span>
          </div>
        </div>
        
        <div className="form-body">
          <div className="left-section">
            <div className="qr-section">
              <div className="qr-placeholder">
                <div className="qr-text">扫码登录</div>
                <div className="qr-description">这里是二维码区域</div>
              </div>
            </div>
          </div>
          
          <div className="right-section">
            <div className="form-content">
              {state.error && <div className="error-message">{state.error}</div>}
              
              {state.loginType === 'password' ? (
                <>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="请输入手机号"
                      value={state.username}
                      onChange={(e) => setState(prev => ({ ...prev, username: e.target.value, error: '' }))}
                    />
                  </div>
                  
                  <div className="input-group">
                    <input
                      type="password"
                      className="form-input"
                      placeholder="请输入密码"
                      value={state.password}
                      onChange={(e) => setState(prev => ({ ...prev, password: e.target.value, error: '' }))}
                    />
                  </div>
                  
                  <div className="forgot-password">
                    <a href="#" className="forgot-link">忘记密码？</a>
                  </div>
                  
                  <button 
                    className={`login-btn ${state.isLoading ? 'loading' : ''}`}
                    onClick={handlePasswordLogin} 
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? '登录中...' : '登录'}
                  </button>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="请输入手机号"
                      value={state.phoneNumber}
                      onChange={(e) => setState(prev => ({ ...prev, phoneNumber: e.target.value, error: '' }))}
                    />
                  </div>
                  
                  <div className="input-group verification-group">
                    <input
                      type="text"
                      className="form-input verification-input"
                      placeholder="请输入验证码"
                      value={state.verificationCode}
                      onChange={(e) => setState(prev => ({ ...prev, verificationCode: e.target.value, error: '' }))}
                    />
                    <button
                      type="button"
                      className={`verification-btn ${state.countdown > 0 || state.isLoading ? 'disabled' : ''}`}
                      onClick={handleSendVerificationCode}
                      disabled={state.countdown > 0 || state.isLoading}
                    >
                      {state.countdown > 0 ? `${state.countdown}s` : '获取验证码'}
                    </button>
                  </div>
                  
                  <button 
                    className={`login-btn ${state.isLoading ? 'loading' : ''}`}
                    onClick={handleSmsLogin} 
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? '登录中...' : '登录'}
                  </button>
                </>
              )}
              
              <div className="register-link">
                <button className="register-btn-link" onClick={onNavigateToRegister}>
                  免费注册
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;