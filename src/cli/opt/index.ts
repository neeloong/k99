import * as listen from './listen';
import * as path from './path';
import * as port from './port';
import * as bind from './bind';

import {OptType} from 'entry-cli';
export const opt = {
	bind,
	listen,
	path,
	port,
};

export type List = keyof typeof opt;
type opt = OptType<typeof opt>;
export default opt;
