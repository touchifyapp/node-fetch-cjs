test("should import built file", () => {
    require("../dist");
});

test("should export defaut fetch", () => {
    const { default: fetch } = require("../dist");
    expect(typeof fetch).toBe("function");
});

test("should export AbortError", () => {
    const { AbortError } = require("../dist");
    const err = new AbortError("msg");
    expect(err.message).toBe("msg");
});

test("should export FetchError", () => {
    const { FetchError } = require("../dist");
    const err = new FetchError("msg", "type", {});
    expect(err.message).toBe("msg");
});

test("should export Headers", () => {
    const { Headers } = require("../dist");
    const headers = new Headers({ "Content-Type": "text/plain" });
    expect(headers.get("content-type")).toBe("text/plain");
});

test("should export Request", () => {
    const { Request } = require("../dist");
    const req = new Request("http://host", { method: "POST" });
    expect(req.url).toBe("http://host/");
    expect(req.method).toBe("POST");
});

test("should export Response", async () => {
    const { Response, Headers } = require("../dist");
    const res = new Response("response", { headers: new Headers({ "Content-Type": "text/plain" }) });
    expect(await res.text()).toBe("response");
    expect(res.headers.get("content-type")).toBe("text/plain");
});

test("should export isRedirect", async () => {
    const { isRedirect } = require("../dist");
    expect(typeof isRedirect).toBe("function");
});

/*
AbortError,
FetchError,
Headers,
Request,
Response,
isRedirect*/