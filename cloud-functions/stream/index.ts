import { Readable } from 'stream';

export async function onRequest() {
  // 创建一个自定义 Readable 流，每秒推送一段文本
  const stream = new Readable({
    read() {
      let count = 0;
      const interval = setInterval(() => {
        if (count < 5) {
          this.push(`chunk ${count + 1}\n`);
          count++;
        } else {
          this.push(null); // 结束流
          clearInterval(interval);
        }
      }, 1000);
    }
  });

  return new Response(stream as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
