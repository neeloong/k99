import type { Context } from '../types/context';

export interface Runner {
	(context: Context, run: () => Promise<Response | null>): Promise<Response | null>
}
