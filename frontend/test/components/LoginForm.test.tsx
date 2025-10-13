import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm', () => {
  test('应该渲染手机号输入框、验证码输入框、获取验证码按钮和登录按钮', () => {
    // 根据acceptanceCriteria: 组件应渲染手机号输入框、验证码输入框、获取验证码按钮和登录按钮
    render(<LoginForm />);
    
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  test('应该在前端进行手机号格式验证，格式错误时显示提示信息', async () => {
    // 根据acceptanceCriteria: 手机号格式验证应在前端进行，格式错误时显示提示信息
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const getCodeButton = screen.getByText('获取验证码');
    
    await user.type(phoneInput, '123');
    await user.click(getCodeButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
    });
  });

  test('应该在获取验证码按钮点击后进入60秒倒计时状态且不可点击', async () => {
    // 根据acceptanceCriteria: 获取验证码按钮点击后进入60秒倒计时状态且不可点击
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const getCodeButton = screen.getByText('获取验证码');
    
    await user.type(phoneInput, '13800138000');
    await user.click(getCodeButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      expect(getCodeButton).toBeDisabled();
      expect(screen.getByText(/秒后重试/)).toBeInTheDocument();
    });
  });

  test('应该在登录过程中，登录按钮显示加载状态且不可点击', async () => {
    // 根据acceptanceCriteria: 登录过程中，登录按钮应显示加载状态且不可点击
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');
    
    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    await user.click(loginButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });
  });

  test('应该显示相应的错误提示信息（验证码错误、未注册等）', async () => {
    // 根据acceptanceCriteria: 显示相应的错误提示信息（验证码错误、未注册等）
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');
    
    await user.type(phoneInput, '13800138001'); // 未注册的手机号
    await user.type(codeInput, '123456');
    await user.click(loginButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      expect(screen.getByText('该手机号未注册，请先完成注册')).toBeInTheDocument();
    });
  });

  test('应该在登录成功后调用onLoginSuccess回调并显示成功提示', async () => {
    // 根据acceptanceCriteria: 登录成功后调用onLoginSuccess回调并显示成功提示
    const mockOnLoginSuccess = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');
    
    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    await user.click(loginButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
      expect(screen.getByText('登录成功')).toBeInTheDocument();
    });
  });

  test('应该为未注册用户提供注册引导', async () => {
    // 根据acceptanceCriteria: 未注册用户应提供注册引导
    const mockOnNavigateToRegister = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onNavigateToRegister={mockOnNavigateToRegister} />);
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const codeInput = screen.getByPlaceholderText('请输入验证码');
    const loginButton = screen.getByText('登录');
    
    await user.type(phoneInput, '13800138001'); // 未注册的手机号
    await user.type(codeInput, '123456');
    await user.click(loginButton);
    
    // 这个测试应该失败，因为当前只有骨架代码
    await waitFor(() => {
      const registerLink = screen.getByText('立即注册');
      expect(registerLink).toBeInTheDocument();
      fireEvent.click(registerLink);
      expect(mockOnNavigateToRegister).toHaveBeenCalled();
    });
  });
});