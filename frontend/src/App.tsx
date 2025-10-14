import { useState } from 'react';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

type Page = 'home' | 'login' | 'register';

interface UserInfo {
  id: string;
  phoneNumber: string;
  createdAt: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [_token, setToken] = useState<string | null>(null);

  const handleLoginSuccess = (userInfo: UserInfo, token: string) => {
    // TODO: 处理登录成功逻辑
    setIsLoggedIn(true);
    setUserInfo(userInfo);
    setToken(token);
    setCurrentPage('home');
  };

  const handleRegisterSuccess = (userInfo: UserInfo, token: string) => {
    // TODO: 处理注册成功逻辑
    setIsLoggedIn(true);
    setUserInfo(userInfo);
    setToken(token);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    // TODO: 处理退出登录逻辑
    setIsLoggedIn(false);
    setUserInfo(null);
    setToken(null);
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentPage('register')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        );
      case 'home':
      default:
        return (
          <HomePage
            isLoggedIn={isLoggedIn}
            userInfo={userInfo || undefined}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigateToRegister={() => setCurrentPage('register')}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;