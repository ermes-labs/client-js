import { type RollupOptions } from "rollup";
import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import pkg from "./package.json" assert { type: "json" };

const banner = `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.homepage}
 * Copyright (c) 2023-present, ermes-labs
 * https://github.com/ermes-labs/${pkg.name}/blob/main/LICENSE
 * @license MIT
 */
`;

const bundle = (config: RollupOptions): RollupOptions => ({
	...config,
	input: "src/index.ts",
	external: (id) => !/^[./]/.test(id),
});

export default [
	bundle({
		plugins: [esbuild()],
		output: [
			{
				file: "./dist/index.js",
				format: "cjs",
				sourcemap: true,
				banner,
			},
			{
				file: "./dist/index.esm.js",
				format: "es",
				sourcemap: true,
				banner,
			},
		],
	}),
	bundle({
		plugins: [dts()],
		output: {
			file: "./dist/index.d.ts",
			format: "es",
			banner,
		},
	}),
];
