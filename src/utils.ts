type ArgsType<F extends Function> = F extends (...args: infer A) => unknown
  ? A
  : [];
type ReturnVal<F extends Function> = F extends (...args: ArgsType<F>) => infer R
  ? R
  : unknown;
type PromiseReturnVal<F extends Function> = ReturnVal<F> extends Promise<
  unknown
>
  ? F
  : (...args: ArgsType<F>) => Promise<ReturnVal<F>>;

type Nothing = void | null | undefined;

type EmptyPipe<F extends Function> = (...args: ArgsType<F>) => ArgsType<F>;

type PipeFunctions<F1 extends Function, F2 extends Function> = ReturnVal<
  F2
> extends Nothing
  ? ReturnVal<F1> extends Nothing
    ? EmptyPipe<F1>
    : F1
  : (...args: ArgsType<F1>) => ReturnVal<F2>;

// type UnArrayify<T> = T extends Array<unknown> ? T[0] : T;

type ReturnValOrArgs<F extends Function> = ReturnVal<F> extends Nothing
  ? ArgsType<F> // UnArrayify<ArgsType<F>>
  : ReturnVal<F>;

type UnPromise<T> = T extends Promise<infer R> ? R : T;
type Arrayify<T> = T extends Array<any> ? T : T[];

type ExtendingPipeFn<F extends Function> = (
  ...args: Arrayify<UnPromise<ReturnValOrArgs<F>>>
) => unknown;

type AsyncPipeFunction<O extends Function> = PromiseReturnVal<O> & {
  pipe: <N extends ExtendingPipeFn<O>>(
    fn: N
  ) => AsyncPipeFunction<PipeFunctions<O, N>>;
  then: <N extends ExtendingPipeFn<O>>(
    fn: N
  ) => AsyncPipeFunction<PipeFunctions<O, N>>;
};

export function createPipe<T extends Function>(
  pipeSrc: T
): AsyncPipeFunction<T> {
  return createFunctionsPipe([pipeSrc]);
}

function createFunctionsPipe<T extends Function>(
  pipeFns: Function[]
): AsyncPipeFunction<T> {
  return (Object.assign(
    async function asyncReduce(...args: any[]) {
      let res = args;
      for (let currFn of pipeFns) {
        res = await currFn(...(res || args));
      }
      return res;
    },
    {
      pipe<N extends Function>(this: AsyncPipeFunction<T>, nextFn: N) {
        pipeFns.push(nextFn);
        return this;
      },
      then<N extends Function>(this: AsyncPipeFunction<T>, nextFn: N) {
        return createFunctionsPipe(pipeFns.concat(nextFn));
      },
    }
  ) as Function) as AsyncPipeFunction<T>;
}

export function logBulk<T>(bulk: T[], bulkIndex: number): void {
  console.log(`bulk index: ${bulkIndex} (${bulk.length} entries)`);
}

export function createDelay(timeout: number) {
  return () => new Promise<void>(resolve => setTimeout(resolve, timeout));
}
