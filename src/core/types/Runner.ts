import type { Context } from './context';

export interface Runner {
	(context: Context, run: () => Promise<Response | null>): Promise<Response | null>
}
