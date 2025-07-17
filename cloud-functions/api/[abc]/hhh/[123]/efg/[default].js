export default function onRequest(context) {
  return new Response('Hello World default' + JSON.stringify(context.params));
}