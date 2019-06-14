import { IBulkArrangeActions, MaybePromiseOf } from './interfaces';

export interface IBulkActions<T, R> extends IBulkArrangeActions<T, R>{
  map: (item: T) => MaybePromiseOf<R>;
}

export async function asyncBulkMap<T, R>(arr: T[],
                                                 bulkSize: number,
                                                 actions: IBulkActions<T, R>) {
  arr = (actions.beforeAll && await actions.beforeAll(arr)) || arr;
  let res = [] as R[];
  for (let i = 0; i < Math.max(arr.length / bulkSize, 1); i++) {
    let bulk = arr.slice(i * bulkSize, i * bulkSize + bulkSize);
    bulk = (actions.beforeBulk && await actions.beforeBulk(bulk, i)) || bulk;
    let bulkRes = await Promise.all(bulk.map(item => actions.map(item) as R));
    bulkRes = (actions.afterBulk && await actions.afterBulk(bulkRes)) || bulkRes;
    res = res.concat(bulkRes);
  }

  return (actions.afterAll && await actions.afterAll(res)) || res;
}