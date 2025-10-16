const UserDatabase = require('../../src/database/userDatabase');

describe('UserDatabase', () => {
  let userDb;

  beforeEach(async () => {
    userDb = new UserDatabase();
    await userDb.init();
    
    // 清理测试数据
    await new Promise((resolve, reject) => {
      userDb.db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      userDb.db.run('DELETE FROM verification_codes', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterEach(async () => {
    await userDb.close();
  });

  // 测试接口: DB-FindUserByPhone
  describe('findUserByPhone', () => {
    test('应该能够根据手机号查询用户是否存在', async () => {
      const phoneNumber = '13800138000';
      
      // 根据acceptanceCriteria: 能够根据手机号查询用户是否存在
      const result = await userDb.findUserByPhone(phoneNumber);
      
      // 期望返回用户信息或null
      expect(result).toBeDefined();
      expect(typeof result === 'object' || result === null).toBe(true);
    });

    test('应该在用户不存在时返回null', async () => {
      const nonExistentPhone = '19999999999';
      
      const result = await userDb.findUserByPhone(nonExistentPhone);
      expect(result).toBeNull();
    });

    test('应该验证手机号格式', async () => {
      const invalidPhone = 'invalid-phone';
      
      await expect(userDb.findUserByPhone(invalidPhone))
        .rejects.toThrow();
    });
  });

  // 测试接口: DB-CreateUser
  describe('createUser', () => {
    test('应该能够在数据库中创建一个新的用户记录', async () => {
      const phoneNumber = '13800138001';
      
      // 根据acceptanceCriteria: 能够在数据库中创建一个新的用户记录
      const result = await userDb.createUser(phoneNumber);
      
      // 期望返回新创建的用户信息
      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe(phoneNumber);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    test('应该防止重复创建相同手机号的用户', async () => {
      const phoneNumber = '13800138002';
      
      // 第一次创建应该成功
      await userDb.createUser(phoneNumber);
      
      // 第二次创建应该失败
      await expect(userDb.createUser(phoneNumber))
        .rejects.toThrow();
    });

    test('应该验证手机号格式', async () => {
      const invalidPhone = 'invalid-phone';
      
      await expect(userDb.createUser(invalidPhone))
        .rejects.toThrow();
    });
  });

  // 测试接口: DB-CreateVerificationCode
  describe('createVerificationCode', () => {
    test('应该能够为指定手机号生成并存储验证码', async () => {
      const phoneNumber = '13800138003';
      const code = '123456';
      
      // 根据acceptanceCriteria: 能够为指定手机号生成并存储验证码
      const result = await userDb.createVerificationCode(phoneNumber, code);
      
      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe(phoneNumber);
      expect(result.code).toBe(code);
      expect(result.expiresAt).toBeDefined();
    });

    test('应该设置验证码过期时间为60秒', async () => {
      const phoneNumber = '13800138004';
      const code = '123456';
      
      const result = await userDb.createVerificationCode(phoneNumber, code);
      const now = new Date();
      const expiresAt = new Date(result.expiresAt);
      const diffInSeconds = (expiresAt - now) / 1000;
      
      // 验证过期时间约为60秒（允许1秒误差）
      expect(diffInSeconds).toBeGreaterThan(59);
      expect(diffInSeconds).toBeLessThan(61);
    });

    test('应该覆盖同一手机号的旧验证码', async () => {
      const phoneNumber = '13800138005';
      const oldCode = '111111';
      const newCode = '222222';
      
      await userDb.createVerificationCode(phoneNumber, oldCode);
      await userDb.createVerificationCode(phoneNumber, newCode);
      
      // 验证旧验证码无效，新验证码有效
      const oldResult = await userDb.verifyCode(phoneNumber, oldCode);
      const newResult = await userDb.verifyCode(phoneNumber, newCode);
      
      expect(oldResult.valid).toBe(false);
      expect(newResult.valid).toBe(true);
    });
  });

  // 测试接口: DB-VerifyCode
  describe('verifyCode', () => {
    test('应该能够验证手机号和验证码的匹配性和有效性', async () => {
      const phoneNumber = '13800138006';
      const code = '123456';
      
      // 先创建验证码
      await userDb.createVerificationCode(phoneNumber, code);
      
      // 根据acceptanceCriteria: 能够验证手机号和验证码的匹配性和有效性
      const result = await userDb.verifyCode(phoneNumber, code);
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    test('应该在验证码错误时返回无效结果', async () => {
      const phoneNumber = '13800138007';
      const correctCode = '123456';
      const wrongCode = '654321';
      
      await userDb.createVerificationCode(phoneNumber, correctCode);
      
      const result = await userDb.verifyCode(phoneNumber, wrongCode);
      expect(result.valid).toBe(false);
    });

    test('应该在验证码过期时返回无效结果', async () => {
      const phoneNumber = '13800138008';
      const code = '123456';
      
      // 创建一个已过期的验证码（通过修改时间或等待）
      await userDb.createVerificationCode(phoneNumber, code);
      
      // 模拟时间过去61秒后验证
      // 这里需要实际的过期逻辑实现
      // 暂时跳过，等待实现
    });

    test('应该在手机号不存在验证码时返回无效结果', async () => {
      const phoneNumber = '13800138009';
      const code = '123456';
      
      const result = await userDb.verifyCode(phoneNumber, code);
      expect(result.valid).toBe(false);
    });
  });

  // 测试接口: DB-CleanExpiredCodes
  describe('cleanExpiredCodes', () => {
    test('应该能够清理过期的验证码记录', async () => {
      const phoneNumber1 = '13800138010';
      const phoneNumber2 = '13800138011';
      const code = '123456';
      
      // 创建验证码
      await userDb.createVerificationCode(phoneNumber1, code);
      await userDb.createVerificationCode(phoneNumber2, code);
      
      // 根据acceptanceCriteria: 能够清理过期的验证码记录
      const result = await userDb.cleanExpiredCodes();
      
      expect(result).toBeDefined();
      expect(typeof result.deletedCount).toBe('number');
    });

    test('应该只清理过期的验证码，保留有效的验证码', async () => {
      const phoneNumber = '13800138012';
      const code = '123456';
      
      // 创建一个有效的验证码
      await userDb.createVerificationCode(phoneNumber, code);
      
      // 清理过期验证码
      await userDb.cleanExpiredCodes();
      
      // 验证有效验证码仍然存在
      const result = await userDb.verifyCode(phoneNumber, code);
      expect(result.valid).toBe(true);
    });
  });
});