/** @import { Context } from './main/types.js' */
export default class Param {
	#symbol = Symbol();
	get name() { return this.#symbol}
	#pattern
	get pattern() { return this.#pattern; }
	/**
	 * 
	 * @param {RegExp?} [pattern] 
	 */
	constructor(pattern) {
		this.#pattern = pattern;
	}
	/**
	 * 
	 * @param {Context} ctx 
	 * @returns {string?}
	 */
	param(ctx) {
		const param = ctx.params[this.#symbol];
		if (Array.isArray(param)) { return param[0] ?? null; }
		return param ?? null;
	}
	/**
	 * 
	 * @param {Context} ctx 
	 * @returns {string[]?}
	 */
	params(ctx) {
		const param = ctx.params[this.#symbol];
		if (typeof param === 'string') { return [param]; }
		if (Array.isArray(param)) { return param; }
		return null;
	}
}
