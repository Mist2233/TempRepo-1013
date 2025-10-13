const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class UserService {
  constructor(sharedDb = null) {
    // 初始化数据库连接
    if (sharedDb) {
      this.db = sharedDb;
      this.ownDb = false; // 标记这不是我们自己创建的数据库
    } else {
      const dbPath = process.env.NODE_ENV === 'test' 
        ? ':memory:' 
        : path.join(__dirname, '../../../database.sqlite');
      
      this.db = new sqlite3.Database(dbPath);
      this.ownDb = true; // 标记这是我们自己创建的数据库
    }
    this.initializeTables();
  }

  // 初始化数据库表
  initializeTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 创建用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 创建验证码表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // DB-FindUserByPhone: 根据手机号查找用户记录
  async findUserByPhone(phoneNumber) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE phone_number = ?';
      this.db.get(query, [phoneNumber], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // DB-StoreVerificationCode: 存储验证码
  async storeVerificationCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      const expiresAt = new Date(Date.now() + 60 * 1000); // 60秒后过期
      
      this.db.serialize(() => {
        // 先删除该手机号的旧验证码
        this.db.run(
          'DELETE FROM verification_codes WHERE phone_number = ?',
          [phoneNumber]
        );
        
        // 插入新验证码
        this.db.run(
          'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)',
          [phoneNumber, code, expiresAt.toISOString()],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true, id: this.lastID });
            }
          }
        );
      });
    });
  }

  // DB-VerifyCode: 验证验证码
  async verifyCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      // 查找有效的验证码
      const query = `
        SELECT * FROM verification_codes 
        WHERE phone_number = ? AND code = ? AND expires_at > ?
      `;
      
      this.db.get(query, [phoneNumber, code, now], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row) {
          // 验证成功，删除验证码记录
          this.db.run(
            'DELETE FROM verification_codes WHERE id = ?',
            [row.id],
            (deleteErr) => {
              if (deleteErr) {
                reject(deleteErr);
              } else {
                resolve({ success: true, valid: true });
              }
            }
          );
        } else {
          // 检查是否是验证码错误还是过期
          this.db.get(
            'SELECT * FROM verification_codes WHERE phone_number = ? AND code = ?',
            [phoneNumber, code],
            (checkErr, expiredRow) => {
              if (checkErr) {
                reject(checkErr);
              } else if (expiredRow) {
                resolve({ success: true, valid: false, reason: 'expired' });
              } else {
                resolve({ success: true, valid: false, reason: 'incorrect' });
              }
            }
          );
        }
      });
    });
  }

  // 辅助方法：创建用户（用于测试）
  async createUser(phoneNumber) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users (phone_number) VALUES (?)';
      this.db.run(query, [phoneNumber], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, phone_number: phoneNumber });
        }
      });
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve) => {
      if (this.ownDb) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          resolve();
        });
      } else {
        resolve(); // 不关闭共享的数据库
      }
    });
  }
}

module.exports = UserService;