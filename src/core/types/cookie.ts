export interface CookieClearOption {
	domain?: string;
	path?: string;
	secure?: boolean;
	httpOnly?: boolean;
}
export interface CookieOption extends CookieClearOption {
	expire?: string;
}

export interface CookieOptionInfo extends CookieOption {
	value: string;
}
