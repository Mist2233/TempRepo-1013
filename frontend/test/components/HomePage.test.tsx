import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import HomePage from '../../src/components/HomePage';

describe('HomePage', () => {
  const mockOnNavigateToLogin = vi.fn();
  const mockOnNavigateToRegister = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试接口: UI-HomePage
  describe('当用户未登录时', () => {
    test('应该显示登录和注册选项', () => {
      render(
        <HomePage
          isLoggedIn={false}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 根据acceptanceCriteria: 当用户未登录时，显示登录和注册选项
      expect(screen.getByText('欢迎使用我们的应用')).toBeInTheDocument();
      expect(screen.getByText('请选择登录或注册')).toBeInTheDocument();
      expect(screen.getByText('登录')).toBeInTheDocument();
      expect(screen.getByText('注册')).toBeInTheDocument();
    });

    test('点击登录按钮应该调用onNavigateToLogin', async () => {
      const user = userEvent.setup();
      
      render(
        <HomePage
          isLoggedIn={false}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      const loginButton = screen.getByText('登录');
      await user.click(loginButton);

      expect(mockOnNavigateToLogin).toHaveBeenCalled();
    });

    test('点击注册按钮应该调用onNavigateToRegister', async () => {
      const user = userEvent.setup();
      
      render(
        <HomePage
          isLoggedIn={false}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      const registerButton = screen.getByText('注册');
      await user.click(registerButton);

      expect(mockOnNavigateToRegister).toHaveBeenCalled();
    });
  });

  describe('当用户已登录时', () => {
    const mockUserInfo = {
      id: '1',
      phoneNumber: '13800138000',
      createdAt: '2023-10-13T10:00:00.000Z'
    };

    test('应该显示用户信息和退出登录按钮', () => {
      render(
        <HomePage
          isLoggedIn={true}
          userInfo={mockUserInfo}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 根据acceptanceCriteria: 当用户已登录时，显示用户信息和退出登录按钮
      expect(screen.getByText('欢迎回来！')).toBeInTheDocument();
      expect(screen.getByText('手机号: 13800138000')).toBeInTheDocument();
      expect(screen.getByText(/注册时间:/)).toBeInTheDocument();
      expect(screen.getByText('退出登录')).toBeInTheDocument();
    });

    test('应该正确显示格式化的注册时间', () => {
      render(
        <HomePage
          isLoggedIn={true}
          userInfo={mockUserInfo}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 验证日期格式化
      const expectedDate = new Date(mockUserInfo.createdAt).toLocaleDateString();
      expect(screen.getByText(`注册时间: ${expectedDate}`)).toBeInTheDocument();
    });

    test('点击退出登录按钮应该调用onLogout', async () => {
      const user = userEvent.setup();
      
      render(
        <HomePage
          isLoggedIn={true}
          userInfo={mockUserInfo}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByText('退出登录');
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalled();
    });

    test('当用户已登录但userInfo为undefined时应该显示未登录状态', () => {
      render(
        <HomePage
          isLoggedIn={true}
          userInfo={undefined}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 应该显示未登录状态
      expect(screen.getByText('欢迎使用我们的应用')).toBeInTheDocument();
      expect(screen.getByText('登录')).toBeInTheDocument();
      expect(screen.getByText('注册')).toBeInTheDocument();
    });
  });

  describe('组件状态切换', () => {
    test('应该能够正确处理登录状态的变化', () => {
      const { rerender } = render(
        <HomePage
          isLoggedIn={false}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 初始状态：未登录
      expect(screen.getByText('欢迎使用我们的应用')).toBeInTheDocument();

      // 重新渲染为已登录状态
      const mockUserInfo = {
        id: '1',
        phoneNumber: '13800138000',
        createdAt: '2023-10-13T10:00:00.000Z'
      };

      rerender(
        <HomePage
          isLoggedIn={true}
          userInfo={mockUserInfo}
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
          onLogout={mockOnLogout}
        />
      );

      // 应该显示已登录状态
      expect(screen.getByText('欢迎回来！')).toBeInTheDocument();
      expect(screen.getByText('手机号: 13800138000')).toBeInTheDocument();
    });
  });
});