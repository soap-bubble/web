export default function<T>(notifier: (t: T) => void, period: number) {
  const queue: T[] = []
  let timeooutId: number | null = null

  function work() {
    if (queue.length) {
      const item: T = queue.shift() as T
      notifier(item)
    }
    timeooutId = null
    next()
  }
  function next() {
    if (!timeooutId && queue.length) {
      timeooutId = setTimeout(work, period)
    }
  }
  return (input: T) => {
    queue.push(input)
    next()
  }
}
