// Get cart information function

type TestType = {
  name: string
}
export async function onRequest(context) {
  const test: TestType = {
    name: "test"
  }
  return new Response("Hello, world 1!" + JSON.stringify(context.params) + JSON.stringify(test))
} 