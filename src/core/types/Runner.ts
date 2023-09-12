import type { Context } from '../types/context';
import type { K99Response } from '../types/K99Response';

export interface Runner {
	(context: Context, run: () => Promise<K99Response | null>): Promise<K99Response | null>
}
