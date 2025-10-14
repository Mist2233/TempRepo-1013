const express = require('express');
const router = express.Router();
const UserDatabase = require('../database/userDatabase');
const jwt = require('jsonwebtoken');

// 创建并初始化数据库实例
const userDb = new UserDatabase();
let dbInitialized = false;

// 初始化数据库
const initDatabase = async () => {
  if (!dbInitialized) {
    await userDb.init();
    dbInitialized = true;
  }
  return userDb;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 手机号格式验证
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
}

// 生成6位数字验证码
function generateVerificationCode() {
  // 在测试环境中使用固定验证码
  if (process.env.NODE_ENV === 'test') {
    return '123456';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成JWT令牌
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, phoneNumber: user.phoneNumber },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// 发送验证码接口
// 接口ID: API-POST-SendVerificationCode
router.post('/send-verification-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // 验证手机号格式的正确性
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    // 确保数据库已初始化
    const db = await initDatabase();

    // 检查频率限制：同一手机号60秒内只能发送一次验证码
    const existingCode = await db.getValidVerificationCode(phoneNumber);
    if (existingCode) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }

    // 生成6位数字验证码
    const verificationCode = generateVerificationCode();

    // 在控制台打印验证码（用于测试）
    console.log(`验证码 for ${phoneNumber}: ${verificationCode}`);

    // 存储验证码到数据库（有效期60秒）
    await db.createVerificationCode(phoneNumber, verificationCode);

    // 清理过期验证码
    await db.cleanExpiredCodes();

    res.status(200).json({ 
      success: true,
      message: '验证码发送成功',
      expiresIn: 60
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 用户登录接口
// 接口ID: API-POST-Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    // 验证手机号格式的正确性
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    if (!verificationCode) {
      return res.status(400).json({ error: '请输入验证码' });
    }

    // 确保数据库已初始化
    const db = await initDatabase();

    // 检查手机号是否已注册
    const user = await db.findUserByPhone(phoneNumber);
    if (!user) {
      return res.status(400).json({ error: '手机号未注册，请先注册' });
    }

    // 验证验证码的正确性和有效性
    const verifyResult = await db.verifyCode(phoneNumber, verificationCode);
    if (!verifyResult.valid) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 登录成功后返回用户信息和认证令牌
    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: '登录成功',
      userInfo: { 
        id: user.id,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 用户注册接口
// 接口ID: API-POST-Register
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, verificationCode, agreeToTerms } = req.body;

    // 验证手机号格式的正确性
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    // 验证用户是否同意用户协议
    if (!agreeToTerms) {
      return res.status(400).json({ error: '请先同意用户协议' });
    }

    if (!verificationCode) {
      return res.status(400).json({ error: '请输入验证码' });
    }

    // 确保数据库已初始化
    const db = await initDatabase();

    // 验证验证码的正确性和有效性
    const verifyResult = await db.verifyCode(phoneNumber, verificationCode);
    if (!verifyResult.valid) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 检查手机号是否已注册
    let user = await db.findUserByPhone(phoneNumber);
    
    if (user) {
      // 如果手机号已注册，直接登录用户
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: '用户已存在，已为您自动登录',
        userInfo: { 
          id: user.id,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        },
        userId: user.id,
        token: token
      });
    } else {
      // 如果手机号未注册，创建新用户并登录
      user = await db.createUser(phoneNumber);
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: '注册成功',
        userInfo: { 
          id: user.id,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        },
        userId: user.id,
        token: token
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;