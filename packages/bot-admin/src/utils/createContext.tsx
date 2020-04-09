import { useContext, Context, createContext, FunctionComponent, useCallback } from 'react'

export default function factory<P extends {}, C = P>(
  apply?: (...args: Parameters<FunctionComponent<P>>) => C
): [Context<C>, FunctionComponent<P>] {
  const context = createContext<C>({} as C)
  const Provider: FunctionComponent<P> = (...reactRenderContext) => {
    const [{ children }] = reactRenderContext
    const { Provider: HocProvider } = context
    return <HocProvider value={(apply && apply(...reactRenderContext)) || ({} as C)}>{children}</HocProvider>
  }
  return [context, Provider]
}
