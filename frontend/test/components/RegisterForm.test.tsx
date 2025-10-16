import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import RegisterForm from '../../src/components/RegisterForm';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('RegisterForm', () => {
  const mockOnRegisterSuccess = vi.fn();
  const mockOnNavigateToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  // 测试接口: UI-RegisterForm
  test('应该渲染手机号输入框、验证码输入框、用户协议复选框、获取验证码按钮和注册按钮', () => {
    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    // 根据acceptanceCriteria: 组件应渲染手机号输入框、验证码输入框、用户协议复选框、获取验证码按钮和注册按钮
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    expect(screen.getByText('我已阅读并同意用户协议')).toBeInTheDocument();
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
    expect(screen.getByText('注册')).toBeInTheDocument();
    expect(screen.getByText('已有账号？立即登录')).toBeInTheDocument();
  });

  test('应该验证手机号格式，格式错误时显示"请输入正确的手机号码"', async () => {
    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const sendCodeButton = screen.getByText('获取验证码');

    // 输入无效手机号
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(sendCodeButton);

    // 根据acceptanceCriteria: 验证手机号格式，格式错误时显示"请输入正确的手机号码"
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
    });
  });

  test('获取验证码后，按钮应该进入60秒倒计时且不可点击', async () => {
    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '验证码发送成功' })
    });

    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const sendCodeButton = screen.getByText('获取验证码');

    // 输入有效手机号
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(sendCodeButton);

    // 根据acceptanceCriteria: 获取验证码后，按钮进入60秒倒计时且不可点击
    await waitFor(() => {
      expect(sendCodeButton).toBeDisabled();
      expect(sendCodeButton.textContent).toMatch(/\d+s/);
    });
  });

  test('注册前应该检查用户协议复选框，未勾选时显示"请同意用户协议"', async () => {
    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const registerButton = screen.getByText('注册');

    // 填写表单但不勾选用户协议
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(registerButton);

    // 根据acceptanceCriteria: 注册前检查用户协议复选框，未勾选时显示"请同意用户协议"
    await waitFor(() => {
      expect(screen.getByText('请同意用户协议')).toBeInTheDocument();
    });
  });

  test('注册时应该显示加载状态，按钮变为不可点击', async () => {
    // Mock API response with delay
    (fetch as any).mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: '注册成功',
          userInfo: { id: '1', phoneNumber: '13800138000', createdAt: new Date().toISOString() },
          token: 'mock-token'
        })
      }), 50);
    }));

    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const agreeCheckbox = screen.getByRole('checkbox');
    const registerButton = screen.getByText('注册');

    // 填写完整表单
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(agreeCheckbox);
    fireEvent.click(registerButton);

    // 根据acceptanceCriteria: 注册时显示加载状态，按钮变为不可点击
    await waitFor(() => {
      expect(screen.getByText('注册中...')).toBeInTheDocument();
      expect(registerButton).toBeDisabled();
    });
  });

  test('应该根据API响应显示相应的错误或成功消息', async () => {
    // Mock error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '验证码错误或已过期' })
    });

    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const agreeCheckbox = screen.getByRole('checkbox');
    const registerButton = screen.getByText('注册');

    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(agreeCheckbox);
    fireEvent.click(registerButton);

    // 根据acceptanceCriteria: 根据API响应显示相应的错误或成功消息
    await waitFor(() => {
      expect(screen.getByText('验证码错误或已过期')).toBeInTheDocument();
    });
  });

  test('注册成功后应该调用onRegisterSuccess回调', async () => {
    const mockUserInfo = {
      id: '1',
      phoneNumber: '13800138000',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock-jwt-token';

    // Mock successful register response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '注册成功',
        userInfo: mockUserInfo,
        token: mockToken
      })
    });

    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const agreeCheckbox = screen.getByRole('checkbox');
    const registerButton = screen.getByText('注册');

    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(agreeCheckbox);
    fireEvent.click(registerButton);

    // 根据acceptanceCriteria: 注册成功后调用onRegisterSuccess回调并跳转到首页
    await waitFor(() => {
      expect(mockOnRegisterSuccess).toHaveBeenCalledWith(mockUserInfo, mockToken);
    });
  });

  test('点击"已有账号？立即登录"按钮应该调用onNavigateToLogin回调', async () => {
    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const loginButton = screen.getByText('已有账号？立即登录');
    fireEvent.click(loginButton);

    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });

  test('应该正确处理网络错误', async () => {
    // Mock network error
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const agreeCheckbox = screen.getByRole('checkbox');
    const registerButton = screen.getByText('注册');

    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(agreeCheckbox);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('网络错误，请重试')).toBeInTheDocument();
    });
  });

  test('用户协议复选框应该可以正常切换状态', async () => {
    render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const agreeCheckbox = screen.getByRole('checkbox') as HTMLInputElement;

    // 初始状态应该是未勾选
    expect(agreeCheckbox.checked).toBe(false);

    // 点击后应该变为勾选
    fireEvent.click(agreeCheckbox);
    expect(agreeCheckbox.checked).toBe(true);

    // 再次点击应该变为未勾选
    fireEvent.click(agreeCheckbox);
    expect(agreeCheckbox.checked).toBe(false);
  });
});