export type Maybe<T> = void | null | undefined | T;
export type MaybePromiseOf<T> = Maybe<T | Promise<T>>;


export interface IBulkArrangeActions<T, R> {
  beforeAll?: (arr: T[]) => MaybePromiseOf<T[]>;
  beforeBulk?: (bulk: T[], bulkIndex: number) => MaybePromiseOf<T[]>;
  afterBulk?: (bulkRes: R[]) => MaybePromiseOf<R[]>;
  afterAll?: (res: R[]) => MaybePromiseOf<R[]>;
}