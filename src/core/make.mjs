import main from './main/index.mjs';

/**
 * 
 * @param {import('./main/types').FindHandler} getHandler 
 * @param {import('./main/types').Options} options 
 * @returns {(request: Request) => Promise<Response | null>}
 */
export default function make(getHandler, options) {
	return (r) => main(r, getHandler, options);
}
