import {
	assert,
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	should,
	test,
	vi,
} from "vitest";
import { ErmesClient, ErmesClientOptions, ErmesToken } from "./index";

const fetch = (globalThis.fetch = vi.fn());

const mockFetch = (
	client: ErmesClient,
	resource: string,
	responseErmesToken?: ErmesToken | undefined,
	responseErmesTokenHeaderName: string = ErmesClient.defaultTokenHeaderName,
) => {
	const init: ResponseInit = {
		...(responseErmesToken !== undefined && {
			headers: {
				[responseErmesTokenHeaderName]: JSON.stringify(responseErmesToken),
			},
		}),
	};

	const response = new Response(undefined, init);
	fetch.mockResolvedValueOnce(response);
	client.fetch(resource);
	return response;
};

beforeEach(() => {
	globalThis.window = { location: { origin: "origin" } } as any;
	return () => {
		globalThis.window = undefined as any;
	};
});

describe("ErmesClient", () => {
	test("should initialize with default options", () => {
		globalThis.window = undefined as any;
		expect(() => new ErmesClient()).toThrow();
	});

	test("should initialize with default options", () => {
		const client = new ErmesClient();
		const resource = "/resource";
		mockFetch(client, resource);

		expect(fetch).toHaveBeenCalledWith(
			`${window.location.origin}${resource}`,
			undefined,
		);
	});

	test("should initialize with initialOrigin", () => {
		const options: ErmesClientOptions = { initialOrigin: "initialOrigin" };
		const client = new ErmesClient(options);
		const resource = "/resource";
		mockFetch(client, resource);

		assert(window.location.origin !== options.initialOrigin);
		expect(fetch).toHaveBeenCalledWith(
			`${options.initialOrigin}${resource}`,
			undefined,
		);
	});
});
