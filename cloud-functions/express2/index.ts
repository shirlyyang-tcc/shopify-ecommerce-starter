import express from 'express';

const app = express();

// 添加根路由处理
app.get('/', (req, res) => {
  res.json({ message: 'Express root path' });
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Test User' });
});

// 导出处理函数
export const onRequest = createEdgeOneHandler(app); 