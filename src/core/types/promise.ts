export type MaybePromise<T> = T | PromiseLike<T>;
export type PromiseValue<T> = T extends PromiseLike<infer V> ? V : T;
