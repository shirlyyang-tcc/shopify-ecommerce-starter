export default function onRequest(context) {
  return new Response('Hello World1234'+JSON.stringify(context.params));
}