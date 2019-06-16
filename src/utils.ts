type ArgsType<F extends Function> = F extends (...args: infer A) => unknown ? A : [];
type ReturnVal<F extends Function> = F extends (...args: ArgsType<F>) => infer R ? R : unknown;
type PromiseReturnVal<F extends Function> = ReturnVal<F> extends Promise<unknown> ? ReturnVal<F> : Promise<ReturnVal<F>>;

type FunctionAsyncThen<F extends Function> =
  ((...args: ArgsType<F>) => PromiseReturnVal<F>)
  & { then: <T extends Function>(fn: T) => FunctionAsyncThen<F> };


export function createPipe<T extends Function>(pipeSrc: T): FunctionAsyncThen<T> {
  const fns = [pipeSrc] as Function[];

  async function pipe(...args: any[]) { // async reduce
    let res = args;
    for (let currFn of fns) {
      res = await currFn(...(res || args));
    }
    return res;
  }

  return Object.assign(pipe, {
    then<N extends Function>(this: FunctionAsyncThen<T>, nextFn: N) {
      fns.push(nextFn);
      return this;
    },
  }) as Function as FunctionAsyncThen<T>;
}

export function logBulk<T>(bulk: T[], bulkIndex: number) {
  console.log(`bulk index: ${bulkIndex} (${bulk.length} entries)`);
}

export function createDelay(timeout: number) {
  return () => new Promise<void>(resolve => setTimeout(resolve, timeout));
}