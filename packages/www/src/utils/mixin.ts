export default function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    if (!baseCtor.prototype) throw new Error('Must have a prototype')
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        // @ts-ignore
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
      )
    })
  })
}
