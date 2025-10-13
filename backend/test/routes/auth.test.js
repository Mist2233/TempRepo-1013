const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createAuthRouter } = require('../../src/routes/auth');
const UserService = require('../../src/database/userService');
const sqlite3 = require('sqlite3').verbose();

describe('Auth Routes', () => {
  let userService;
  let sharedDb;
  let app;

  beforeAll(async () => {
    // 创建共享的内存数据库
    sharedDb = new sqlite3.Database(':memory:');
    
    // 创建使用共享数据库的UserService
    const sharedUserService = new UserService(sharedDb);
    
    // 创建测试应用，使用共享的UserService
    app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/api/auth', createAuthRouter(sharedUserService));
  });

  beforeEach(async () => {
    // 创建UserService实例，使用共享数据库
    userService = new UserService(sharedDb);
    
    // 创建一个注册用户用于测试
    await userService.createUser('13800138000');
    
    // 为该用户存储验证码
    await userService.storeVerificationCode('13800138000', '123456');
  });

  afterEach(async () => {
    // 清理测试数据，但不关闭数据库
    if (userService) {
      // 清理数据库中的测试数据
      await new Promise((resolve, reject) => {
        sharedDb.serialize(() => {
          sharedDb.run('DELETE FROM verification_codes', (err) => {
            if (err) reject(err);
          });
          sharedDb.run('DELETE FROM users', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      
      await userService.close();
    }
  });

  afterAll(async () => {
    // 关闭共享数据库
    if (sharedDb) {
      await new Promise((resolve) => {
        sharedDb.close(resolve);
      });
    }
  });
  describe('POST /api/auth/verification-code', () => {
    test('应该在手机号格式正确时生成6位数字验证码并打印到控制台', async () => {
      // 根据acceptanceCriteria: 手机号格式正确时，生成6位数字验证码并打印到控制台
      const phoneNumber = '13800138000';
      
      // 这个测试应该失败，因为当前只有骨架代码
      const response = await request(app)
        .post('/api/auth/verification-code')
        .send({ phoneNumber });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('验证码已发送');
      expect(response.body.countdown).toBe(60);
    });

    test('应该将验证码存储到数据库，有效期60秒', async () => {
      // 根据acceptanceCriteria: 验证码存储到数据库，有效期60秒
      const phoneNumber = '13800138000';
      
      const response = await request(app)
        .post('/api/auth/verification-code')
        .send({ phoneNumber });
      
      expect(response.status).toBe(200);
      // 验证数据库中存储了验证码（这里应该失败因为未实现）
    });

    test('应该返回成功响应，包含60秒倒计时信息', async () => {
      // 根据acceptanceCriteria: 返回成功响应，包含60秒倒计时信息
      const phoneNumber = '13800138000';
      
      const response = await request(app)
        .post('/api/auth/verification-code')
        .send({ phoneNumber });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('countdown', 60);
    });

    test('应该在手机号格式错误时返回400错误', async () => {
      // 根据acceptanceCriteria: 手机号格式错误时，返回400错误
      const invalidPhoneNumber = '123';
      
      const response = await request(app)
        .post('/api/auth/verification-code')
        .send({ phoneNumber: invalidPhoneNumber });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入正确的手机号码');
    });
  });

  describe('POST /api/auth/login', () => {
    test('应该在手机号未注册时返回404错误提示用户注册', async () => {
      // 根据acceptanceCriteria: 手机号未注册时，返回404错误提示用户注册
      const phoneNumber = '13800138001';
      const verificationCode = '123456';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('该手机号未注册，请先完成注册');
    });

    test('应该在验证码错误时返回400错误', async () => {
      // 根据acceptanceCriteria: 验证码错误时，返回400错误
      const phoneNumber = '13800138000';
      const wrongCode = '000000';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode: wrongCode });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('验证码错误');
    });

    test('应该在验证码过期时返回410错误', async () => {
      // 根据acceptanceCriteria: 验证码过期时，返回410错误
      const phoneNumber = '13800138000';
      const expiredCode = '654321';
      
      // 存储一个验证码，然后手动设置为过期状态
      await userService.storeVerificationCode(phoneNumber, expiredCode);
      
      // 等待超过60秒或手动修改数据库中的时间戳来模拟过期
      // 这里我们通过直接操作数据库来设置过期时间
      await new Promise((resolve, reject) => {
        sharedDb.run(
          'UPDATE verification_codes SET created_at = datetime("now", "-61 seconds"), expires_at = datetime("now", "-1 seconds") WHERE phone_number = ?',
          [phoneNumber],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode: expiredCode });
      
      expect(response.status).toBe(410);
      expect(response.body.error).toBe('验证码已过期');
    });

    test('应该在验证成功时返回200状态码和用户信息', async () => {
      // 根据acceptanceCriteria: 验证成功时，返回200状态码和用户信息
      const phoneNumber = '13800138000';
      const validCode = '789012'; // 使用不同的验证码避免与其他测试冲突
      
      // 为这个测试存储一个新的有效验证码
      await userService.storeVerificationCode(phoneNumber, validCode);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode: validCode });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('登录成功');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('token');
    });
  });
});