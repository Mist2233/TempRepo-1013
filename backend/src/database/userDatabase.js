const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// 手机号格式验证
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
}

class UserDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/users.db');
  }

  async init() {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 创建用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phoneNumber TEXT UNIQUE NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // 创建验证码表
          this.db.run(`
            CREATE TABLE IF NOT EXISTS verification_codes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              phoneNumber TEXT NOT NULL,
              code TEXT NOT NULL,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              expiresAt DATETIME NOT NULL,
              used BOOLEAN DEFAULT FALSE
            )
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  async findUserByPhone(phoneNumber) {
    return new Promise((resolve, reject) => {
      // 验证手机号格式
      if (!validatePhoneNumber(phoneNumber)) {
        reject(new Error('Invalid phone number format'));
        return;
      }
      
      this.db.get(
        'SELECT * FROM users WHERE phoneNumber = ?',
        [phoneNumber],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }

  async createUser(phoneNumber) {
    return new Promise((resolve, reject) => {
      // 验证手机号格式
      if (!validatePhoneNumber(phoneNumber)) {
        reject(new Error('Invalid phone number format'));
        return;
      }
      
      const userId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      
      this.db.run(
        'INSERT INTO users (id, phoneNumber, createdAt) VALUES (?, ?, ?)',
        [userId, phoneNumber, createdAt],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: userId, phoneNumber, createdAt });
          }
        }
      );
    });
  }

  async createVerificationCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 1000); // 60秒后过期

      // 先清理该手机号的旧验证码
      this.db.run(
        'DELETE FROM verification_codes WHERE phoneNumber = ?',
        [phoneNumber],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // 插入新验证码
          this.db.run(
            'INSERT INTO verification_codes (phoneNumber, code, expiresAt) VALUES (?, ?, ?)',
            [phoneNumber, code, expiresAt.toISOString()],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // 在控制台打印验证码以便测试
                console.log(`验证码已发送到 ${phoneNumber}: ${code}`);
                resolve({ phoneNumber, code, expiresAt: expiresAt.toISOString() });
              }
            }
          );
        }
      );
    });
  }

  async getValidVerificationCode(phoneNumber) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.get(
        'SELECT * FROM verification_codes WHERE phoneNumber = ? AND used = FALSE AND expiresAt > ?',
        [phoneNumber, now],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  }

  async verifyCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.get(
        'SELECT * FROM verification_codes WHERE phoneNumber = ? AND code = ? AND used = FALSE AND expiresAt > ?',
        [phoneNumber, code, now],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve({ valid: false });
            return;
          }

          // 标记验证码为已使用
          this.db.run(
            'UPDATE verification_codes SET used = TRUE WHERE id = ?',
            [row.id],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ valid: true });
              }
            }
          );
        }
      );
    });
  }

  async cleanExpiredCodes() {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.run(
        'DELETE FROM verification_codes WHERE expiresAt <= ? OR used = TRUE',
        [now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deletedCount: this.changes });
          }
        }
      );
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          resolve();
        });
      });
    }
  }
}

module.exports = UserDatabase;