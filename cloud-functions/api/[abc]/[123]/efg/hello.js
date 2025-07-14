export default function onRequest(req, context) {
  return new Response('Hello World'+JSON.stringify(context));
}