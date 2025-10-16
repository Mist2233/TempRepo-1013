const request = require('supertest');
const app = require('../../src/app');

describe('Auth Routes', () => {
  // 测试接口: API-POST-SendVerificationCode
  describe('POST /api/auth/send-verification-code', () => {
    test('应该能够为有效手机号发送验证码', async () => {
      const phoneNumber = '13800138000';
      
      // 根据acceptanceCriteria: 验证手机号格式的正确性
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('验证码发送成功');
    });

    test('应该拒绝无效的手机号格式', async () => {
      const invalidPhones = ['123', 'abc', '1234567890123', ''];
      
      for (const phoneNumber of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({ phoneNumber })
          .expect(400);
        
        expect(response.body.error).toBe('请输入正确的手机号码');
      }
    });

    test('应该生成6位数字验证码并在控制台打印', async () => {
      const phoneNumber = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      
      // 监听控制台输出
      const consoleSpy = jest.spyOn(console, 'log');
      
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(200);
      
      // 验证控制台输出包含6位数字验证码
      const logCalls = consoleSpy.mock.calls;
      const codeLog = logCalls.find(call => 
        call[0] && call[0].includes('验证码') && /\d{6}/.test(call[0])
      );
      expect(codeLog).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    test('应该防止频繁请求验证码（60秒内只能请求一次）', async () => {
      const phoneNumber = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      
      // 第一次请求应该成功
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(200);
      
      // 立即第二次请求应该失败
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(429);
      
      expect(response.body.error).toBe('请求过于频繁，请稍后再试');
    });

    test('验证码应该有60秒的有效期', async () => {
      const phoneNumber = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`; // 使用随机数生成唯一手机号
      
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(200);
      
      expect(response.body.expiresIn).toBe(60);
    });
  });

  // 测试接口: API-POST-Login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 为测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: '13800138100' });
    });

    test('应该能够使用正确的手机号和验证码登录', async () => {
      const phoneNumber = '13800138100';
      const verificationCode = '123456'; // 假设这是正确的验证码
      
      // 先注册用户
      await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms: true });
      
      // 再次发送验证码用于登录
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      // 根据acceptanceCriteria: 检查手机号是否已注册，验证验证码的正确性和有效性
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.userInfo).toBeDefined();
      expect(response.body.userInfo.phoneNumber).toBe(phoneNumber);
      expect(response.body.token).toBeDefined();
    });

    test('应该拒绝无效的手机号格式', async () => {
      const invalidPhones = ['123', 'abc', '1234567890123', ''];
      const verificationCode = '123456';
      
      for (const phoneNumber of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ phoneNumber, verificationCode })
          .expect(400);
        
        expect(response.body.error).toBe('请输入正确的手机号码');
      }
    });

    test('应该在手机号未注册时返回错误', async () => {
      const phoneNumber = '19999999999'; // 未注册的手机号
      const verificationCode = '123456';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(400);
      
      expect(response.body.error).toBe('手机号未注册，请先注册');
    });

    test('应该在验证码错误时返回错误', async () => {
      const phoneNumber = '13800138100';
      const wrongCode = '000000';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode: wrongCode })
        .expect(400);
      
      expect(response.body.error).toBe('验证码错误或已过期');
    });

    test('应该在验证码过期时返回错误', async () => {
      const phoneNumber = '13800138101';
      const verificationCode = '123456';
      
      // 等待验证码过期（实际实现中需要模拟时间）
      // 这里暂时跳过，等待实现
    });

    test('登录成功后应该返回用户信息和认证令牌', async () => {
      const phoneNumber = '13800138100';
      const verificationCode = '123456';
      
      // 先注册用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms: true });
      
      // 再次发送验证码用于登录
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(200);
      
      expect(response.body.userInfo).toEqual({
        id: expect.any(String),
        phoneNumber: phoneNumber,
        createdAt: expect.any(String)
      });
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT格式
    });
  });

  // 测试接口: API-POST-Register
  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      // 为测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: '13800138200' });
    });

    test('应该能够使用正确的信息注册新用户', async () => {
      const phoneNumber = '13800138200';
      const verificationCode = '123456';
      const agreeToTerms = true;
      
      // 根据acceptanceCriteria: 验证用户是否同意用户协议，验证验证码的正确性和有效性
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.userInfo).toBeDefined();
      expect(response.body.userInfo.phoneNumber).toBe(phoneNumber);
      expect(response.body.token).toBeDefined();
    });

    test('应该拒绝无效的手机号格式', async () => {
      const invalidPhones = ['123', 'abc', '1234567890123', ''];
      const verificationCode = '123456';
      const agreeToTerms = true;
      
      for (const phoneNumber of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ phoneNumber, verificationCode, agreeToTerms })
          .expect(400);
        
        expect(response.body.error).toBe('请输入正确的手机号码');
      }
    });

    test('应该在用户未同意用户协议时返回错误', async () => {
      const phoneNumber = '13800138200';
      const verificationCode = '123456';
      const agreeToTerms = false;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(400);
      
      expect(response.body.error).toBe('请先同意用户协议');
    });

    test('应该在验证码错误时返回错误', async () => {
      const phoneNumber = '13800138200';
      const wrongCode = '000000';
      const agreeToTerms = true;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode: wrongCode, agreeToTerms })
        .expect(400);
      
      expect(response.body.error).toBe('验证码错误或已过期');
    });

    test('如果手机号已注册，应该直接登录用户', async () => {
      const phoneNumber = '13800138201';
      const verificationCode = '123456';
      const agreeToTerms = true;
      
      // 先注册一次
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(200);
      
      // 再次尝试注册，应该直接登录
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(200);
      
      expect(response.body.message).toBe('用户已存在，已为您自动登录');
    });

    test('如果手机号未注册，应该创建新用户并登录', async () => {
      const phoneNumber = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`; // 使用随机数生成唯一手机号
      const verificationCode = '123456';
      const agreeToTerms = true;
      
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(200);
      
      expect(response.body.message).toBe('注册成功');
      expect(response.body.userInfo).toEqual({
        id: expect.any(String),
        phoneNumber: phoneNumber,
        createdAt: expect.any(String)
      });
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });
});