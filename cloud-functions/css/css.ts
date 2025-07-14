import { readFileSync } from 'fs';
import { join } from 'path';

export default function onRequest(req, context) {
  try {
    // 读取 CSS 文件内容
    const cssContent = readFileSync(join(process.cwd(), 'public', 'test.css'), 'utf-8');
    
    // 返回带有正确 Content-Type 的响应
    return new Response(cssContent, {
      headers: {
        'content-type': 'text/css; charset=UTF-8',
        'cache-control': 'public, max-age=31536000', // 缓存一年
      },
    });
  } catch {
    // 如果文件不存在或读取失败，返回 404
    return new Response('CSS file not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=UTF-8',
      },
    });
  }
}