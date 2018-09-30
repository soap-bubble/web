import Queue from './queue';

describe('Scene queue', () => {
  it('exists', () => {
    expect(new Queue()).toBeDefined();
  });

  it('executes a single item', async () => {
    const queue = new Queue();
    expect(await queue.add({
      id: 0,
      tasks: [
        () => Promise.resolve(5),
      ],
    })).toEqual(5);
  });

  it('executes multiple tasks together', async () => {
    const queue = new Queue();
    expect(await queue.add({
      id: 0,
      tasks: [
        () => Promise.resolve(5),
        result => Promise.resolve(result * result),
      ],
    })).toEqual(25);
  });

  it('can cancel', () => {
    let resolveTask1Start;
    let resolveTask1End;

    const task1Start = jest.fn().mockReturnValue(new Promise((resolve) => {
      resolveTask1Start = resolve;
    }));
    const task1End = jest.fn().mockReturnValue(new Promise((resolve) => {
      resolveTask1End = resolve;
    }));
    const task2 = jest.fn().mockReturnValue(Promise.resolve(5));

    const queue = new Queue();

    const tasks = [
      () => task1Start().then(() => {
        queue.cancel(0);
        return task1End();
      }),
      task2,
    ];

    const finished = queue.add({
      id: 0,
      tasks,
    });

    resolveTask1Start();
    resolveTask1End(1);

    return finished.then((result) => {
      expect(task2).toHaveBeenCalledTimes(0);
      expect(result).toEqual(1);
    });
  });

  it('can cancel with new task', () => {
    let resolveTask1Start;
    let resolveTask1End;

    const task1Start = jest.fn().mockReturnValue(new Promise((resolve) => {
      resolveTask1Start = resolve;
    }));
    const task1End = jest.fn().mockReturnValue(new Promise((resolve) => {
      resolveTask1End = resolve;
    }));
    const task2 = jest.fn().mockReturnValue(Promise.resolve(5));

    const queue = new Queue();

    const tasks = [
      () => task1Start().then(() => {
        queue.cancel(0);
        return task1End();
      }),
      task2,
    ];

    queue.add({
      id: 0,
      tasks,
    });

    const finished = queue.add({
      id: 1,
      tasks: [
        () => Promise.resolve(2),
      ],
    });

    resolveTask1Start();
    resolveTask1End(1);

    return finished.then((result) => {
      expect(result).toEqual(2);
    });
  });

  it('cancel all', async () => {
    const queue = new Queue();
    const job1End = jest.fn().mockReturnValue(Promise.resolve());
    const job2End = jest.fn().mockReturnValue(Promise.resolve());

    queue.add({
      id: 0,
      tasks: [
        queue.cancel,
        job1End,
      ],
    });

    await queue.add({
      id: 1,
      tasks: [
        job2End,
      ],
    });

    expect(job1End).toHaveBeenCalledTimes(0);
    expect(job2End).toHaveBeenCalledTimes(0);
  });

  it('error', async () => {
    const queue = new Queue();

    const job1End = jest.fn().mockReturnValue(Promise.resolve());

    let didThrow = false;
    try {
      await queue.add({
        id: 0,
        tasks: [
          () => Promise.reject(new Error('foo')),
          job1End,
        ],
      });
    } catch (e) {
      didThrow = true;
      expect(() => { throw e; }).toThrowError('foo');
    } finally {
      expect(job1End).toHaveBeenCalledTimes(0);
      expect(didThrow).toEqual(true);
    }
  });
});
