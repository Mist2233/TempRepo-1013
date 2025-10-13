import React from 'react';
import '../styles/LoginButton.css';

interface LoginButtonProps {
  onNavigateToLogin?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onNavigateToLogin }) => {
  const handleClick = () => {
    // TODO: 实现导航到登录页面的逻辑
    // 验收标准：
    // - 点击按钮后调用onNavigateToLogin回调函数
    // - 按钮样式应符合整体设计风格
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      console.log('导航到登录页面功能未实现');
    }
  };

  return (
    <button 
      className="login-button-entry"
      onClick={handleClick}
    >
      亲，请登录
    </button>
  );
};

export default LoginButton;