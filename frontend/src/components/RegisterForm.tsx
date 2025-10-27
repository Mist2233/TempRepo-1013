import React, { useState, useEffect } from 'react';
import './RegisterForm.css';

interface RegisterFormProps {
  onRegisterSuccess: (userInfo: any, token: string) => void;
  onNavigateToLogin: () => void;
}

interface RegisterFormState {
  phoneNumber: string;
  verificationCode: string;
  agreeToTerms: boolean;
  error: string;
  isLoading: boolean;
  countdown: number;
}

// 接口ID: UI-RegisterForm
const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [state, setState] = useState<RegisterFormState>({
    phoneNumber: '',
    verificationCode: '',
    agreeToTerms: false,
    error: '',
    isLoading: false,
    countdown: 0
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

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({ ...prev, countdown: 60, error: '' }));
      } else {
        setState(prev => ({ ...prev, error: data.error || '发送验证码失败' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: '网络错误，请重试' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRegister = async () => {
    // 验证输入
    if (!validatePhoneNumber(state.phoneNumber)) {
      setState(prev => ({ ...prev, error: '请输入正确的手机号码' }));
      return;
    }

    if (!state.verificationCode) {
      setState(prev => ({ ...prev, error: '请输入验证码' }));
      return;
    }

    if (!state.agreeToTerms) {
      setState(prev => ({ ...prev, error: '请同意用户协议' }));
      return;
    }

    setState(prev => ({ ...prev, error: '', isLoading: true }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: state.phoneNumber,
          verificationCode: state.verificationCode,
          agreeToTerms: state.agreeToTerms,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onRegisterSuccess(data.userInfo, data.token);
      } else {
        setState(prev => ({ ...prev, error: data.error || '注册失败' }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: '网络错误，请重试' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="register-form-container">
      {/* 淘宝Logo背景 */}
      <div className="background-logo">
        <svg width="120" height="48" viewBox="0 0 120 48" fill="none">
          <text x="0" y="36" fontSize="30" fontWeight="bold" fill="#ff6600" opacity="0.3">淘宝</text>
          <text x="0" y="45" fontSize="12" fill="#ff6600" opacity="0.3">Taobao</text>
        </svg>
      </div>
      <div className="register-form">
        <div className="form-header">
          <h2 className="form-title">免费注册</h2>
        </div>
        
        <div className="form-content">
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
              className={`verification-btn ${state.countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendVerificationCode} 
              disabled={state.countdown > 0 || state.isLoading}
            >
              {state.countdown > 0 ? `${state.countdown}s` : '获取验证码'}
            </button>
          </div>

          {state.error && <div className="error-message">{state.error}</div>}

          <div className="terms-group">
            <label className="terms-label">
              <input
                type="checkbox"
                checked={state.agreeToTerms}
                onChange={(e) => setState(prev => ({ ...prev, agreeToTerms: e.target.checked, error: '' }))}
              />
              <span className="terms-text">我已阅读并同意用户协议</span>
            </label>
          </div>

          <button 
            className={`register-btn ${state.isLoading ? 'loading' : ''}`}
            onClick={handleRegister} 
            disabled={state.isLoading}
          >
            {state.isLoading ? '注册中...' : '注册'}
          </button>

          <div className="login-link">
            <button className="login-btn-link" onClick={onNavigateToLogin}>
              已有账号？立即登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;