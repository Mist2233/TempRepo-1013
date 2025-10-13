import React, { useState, useEffect } from 'react';
import '../styles/LoginForm.css';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
  onNavigateToRegister 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showRegisterLink, setShowRegisterLink] = useState(false);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 手机号格式验证
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleGetVerificationCode = async () => {
    setError('');
    setSuccessMessage('');
    setShowRegisterLink(false);

    // 前端手机号格式验证
    if (!phoneNumber) {
      setError('请输入手机号');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCodeSent(true);
        setCountdown(60);
        setSuccessMessage('验证码已发送，请查收');
      } else {
        setError(data.error || '获取验证码失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccessMessage('');
    setShowRegisterLink(false);

    if (!phoneNumber || !verificationCode) {
      setError('请输入手机号和验证码');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('登录成功');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        if (response.status === 404 && data.needRegister) {
          setError(data.error);
          setShowRegisterLink(true);
        } else if (response.status === 410) {
          setError('验证码已过期');
        } else if (response.status === 400) {
          setError('验证码错误');
        } else {
          setError(data.error || '登录失败');
        }
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>用户登录</h2>
      
      <div className="form-group">
        <input
          type="tel"
          placeholder="请输入手机号"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="请输入验证码"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
        />
        <button 
          onClick={handleGetVerificationCode}
          disabled={countdown > 0}
        >
          {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <button 
        onClick={handleLogin}
        disabled={isLoading}
        className="login-button"
      >
        {isLoading ? '登录中...' : '登录'}
      </button>

      {showRegisterLink && (
        <div className="register-link">
          <span 
            onClick={() => onNavigateToRegister && onNavigateToRegister()}
            style={{ color: '#ff6600', cursor: 'pointer', textDecoration: 'underline' }}
          >
            立即注册
          </span>
        </div>
      )}
    </div>
  );
};

export default LoginForm;