export async function onRequest(req, context) {
  console.log('check context', context);
  return new Response("Hello, world!" + JSON.stringify(context.params))
} 