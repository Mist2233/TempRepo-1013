import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('LoginForm', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnNavigateToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  // 测试接口: UI-LoginForm
  test('应该渲染手机号输入框、验证码输入框、获取验证码按钮和登录按钮', () => {
    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    // 根据acceptanceCriteria: 组件应渲染手机号输入框、验证码输入框、获取验证码按钮和登录按钮
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByText('免费注册')).toBeInTheDocument();
  });

  test('应该验证手机号格式，格式错误时显示"请输入正确的手机号码"', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const sendCodeButton = screen.getByText('获取验证码');

    // 输入无效手机号
    await user.type(phoneInput, '123');
    await user.click(sendCodeButton);

    // 根据acceptanceCriteria: 验证手机号格式，格式错误时显示"请输入正确的手机号码"
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
    });
  });

  test('获取验证码后，按钮应该进入60秒倒计时且不可点击', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '验证码发送成功' })
    });

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const sendCodeButton = screen.getByText('获取验证码');

    // 输入有效手机号
    await user.type(phoneInput, '13800138000');
    await user.click(sendCodeButton);

    // 根据acceptanceCriteria: 获取验证码后，按钮进入60秒倒计时且不可点击
    await waitFor(() => {
      expect(sendCodeButton).toBeDisabled();
      expect(sendCodeButton.textContent).toMatch(/\d+s/);
    });
  });

  test('登录时应该显示加载状态，按钮变为不可点击', async () => {
    const user = userEvent.setup();

    // Mock API responses
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '验证码发送成功' })
      })
      .mockImplementationOnce(() => new Promise(resolve => {
        // Simulate slow login response
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            userInfo: { id: '1', phoneNumber: '13800138000', createdAt: new Date().toISOString() },
            token: 'mock-token'
          })
        }), 500);
      }));

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const sendCodeButton = screen.getByText('获取验证码');
    const loginButton = screen.getByText('登录');

    // 填写手机号并发送验证码
    await user.type(phoneInput, '13800138000');
    await user.click(sendCodeButton);
    
    // 等待验证码发送完成
    await waitFor(() => {
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });

    // 填写验证码
    await user.type(codeInput, '123456');
    
    // 点击登录按钮
    await user.click(loginButton);

    // 根据acceptanceCriteria: 登录时显示加载状态，按钮变为不可点击
    await waitFor(() => {
      expect(screen.getByText('登录中...')).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });
  });

  test('应该根据API响应显示相应的错误或成功消息', async () => {
    const user = userEvent.setup();
    
    // Mock error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '验证码错误或已过期' })
    });

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');

    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '000000');
    await user.click(loginButton);

    // 根据acceptanceCriteria: 根据API响应显示相应的错误或成功消息
    await waitFor(() => {
      expect(screen.getByText('验证码错误或已过期')).toBeInTheDocument();
    });
  });

  test('登录成功后应该调用onLoginSuccess回调', async () => {
    const user = userEvent.setup();
    
    const mockUserInfo = {
      id: '1',
      phoneNumber: '13800138000',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock-jwt-token';

    // Mock successful login response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        userInfo: mockUserInfo,
        token: mockToken
      })
    });

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');

    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    await user.click(loginButton);

    // 根据acceptanceCriteria: 登录成功后调用onLoginSuccess回调并跳转到首页
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUserInfo, mockToken);
    });
  });

  test('点击免费注册按钮应该调用onNavigateToRegister回调', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const registerButton = screen.getByText('免费注册');
    await user.click(registerButton);

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });

  test('应该正确处理网络错误', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');

    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    
    // 点击登录按钮并等待异步操作完成
    await user.click(loginButton);

    // 等待错误消息出现
    await waitFor(() => {
      expect(screen.getByText(/网络错误/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});