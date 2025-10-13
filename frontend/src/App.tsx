import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import LoginButton from './components/LoginButton';
import './styles/App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = () => {
    console.log('登录成功，跳转到首页');
    setShowLogin(false);
  };

  const handleNavigateToLogin = () => {
    console.log('导航到登录页面');
    setShowLogin(true);
  };

  const handleNavigateToRegister = () => {
    console.log('导航到注册页面');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo">淘宝</a>
          {!showLogin && (
            <LoginButton onNavigateToLogin={handleNavigateToLogin} />
          )}
        </div>
      </header>

      <main className="main-content">
        {showLogin ? (
          <div className="login-container">
            <div className="qr-section">
              <h3>手机扫码登录</h3>
              <div className="qr-code">
                <div>二维码区域</div>
              </div>
              <div className="qr-tips">
                打开手机淘宝，点击右上角扫一扫
              </div>
            </div>
            
            <div className="login-section">
              <div className="login-tabs">
                <div className="tab">密码登录</div>
                <div className="tab active">短信登录</div>
              </div>
              
              <LoginForm 
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={handleNavigateToRegister}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h1 style={{ fontSize: '48px', color: '#ff6600', marginBottom: '20px' }}>欢迎来到淘宝</h1>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>发现好物，享受购物乐趣</p>
            <LoginButton onNavigateToLogin={handleNavigateToLogin} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;