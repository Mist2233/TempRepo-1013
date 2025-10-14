import React, { useState, useEffect } from 'react';

interface VerificationCodeInputProps {
  phoneNumber: string;
  onCodeChange: (code: string) => void;
  onSendCode: () => Promise<void>;
  disabled?: boolean;
}

interface VerificationCodeInputState {
  code: string;
  countdown: number;
  isLoading: boolean;
}

// 接口ID: UI-VerificationCodeInput
const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  phoneNumber: _phoneNumber,
  onCodeChange,
  onSendCode,
  disabled = false
}) => {
  const [state, setState] = useState<VerificationCodeInputState>({
    code: '',
    countdown: 0,
    isLoading: false
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.countdown > 0) {
      timer = setTimeout(() => {
        setState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [state.countdown]);

  const handleSendCode = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await onSendCode();
      setState(prev => ({ ...prev, countdown: 60, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setState(prev => ({ ...prev, code: value }));
    onCodeChange(value);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="请输入6位验证码"
        value={state.code}
        onChange={handleCodeChange}
        maxLength={6}
        disabled={disabled}
      />
      <button
        onClick={handleSendCode}
        disabled={disabled || state.countdown > 0 || state.isLoading}
      >
        {state.isLoading ? '发送中...' : state.countdown > 0 ? `${state.countdown}s` : '获取验证码'}
      </button>
    </div>
  );
};

export default VerificationCodeInput;