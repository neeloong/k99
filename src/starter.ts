import { start, options } from 'k99/cli';
import type { Command } from 'entry-cli';
import { run, getArgv } from 'entry-cli';

(async (argv: string[]) => {
	const [opt, args] = await getArgv<options>(options as any, argv);
	run<options>(start as Command<options>, opt as options, ...args);
})(process.argv.slice(2));
