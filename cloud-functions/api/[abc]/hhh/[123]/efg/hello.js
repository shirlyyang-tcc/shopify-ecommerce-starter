export default function onRequest(context) {
  console.log('check context', context);
  return new Response('Hello World' + JSON.stringify(context.params));
}