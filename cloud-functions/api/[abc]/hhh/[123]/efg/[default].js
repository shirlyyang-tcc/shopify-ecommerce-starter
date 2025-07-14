export default function onRequest(req, context) {
  return new Response('Hello World default' + JSON.stringify(context));
}