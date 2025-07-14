import Koa from 'koa';
import Router from '@koa/router';

// 创建 Koa 应用
const app = new Koa();
const router = new Router();

// 添加一些中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// 定义路由
router.get('/', async (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };
});

router.get('/users', async (ctx) => {
  ctx.body = { users: ['user1', 'user2', 'user3'] };
});

router.post('/users', async (ctx) => {
  // 这里应该有请求体解析的中间件，但为了示例简单起见，我们假设数据已经解析
  ctx.body = { message: 'User created' };
  ctx.status = 201;
});

// 使用路由中间件
app.use(router.routes());
app.use(router.allowedMethods());

// 导出处理函数
export const onRequest = createEdgeOneHandler(app); 