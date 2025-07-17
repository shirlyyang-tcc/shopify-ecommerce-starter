export async function onRequest(context) {
  // console.log('check context', context);
  return new Response("Hello, world!" + JSON.stringify(context.params))
} 