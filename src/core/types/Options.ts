import type { Runner } from './Runner';

export interface Options {
	runner?: Runner;
	method?: string | ((request: Request) => string);
}
