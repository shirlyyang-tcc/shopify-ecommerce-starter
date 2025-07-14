// Get cart information function
import { sayHello2 } from './2';
// type TestType = {
//   name: string
// }
export async function onRequest(req, context) {
  console.log('check context', context);
  // const test: TestType = {
  //   name: "test"
  // }
  // return new Response("Hello, world 1!" + JSON.stringify(context.params) + JSON.stringify(test))
  const res = await sayHello2();
  return res;
} 