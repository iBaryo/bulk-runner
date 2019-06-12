type Maybe<T> = void | null | undefined | T;
type MaybePromiseOf<T> = Maybe<T | Promise<T>>;

export interface IBulkActions<T, R> {
  beforeAll?: (arr: T[], cache: object) => MaybePromiseOf<T[]>;
  beforeBulk?: (bulk: T[], buildNum: number) => MaybePromiseOf<T[]>;
  act: (item: T, cache: object) => MaybePromiseOf<R>;
  afterBulk?: (bulkRes: R[], cache: object) => MaybePromiseOf<R[]>;
  afterAll?: (res: R[], cache: object) => MaybePromiseOf<R[]>;
}

export default async function asyncBulkMap<T, R>(arr: T[],
                                                 bulkSize: number,
                                                 actions: IBulkActions<T, R>) {
  const cache = {};
  arr = (actions.beforeAll && await actions.beforeAll(arr, cache)) || arr;
  let res = [] as R[];
  for (let i = 0; i < Math.max(arr.length / bulkSize, 1); i++) {
    let bulk = arr.slice(i * bulkSize, i * bulkSize + bulkSize);
    bulk = (actions.beforeBulk && await actions.beforeBulk(bulk, i)) || bulk;
    let bulkRes = await Promise.all(bulk.map(o => actions.act(o, cache)) as R[]);
    bulkRes = (actions.afterBulk && await actions.afterBulk(bulkRes, cache)) || bulkRes;
    res = res.concat(bulkRes);
  }

  return (actions.afterAll && await actions.afterAll(res, cache)) || res;
}