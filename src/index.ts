export type ErmesToken = {
	sessionId: string;
	origin: string;
};

export type ErmesClientOptions = {
	// Name of the header containing the token.
	tokenHeaderName?: string;
} & (
	| {
			initialOrigin?: string;
			initialToken?: never;
	  }
	| {
			initialOrigin?: never;
			initialToken?: ErmesToken;
	  }
);

export class ErmesClient {
	private readonly tokenHeaderName: string;
	private tokenOrInitialOrigin: ErmesToken | string;

	constructor(options: ErmesClientOptions = {}) {
		// Default the token header name to "X-ErmesToken" if not provided.
		this.tokenHeaderName = options.tokenHeaderName ?? "X-ErmesToken";

		// Determine the token or the initial origin.
		const tokenOrInitialOrigin =
			// If the token is provided, use it.
			options.initialToken ??
			// If the initial origin is provided, use it.
			options.initialOrigin ??
			// If the token and the initial origin are not provided, and the client is
			// running in the browser, use the current origin.
			(window !== undefined ? window.location.origin : undefined);

		// If the initial origin cannot be determined, throw an error.
		if (tokenOrInitialOrigin === undefined) {
			throw new Error("Either initialOrigin or initialToken must be set.");
		}

		// Set the token or initial origin.
		this.tokenOrInitialOrigin = tokenOrInitialOrigin;
	}

	async fetch(url: string, options?: RequestInit): Promise<Response> {
		const fullUrl =
			typeof this.tokenOrInitialOrigin === "string"
				? `${this.tokenOrInitialOrigin}${url}`
				: `${this.tokenOrInitialOrigin.origin}${url}`;

		// If the filed is a token, add it to the request options.
		if (this.tokenOrInitialOrigin === "object") {
			options = {
				...options,
				// Include cookies in the request.
				credentials: "include",
				headers: {
					...options?.headers,
					// Add the token to the request headers.
					[this.tokenHeaderName]: JSON.stringify(this.tokenOrInitialOrigin),
				},
			};
		}

		// Make the request.
		const response = await fetch(fullUrl, options);

		// If the response is ok, and the token header is present, update the token.
		if (response.ok) {
			const token = response.headers.get(this.tokenHeaderName);
			if (token) {
				this.tokenOrInitialOrigin = JSON.parse(token);
			}
		}

		// Return the response.
		return response;
	}
}
