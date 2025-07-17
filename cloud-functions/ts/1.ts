// Get cart information function
import { sayHello3 } from "../../backup/3";
// type TestType = {
//   name: string
// }
export async function onRequest(context) {
  console.log('check context', context);
  // const test: TestType = {
  //   name: "test"
  // }
  // return new Response("Hello, world 1!" + JSON.stringify(context.params) + JSON.stringify(test))
  const res = await sayHello3();
  return res;
} 