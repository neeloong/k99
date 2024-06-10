import { start, options } from 'k99/cli';
import { run, getArgv } from 'entry-cli';

/**
 * @param {string[]} argv
 */
(async (argv) => {
	/** @type {[options, string[]]} */
	const [opt, args] = await getArgv(/** @type {any} */(options), argv);
	run(/** @type {import('entry-cli').Command<options>} */(start), /** @type {any} */(opt), ...args);
})(process.argv.slice(2));
