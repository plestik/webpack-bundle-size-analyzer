/// <reference path="../typings/typings.d.ts" />

import {expect} from 'chai';
import fs = require('fs');
import path = require('path');

import size_tree = require('../size_tree');
import webpack_stats = require('../webpack_stats');

describe('printDependencySizeTree()', () => {
	it('should print the size tree', () => {
		let output = '';

		const statsJsonStr = fs.readFileSync(path.join('tests', 'stats.json')).toString();
		const statsJson = <webpack_stats.WebpackJsonOutput>JSON.parse(statsJsonStr);

		// convert paths in Json to WIN if necessary
		if(path.sep !== '/') {
			statsJson.modules.forEach(module => {
				module.identifier = module.identifier.replace(/\//g, path.sep);
			});
		}

		const depsTree = size_tree.dependencySizeTree(statsJson);
		size_tree.printDependencySizeTree(depsTree, 0, line => output += '\n' + line);

		expect(output).to.equal(
`
marked: 27.53 kB (14.9%)
  <self>: 27.53 kB (100%)
lru-cache: 6.29 kB (3.40%)
  <self>: 6.29 kB (100%)
style-loader: 717 B (0.379%)
  <self>: 717 B (100%)
<self>: 150.33 kB (81.3%)`
);
	});
});

describe('dependencySizeTree()', () => {
	it('should produce correct results where loaders are used', () => {
		let webpackOutput: webpack_stats.WebpackJsonOutput = {
			version: '1.2.3',
			hash: 'unused',
			time: 100,
			assetsByChunkName: {},
			assets: [],
			chunks: [],
			modules: [{
				id: 0,
				identifier: path.join('/', 'to', 'loader.js!', 'path', 'to', 'project', 'node_modules', 'dep', 'foo.js'),
				size: 1234,
				name: path.join('.', 'foo.js')
			}]
		};
		const depsTree = size_tree.dependencySizeTree(webpackOutput);
		expect(depsTree).to.deep.equal({
			packageName: '<root>',
			size: 1234,
			children: [{
				packageName: 'dep',
				size: 1234,
				children: []
			}]
		});
	});
});
