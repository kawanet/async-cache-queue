/**
 * concurrency.ts
 */

export function concurrencyFactory(concurrency: number): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    if (!(concurrency > 0)) {
        throw new Error("Invalid concurrency: " + concurrency);
    }

    return fn => {
        const queue = [] as (() => Promise<any>)[];
        let running = 0;

        return arg => new Promise((resolve, reject) => {
            const job = () => {
                running++;
                return Promise.resolve().then(() => fn(arg)).then(resolve, reject);
            };

            queue.push(job);
            next();
        });

        function next() {
            if (running >= concurrency) return;
            const job = queue.shift();
            if (job) job().then(done, done);
        }

        function done() {
            running--;
            next();
        }
    }
}
