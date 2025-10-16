import React from 'react';

interface HomePageProps {
  isLoggedIn: boolean;
  userInfo?: {
    id: string;
    phoneNumber: string;
    createdAt: string;
  };
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onLogout: () => void;
}

// 接口ID: UI-HomePage
const HomePage: React.FC<HomePageProps> = ({
  isLoggedIn,
  userInfo,
  onNavigateToLogin,
  onNavigateToRegister,
  onLogout
}) => {
  if (isLoggedIn && userInfo) {
    // TODO: 当用户已登录时，显示用户信息和退出登录按钮
    return (
      <div>
        <h1>欢迎回来！</h1>
        <div>
          <p>手机号: {userInfo.phoneNumber}</p>
          <p>注册时间: {new Date(userInfo.createdAt).toLocaleDateString()}</p>
        </div>
        <button onClick={onLogout}>退出登录</button>
      </div>
    );
  }

  // TODO: 当用户未登录时，显示登录和注册选项
  return (
    <div>
      <h1>欢迎使用我们的应用</h1>
      <p>请选择登录或注册</p>
      <div>
        <button onClick={onNavigateToLogin}>登录</button>
        <button onClick={onNavigateToRegister}>注册</button>
      </div>
    </div>
  );
};

export default HomePage;