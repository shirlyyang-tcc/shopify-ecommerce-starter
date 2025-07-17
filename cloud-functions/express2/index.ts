import express from 'express';
import path from 'path';
const app = express();

// 添加日志中间件
app.use((req, res, next) => {
  console.log('request url', req.url);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 添加根路由处理
app.get('/', (req, res) => {
  res.json({ message: 'Express root path' });
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Test User' });
});

app.use("/static", express.static(path.join(__dirname, "public")));

// 导出处理函数
export const onRequest = createEdgeOneHandler(app); 