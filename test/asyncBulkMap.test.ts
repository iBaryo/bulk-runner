import { asyncBulkMap, IBulkActions } from '../src/asyncBulkMap';

function repeatArray<T>(arr: T[], repeats: number): T[] {
  return new Array(repeats)
    .fill(arr) // array of the origin array
    .reduce((res, cur) => res.concat(cur), []); // flatmap
}

describe('asyncBulkMap', () => {
  const origin = [1, 2, 3, 4];

  describe('map functionality', () => {
    [
      {
        desc: 'normal map',
        input: origin.concat([]),
        output: origin,
      },
      {
        desc: 'async map',
        input: origin.map(i => Promise.resolve(i)),
        output: origin,
      },
      {
        desc: 'hybrid map',
        input: origin.map(i => i % 2 == 0 ? i : Promise.resolve(i)),
        output: origin,
      },
      {
        desc: 'map for empty array',
        input: [],
        output: [],
      },
      {
        desc: 'map for 1-length array',
        input: [origin[0]],
        output: [origin[0]],
      },
    ].forEach(test => it(`should act as a ${test.desc}`, async () => {
      const res = await asyncBulkMap(test.input, 1, {
        map: item => item,
      });
      expect(res).not.toBe(origin);
      expect(res).toEqual(test.output);
    }));
  });

  describe('bulk functionality', () => {
    it('should use the right number of bulks', async () => {
      const bulkNum = 5;
      const multiBulkOrigin = repeatArray(origin, bulkNum);
      let expectedBulkIndex = -1;
      const res = await asyncBulkMap(multiBulkOrigin, origin.length, {
        beforeBulk: (bulk, buildIndex) => {
          expect(bulk).toEqual(origin);
          expect(buildIndex).toBe(++expectedBulkIndex);
          expect(buildIndex).not.toBeGreaterThanOrEqual(bulkNum);
        },
        map: item => item,
      });
      expect(expectedBulkIndex + 1).toBe(bulkNum); // index is zero-based
      expect(res).toEqual(multiBulkOrigin);
    });

    it('should use the right bulk size', async () => {
      const bulkNum = 5;
      const multiBulkOrigin = repeatArray(origin, bulkNum);
      let curIndexInBulk = 0;
      const res = await asyncBulkMap(multiBulkOrigin, origin.length, {
        map: item => {
          expect(item).toBe(origin[curIndexInBulk]);
          curIndexInBulk++;
          return item;
        },
        afterBulk: () => {
          expect(curIndexInBulk).toBe(origin.length);
          curIndexInBulk = 0;
        },
      });

      expect(res).toEqual(multiBulkOrigin);
    });
  });

  describe('event functionality', () => {
    it('should be triggered by order', async () => {
      const bulkNum = 5;
      const multiBulkOrigin = repeatArray(origin, bulkNum);
      const events = new Set<keyof IBulkActions<any, any>>();
      const res = await asyncBulkMap(multiBulkOrigin, origin.length, {
        beforeAll: arr => {
          expect(events.size).toBe(0);
          expect(arr).toBe(multiBulkOrigin);
          events.add('beforeAll');
        },
        beforeBulk: () => {
          expect(events.has('beforeAll')).toBeTruthy();
          events.add('beforeBulk');
        },
        map: item => {
          expect(events.has('beforeAll')).toBeTruthy();
          expect(events.has('beforeBulk')).toBeTruthy();
          events.add('map');
          return item;
        },
        afterBulk: () => {
          expect(events.has('beforeAll')).toBeTruthy();
          expect(events.has('beforeBulk')).toBeTruthy();
          expect(events.has('map')).toBeTruthy();
          events.add('afterBulk');
        },
        afterAll: () => {
          expect(events.has('beforeAll')).toBeTruthy();
          expect(events.has('beforeBulk')).toBeTruthy();
          expect(events.has('map')).toBeTruthy();
          expect(events.has('afterBulk')).toBeTruthy();
          expect(events.has('afterAll')).toBeFalsy();
        },
      });

      expect(res).toEqual(multiBulkOrigin);
    });
    it('should be possible to modify data', async () => {
      const bulkNum = 5;
      const multiBulkOrigin = repeatArray(origin, bulkNum);
      const eventsValues = {
        beforeAll: 111,
        beforeBulk: 222,
        map: 333,
        afterBulk: 444,
        afterAll: 555
      } as {[k in keyof IBulkActions<any, any>]: number};

      const res = await asyncBulkMap(multiBulkOrigin, origin.length, {
        beforeAll: arr => arr.map(() => eventsValues.beforeAll as number),
        beforeBulk: bulk => {
          expect(bulk.length).toBe(origin.length);
          bulk.forEach(item => expect(item).toBe(eventsValues.beforeAll));
          return bulk.map(() => eventsValues.beforeBulk as number);
        },
        map: item => {
          expect(item).toBe(eventsValues.beforeBulk);
          return eventsValues.map;
        },
        afterBulk: bulkRes => {
          expect(bulkRes.length).toBe(origin.length);
          bulkRes.forEach(item => expect(item).toBe(eventsValues.map));
          return bulkRes.map(() => eventsValues.afterBulk);
        },
        afterAll: res => {
          expect(res.length).toBe(multiBulkOrigin.length);
          res.forEach(item => expect(item).toBe(eventsValues.afterBulk));
          return res.map(() => eventsValues.afterAll);
        },
      });

      res.forEach(item => expect(item).toBe(eventsValues.afterAll));
    });
  });
});

