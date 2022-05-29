import {start, options} from 'k99/cli';
import { run, getArgv, Command } from 'entry-cli';

(async (argv: string[]) => {
	const [opt, args] = await getArgv<options>(options, argv);
	run<options>(start as Command<options>, opt as options, ...args);
})(process.argv.slice(2));
