import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import ChinaRailway from "./chinaRailway.js";

const app = express();

// Create an MCP server
const server = new McpServer({
    name: "12306票次查询",
    version: "1.0.0"
});

// Add an addition tool
server.tool("search",
    "查询12306火车票",
    {
        "date": z.string().date().describe("出发日期 格式：YYYY-MM-DD"),
        "fromCity": z.string().describe("出发城市"),
        "toCity": z.string().describe("到达城市")
    },
    async ({date, fromCity, toCity}) => {
        try {

            console.log("开始查询", date, fromCity, toCity);

            const tickets = await ChinaRailway.searchTickets(date, fromCity, toCity)

            const list = [];
            for (const item of tickets) {
                let object = {
                    "车次": item.station_train_code,
                    "出发站": item.from_station_name,
                    "到达站": item.to_station_name,
                    "出发时间": item.start_time,
                    "到达时间": item.arrive_time,
                    "历时": item.lishi,
                    "备注": item.buttonTextInfo,
                    "票列表": item.tickets
                }
                list.push(object)
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(list)
                }]
            };

        }catch (e) {
            console.error("搜索失败",e)
            return {
                content: [{type: "text", text: e.message}],
                isError: true
            }
        }
    }
);


let transport = null;

app.get("/sse", (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
});

app.post("/messages", (req, res) => {
    if (transport) {
        transport.handlePostMessage(req, res);
    }
});

app.listen(3000);

console.log("Server is running on http://localhost:3000/sse");
