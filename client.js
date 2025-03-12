import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
    new URL("http://localhost:3000/sse")
);

const client = new Client(
    {
        name: "example-client",
        version: "1.0.0"
    }
);

await client.connect(transport);
//
// // List prompts
// const prompts = await client.listPrompts();
//
// // Get a prompt
// const prompt = await client.getPrompt("example-prompt", {
//     arg1: "value"
// });
//
// // List resources
// const resources = await client.listResources();
//
// // Read a resource
// const resource = await client.readResource("file:///example.txt");

// Call a tool
const result = await client.callTool({
    name: "search",
    arguments: {
        date: "2025-03-12",
        fromCity: "重庆",
        toCity: "北京"
    }
});

console.log('result', result);