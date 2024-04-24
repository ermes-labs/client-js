export type SessionToken = {
  host: string;
  sessionId: string;
};

export type ErmesClientOptions =
  | {
      // The name of the header that contains the session token.
      tokenHeaderName?: string;
    }
  | {
      // The name of the header that contains the session token.
      tokenHeaderName?: string;
      // The initial origin of the Ermes server.
      initialOrigin: string | URL;
    }
  | {
      // The name of the header that contains the session token.
      tokenHeaderName?: string;
      // The initial session token that the client should use.
      initialToken: SessionToken;
      // The scheme to use when connecting to the Ermes server.
      scheme?: "http" | "https";
    };

export class ErmesClient {
  // The default name of the header that contains the session token.
  public static readonly defaultTokenHeaderName = "X-ErmesSessionToken";
  // The scheme to use when connecting to the Ermes server.
  private readonly scheme: "http" | "https";
  // The name of the header that contains the session token.
  private readonly tokenHeaderName: string;
  // Field that contains either the session token or the initial host if the
  // session token has not been retrieved yet.
  private tokenOrInitialHost: SessionToken | string;

  public constructor(options: ErmesClientOptions = {}) {
    // Default the token header name to "X-SessionToken" if not provided.
    this.tokenHeaderName =
      options.tokenHeaderName ?? ErmesClient.defaultTokenHeaderName;

    if ("initialOrigin" in options) {
      // If the initial origin is provided, use it.
      const url = new URL(options.initialOrigin);
      // Set the initial host.
      this.tokenOrInitialHost = url.host;
      // Default the scheme to "https" if not provided.
      this.scheme = url.protocol.replace(":", "") as "http" | "https";
    } else if ("initialToken" in options) {
      // If the initial token is provided, use it.
      this.tokenOrInitialHost = options.initialToken;
      // Default the scheme to "https" if not provided.
      this.scheme = options.scheme ?? "https";
      // Throw an error if the initial origin ends with a slash.
      if (options.initialToken.host.endsWith("/"))
        throw new Error("initialHost cannot end with a slash.");
    } else if (typeof window !== "undefined") {
      // If the token and the initial origin are not provided, and the client is
      // running in the browser, use the current origin.
      const url = new URL(window.location.origin);
      // Set the initial host.
      this.tokenOrInitialHost = url.host;
      // Set the scheme.
      this.scheme = url.protocol.replace(":", "") as "http" | "https";
    } else {
      // If the token and the initial origin are not provided, and the client is
      // not running in the browser, throw an error.
      throw new Error("Either initialOrigin or initialToken must be set.");
    }
  }

  public async fetch(path: string, options?: RequestInit): Promise<Response> {
    // Determine the URL to fetch.
    const url =
      typeof this.tokenOrInitialHost === "string"
        ? `${this.scheme}://${this.tokenOrInitialHost}${path}`
        : `${this.scheme}://${this.tokenOrInitialHost.host}${path}`;

    // Copy the request headers.
    const headers = new Headers(options?.headers);
    // If the token is present.
    if (typeof this.tokenOrInitialHost === "object") {
      // Add the token to the request headers.
      headers.set(
        this.tokenHeaderName,
        JSON.stringify(this.tokenOrInitialHost),
      );
    }

    // Copy the options and update the headers and credentials.
    options = {
      ...options,
      // Include cookies in the request.
      credentials: "include",
      // Update the headers.
      headers,
    };

    // Make the request.
    const response = await fetch(url, options);

    // If the response is ok, and the token header is present, update the token.
    if (response.ok) {
      const token = response.headers.get(this.tokenHeaderName);
      if (token) {
        this.tokenOrInitialHost = JSON.parse(token);
      }
    }

    // Return the response.
    return response;
  }

  public get token(): SessionToken | undefined {
    return typeof this.tokenOrInitialHost === "object"
      ? { ...this.tokenOrInitialHost }
      : undefined;
  }
}
