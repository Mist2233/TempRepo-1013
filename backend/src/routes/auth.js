const express = require('express');
const UserService = require('../database/userService');

// 创建路由工厂函数，可以接受UserService实例
function createAuthRouter(userServiceInstance = null) {
  const router = express.Router();
  const userService = userServiceInstance || new UserService();

// API-POST-GetVerificationCode: 获取验证码
router.post('/verification-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        error: '请输入正确的手机号码'
      });
    }
    
    // 生成6位数字验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 打印验证码到控制台（模拟发送短信）
    console.log(`验证码已发送到 ${phoneNumber}: ${verificationCode}`);
    
    // 存储验证码到数据库
    await userService.storeVerificationCode(phoneNumber, verificationCode);
    
    res.status(200).json({
      message: '验证码已发送',
      countdown: 60,
      phoneNumber: phoneNumber
    });
    
  } catch (error) {
    console.error('获取验证码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API-POST-Login: 用户登录
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    // 验证输入参数
    if (!phoneNumber || !verificationCode) {
      return res.status(400).json({ 
        error: '参数错误',
        message: '手机号和验证码不能为空'
      });
    }
    
    // 检查用户是否已注册
    const user = await userService.findUserByPhone(phoneNumber);
    if (!user) {
      return res.status(404).json({ 
        error: '该手机号未注册，请先完成注册',
        needRegister: true
      });
    }
    
    // 验证验证码
    const verifyResult = await userService.verifyCode(phoneNumber, verificationCode);
    
    if (!verifyResult.valid) {
      if (verifyResult.reason === 'expired') {
        return res.status(410).json({ 
          error: '验证码已过期',
          message: '请重新获取验证码'
        });
      } else {
        return res.status(400).json({ 
          error: '验证码错误',
          message: '请输入正确的验证码'
        });
      }
    }
    
    // 登录成功，生成简单的token（实际项目中应使用JWT）
    const token = `token_${user.id}_${Date.now()}`;
    
    res.status(200).json({
      message: '登录成功',
      userId: user.id,
      phoneNumber: user.phone_number,
      token: token
    });
    
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

  return router;
}

// 默认导出一个使用默认UserService的路由
module.exports = createAuthRouter();
// 同时导出工厂函数供测试使用
module.exports.createAuthRouter = createAuthRouter;