type ArgsType<F extends Function> = F extends (...args: infer A) => unknown
  ? A
  : [];
type ReturnVal<F extends Function> = F extends (...args: ArgsType<F>) => infer R
  ? R
  : unknown;
type PromiseReturnVal<F extends Function> = ReturnVal<F> extends Promise<
  unknown
>
  ? ReturnVal<F>
  : Promise<ReturnVal<F>>;

type FunctionAsyncPipe<F extends Function> = ((
  ...args: ArgsType<F>
) => PromiseReturnVal<F>) & {
  pipe: <T extends Function>(fn: T) => FunctionAsyncPipe<F>;
  then: <T extends Function>(fn: T) => FunctionAsyncPipe<F>;
};

export function createPipe<T extends Function>(
  pipeSrc: T
): FunctionAsyncPipe<T> {
  return createFunctionsPipe([pipeSrc]);
}

function createFunctionsPipe<T extends Function>(
  pipeFns: Function[]
): FunctionAsyncPipe<T> {
  return (Object.assign(
    async function asyncReduce(...args: any[]) {
      let res = args;
      for (let currFn of pipeFns) {
        res = await currFn(...(res || args));
      }
      return res;
    },
    {
      pipe<N extends Function>(this: FunctionAsyncPipe<T>, nextFn: N) {
        pipeFns.push(nextFn);
        return this;
      },
      then<N extends Function>(this: FunctionAsyncPipe<T>, nextFn: N) {
        return createFunctionsPipe(pipeFns.concat(nextFn));
      },
    }
  ) as Function) as FunctionAsyncPipe<T>;
}

export function logBulk<T>(bulk: T[], bulkIndex: number) {
  console.log(`bulk index: ${bulkIndex} (${bulk.length} entries)`);
}

export function createDelay(timeout: number) {
  return () => new Promise<void>(resolve => setTimeout(resolve, timeout));
}
