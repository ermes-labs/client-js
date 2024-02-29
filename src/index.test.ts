import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ErmesClient, ErmesClientOptions, SessionToken } from "./index";

// Mock fetch.
let fetch = (globalThis.fetch = mock(() => {}) as any);

// Mock fetch response.
const mockFetchCall = async (
  client: ErmesClient,
  resource: string,
  responseSessionToken?: SessionToken | undefined,
  responseSessionTokenHeaderName: string = ErmesClient.defaultTokenHeaderName,
) => {
  const response = new Response(undefined, { status: 200 });
  if (responseSessionToken !== undefined)
    response.headers.set(
      responseSessionTokenHeaderName,
      JSON.stringify(responseSessionToken),
    );

  fetch = globalThis.fetch = mock(() => {}) as any;
  fetch.mockResolvedValueOnce(response);
  await client.fetch(resource);
  return response;
};

// Mock the window object.
beforeEach(() => {
  globalThis.window = { location: { origin: "https://origin.com" } } as any;
  return () => {
    globalThis.window = undefined as any;
  };
});

describe("ErmesClient", () => {
  test("should throw if no host is provided and the client is not running in the browser", () => {
    globalThis.window = undefined as any;
    expect(() => new ErmesClient()).toThrow();
  });

  test("should initialize with default options", async () => {
    const client = new ErmesClient();
    const resource = "/resource";
    await mockFetchCall(client, resource);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${window.location.origin}${resource}`, {
      credentials: "include",
      headers: {},
    });
  });

  test("should use initialHost", async () => {
    const options: ErmesClientOptions = {
      initialOrigin: "https://initial-origin.com",
    };
    const client = new ErmesClient(options);
    const resource = "/resource";
    await mockFetchCall(client, resource);

    expect(
      new URL(window.location.origin).host !== options.initialOrigin,
    ).toBeTrue();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${options.initialOrigin}${resource}`, {
      credentials: "include",
      headers: {},
    });
  });

  test("should use custom token header name", async () => {
    const options: ErmesClientOptions = {
      tokenHeaderName: "X-CustomTokenHeaderName",
    };
    const client = new ErmesClient(options);
    const token: SessionToken = { sessionId: "session-id", host: "host.com" };
    const resource = "/resource";
    await mockFetchCall(client, resource, token, "X-CustomTokenHeaderName");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(client.token).toEqual(token);
  });

  test("should use the returned token for subsequent requests", async () => {
    const client = new ErmesClient();
    const token: SessionToken = { sessionId: "session-id", host: "host.com" };
    const resource = "/resource";
    await mockFetchCall(client, resource, token);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(client.token).toEqual(token);

    await mockFetchCall(client, resource, token);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `${new URL(window.location.origin).protocol}//${token.host}${resource}`,
      {
        credentials: "include",
        headers: new Headers({
          [ErmesClient.defaultTokenHeaderName]: JSON.stringify(token),
        }),
      },
    );
  });
});
