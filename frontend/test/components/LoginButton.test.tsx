import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginButton from '../../src/components/LoginButton';

describe('LoginButton', () => {
  test('应该显示"亲，请登录"文本', () => {
    // 根据acceptanceCriteria: 按钮应显示"亲，请登录"文本
    render(<LoginButton />);
    
    expect(screen.getByText('亲，请登录')).toBeInTheDocument();
  });

  test('应该在点击按钮后调用onNavigateToLogin回调函数', async () => {
    // 根据acceptanceCriteria: 点击按钮后调用onNavigateToLogin回调函数
    const mockOnNavigateToLogin = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginButton onNavigateToLogin={mockOnNavigateToLogin} />);
    
    const button = screen.getByText('亲，请登录');
    await user.click(button);
    
    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });

  test('应该具有符合整体设计风格的按钮样式', () => {
    // 根据acceptanceCriteria: 按钮样式应符合整体设计风格
    render(<LoginButton />);
    
    const button = screen.getByText('亲，请登录');
    
    // 验证按钮具有正确的CSS类名
    expect(button).toHaveClass('login-button-entry');
    
    // 这个测试应该失败，因为当前只有骨架代码，没有实际的样式
    // 在实际实现中，应该验证按钮的样式属性
  });

  test('应该在没有提供回调函数时有默认行为', async () => {
    // 测试边界情况：没有提供onNavigateToLogin回调
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<LoginButton />);
    
    const button = screen.getByText('亲，请登录');
    await user.click(button);
    
    // 验证默认行为（打印日志）
    expect(consoleSpy).toHaveBeenCalledWith('导航到登录页面功能未实现');
    
    consoleSpy.mockRestore();
  });
});