// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { createServer } from "http";

export class StreamableHTTPServerTransport {
  private server;

  constructor() {
    this.server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        this.handleRequest(body, (response) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        });
      });
    });
  }

  async connect() {
    this.server.listen(80, () => {
      console.log("HTTP transport listening on port 80");
    });
  }

  async disconnect() {
    this.server.close(() => {
      console.log("HTTP transport disconnected");
    });
  }

  private handleRequest(body: string, callback: (response: object) => void) {
    try {
      const request = JSON.parse(body);
      const response = { message: "Request processed successfully", request };
      callback(response);
    } catch {
      callback({ error: "Invalid request" });
    }
  }
}
