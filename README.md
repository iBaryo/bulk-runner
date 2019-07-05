# Bulk Runner

Async processing of big arrays in bulks!

- split a big array into bulks.
- for each bulk, process each of its items.
- only when bulk processing is done, continue to the next bulk.
- return a result array of all bulk results concatenated.

## Install

```
npm install async-bulk-map
```

## Example

```typescript
import { asyncBulkMap } from 'async-bulk-map';

const bigArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const bulkSize = 2;

const res = await asyncBulkMap(bigArray, bulkSize, {
  beforeAll: originArray => {
    console.log(`starting map for ${originArray.length} items...`);
  },
  beforeBulk: (bulk, bulkIndex) => {
    console.log(`editing each bulk #${bulkIndex} before process`);
    return Promise.all(bulk.map(item => Promise.resolve(item * 2)));
  },
  map: item => {
    console.log(`processing a single item in bulk`);
    return item + 5;
  },
  afterBulk: bulkRes => {
    console.log(`done processing bulk`);
    return bulkRes.map(item => (item - 5) / 2);
  },
  afterAll: resultArray => {
    return resultArray.filter(item => item > 0);
  },
});

// res: [1,2,3,4,5,6,7,8,9,10]
```

## Usage

```typescript
asyncBulkMap<T, R>(bigArray: T[], bulkSize: number, actions: IBulkActions<T, R>): Promise<R[]>;
```

### Bulk Actions

Notice that:

- All events are optional except the actual `map` of the items.
- Each events can return either:
  - no value, so the array/bulk won't be effected
  - a new array or a `Promise` for it, that will replace the array/bulk

```typescript
export type MaybePromiseOf<T> = Maybe<T | Promise<T>>;

export interface IBulkActions<T, R> {
  beforeAll?: (arr: T[]) => MaybePromiseOf<T[]>; // for modifying the source array before starting
  beforeBulk?: (bulk: T[], bulkIndex: number) => MaybePromiseOf<T[]>; // before processing of each bulk.
  map: (item: T) => MaybePromiseOf<R>; // processing of each item
  afterBulk?: (bulkRes: R[]) => MaybePromiseOf<R[]>; // after processing all items in the bulk and before continuing to the next one
  afterAll?: (res: R[]) => MaybePromiseOf<R[]>; // after processing all bulks
}
```

## Utilities

- logging before starting a bulk
- delay before starting the next bulk

```typescript
import { asyncBulkMap, createPipe, logBulk, createDelay } from 'async-bulk-map';
const bigArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const bulkSize = 2;

const res = await asyncBulkMap(bigArray, bulkSize, {
  beforeBulk: createPipe(logBulk).pipe((bulk, bulkIndex) => {
    // it will: console.log(`bulk index: ${bulkIndex} (${bulk.length} entries)`);
    // then arrive for processing here
  }),
  map: item => item,
  afterBulk: createPipe(createDelay(2000)).pipe(bulkRes => {
    // it will create a 2sec delay after processing the bulk
    // then arrive for processing here
  }),
});
```
