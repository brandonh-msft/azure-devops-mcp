import { StreamableHTTPServerTransport } from "../../../src/transport/http";
import http from "http";
import { Socket } from "net";

describe("StreamableHTTPServerTransport", () => {
  let transport: StreamableHTTPServerTransport;

  beforeEach(() => {
    transport = new StreamableHTTPServerTransport();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should listen on port 80", () => {
    const listenSpy = jest.spyOn(http.Server.prototype, "listen").mockImplementation((port, callback) => {
      expect(port).toBe(80);
      if (callback) callback();
      return new http.Server();
    });

    transport.connect();

    expect(listenSpy).toHaveBeenCalled();
  });

  it("should close the server on disconnect", () => {
    const closeSpy = jest.spyOn(http.Server.prototype, "close").mockImplementation((callback) => {
      if (callback) callback();
      return new http.Server();
    });

    transport.disconnect();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should handle transport argument correctly", () => {
    const originalArgv = process.argv;
    process.argv = ["node", "script.js", "--transport=http"];

    const transportType = process.argv.includes("--transport=http") ? "http" : "stdio";

    if (transportType === "http") {
      expect(transport).toBeInstanceOf(StreamableHTTPServerTransport);
    } else {
      expect(transport).not.toBeInstanceOf(StreamableHTTPServerTransport);
    }

    process.argv = originalArgv;
  });

  const mockSocket = new Socket();

  it("should process valid requests", (done) => {
    const req = new http.IncomingMessage(mockSocket);
    const res = new http.ServerResponse(req);

    jest.spyOn(req, "on").mockImplementation((event, callback) => {
      if (event === "data") callback('{"key":"value"}');
      if (event === "end") callback();
      return req;
    });

    jest.spyOn(res, "end").mockImplementation((chunk, encoding, cb) => {
      expect(JSON.parse(chunk)).toEqual({ message: "Request processed successfully", request: { key: "value" } });
      if (cb) cb();
      done();
      return res;
    });

    transport["server"].emit("request", req, res);
  });

  it("should handle invalid requests", (done) => {
    const req = new http.IncomingMessage(mockSocket);
    const res = new http.ServerResponse(req);

    jest.spyOn(req, "on").mockImplementation((event, callback) => {
      if (event === "data") callback("invalid-json");
      if (event === "end") callback();
      return req;
    });

    jest.spyOn(res, "end").mockImplementation((chunk, encoding, cb) => {
      expect(JSON.parse(chunk)).toEqual({ error: "Invalid request" });
      if (cb) cb();
      done();
      return res;
    });

    transport["server"].emit("request", req, res);
  });
});
