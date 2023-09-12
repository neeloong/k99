import type { CommandList } from 'entry-cli';
import { cli } from 'entry-cli';
import { command, options } from 'k99/cli';

cli(command as CommandList<options>, options as any, {
	execCmd: 'k99',
})(process.argv.slice(2));
