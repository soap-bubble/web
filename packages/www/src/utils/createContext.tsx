import { Context, createContext, FunctionComponent } from 'react'

export default function factory<P extends Record<string, any>, C = unknown>(
  apply: (...args: Parameters<FunctionComponent<P>>) => C,
): [() => Context<C>, FunctionComponent<P>] {
  let context: Context<C>
  const getContext = () => {
    if (!context) {
      throw new Error('Context not created')
    }
    return context
  }
  const Provider: FunctionComponent<P> = (...reactRenderContext) => {
    const [{ children }] = reactRenderContext
    const staticValue = apply(...reactRenderContext)
    if (!context) {
      context = createContext(staticValue)
    }
    const { Provider: HocProvider } = context
    return <HocProvider value={staticValue}>{children}</HocProvider>
  }
  return [getContext, Provider]
}
