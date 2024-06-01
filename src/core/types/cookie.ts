export interface CookieOption {
	domain?: string;
	path?: string;
	secure?: boolean;
	httpOnly?: boolean;
	expire?: string;
}

export type Cookie = CookieOption & { name: string; value: string; };
