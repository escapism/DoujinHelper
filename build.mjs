import path from 'path';
import { rollup } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import glob from 'glob';
import resourcedata from './resourcedata.mjs';

const srcDir = "./src";
const distDir = "./dist";

let pattern = process.argv[2] ? process.argv[2].replace(/\.js$/, '') : '*'

const build = (inputOptions, outputOptions) => {
	return rollup(inputOptions)
		.then(bundle => {
			bundle.write(outputOptions);
		})
		.catch(e => {
			console.log(e);
		})
}

glob.sync(`${pattern}.js`, {
	cwd: srcDir,
	ignore: 'modules/**'
}).forEach(async entry => {
	const filename = entry.replace(/\.js$/, '');

	const resource = resourcedata[filename] ?? {}
	let banner = `/*
 * ${filename}
 * Version ${resource.ver ?? '1.0'}
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */\n\n`

	banner += "/*\n<javascriptresource>\n"

	if (resource) {
		Object.keys(resource).forEach(key => {
			if (key === 'ver') return
			banner += `<${key}>${resource[key]}</${key}>\n`
		})
	} else {
		banner += `<name>${filename}</name>\n`
	}

	banner += "</javascriptresource>\n*/\n\n"
	banner += "#target photoshop\n\n"
	banner += `var NAME = '${filename}';\n`

	const inputOptions = {
		input: path.resolve(srcDir, entry),
		plugins: [babel({ babelHelpers: 'bundled' })]
	};
	const outputOptions = {
		format: "es",
		file: path.resolve(distDir, `${filename}.jsx`),
		banner
	};
	await build(inputOptions, outputOptions);
})