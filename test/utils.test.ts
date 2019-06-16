import { createPipe, logBulk } from '../src/utils';

describe('utils', () => {
  const mockBulk = ['x'];
  const mockIndex = 0;
  const mockResult = 'done';

  it('should pipe through logging the bulk', async () => {
    jest.spyOn(console, 'log');

    const pipe = createPipe(logBulk).then((bulk: string[], bulkIndex: number) => {
      expect(console.log).toHaveBeenCalledWith(`bulk index: ${bulkIndex} (${bulk.length} entries)`);
      expect(bulk).toBe(mockBulk);
      expect(bulkIndex).toBe(mockIndex);
      return mockResult;
    });

    const res = await pipe(mockBulk, mockIndex);
    expect(res).toBe(mockResult);
  });
});