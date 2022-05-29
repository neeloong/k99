import {cli, CommandList} from 'entry-cli';
import {command, options} from 'k99/cli';

cli(command as CommandList<options>, options, {
	execCmd: 'k99',
})(process.argv.slice(2));
