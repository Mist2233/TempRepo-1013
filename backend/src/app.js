const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/auth', authRoutes);

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'SEPM Backend API' });
});

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;