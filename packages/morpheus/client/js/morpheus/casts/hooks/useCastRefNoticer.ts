import { useCallback, useRef, useState } from 'react'
import { Cast } from '../types'

export type CastRef<T, C extends Cast> = [T, C[]]

/**
 * Hook for tracking refs to cast elements (videos, images, audio).
 * When a ref is registered (T is truthy), it's added to the collection.
 * When a ref is unregistered (T is null/undefined), matching casts are removed.
 */
export default function useCastRefNoticer<T, C extends Cast>(): [
  CastRef<T, C>[],
  (ref: CastRef<T, C>) => void
] {
  const [refs, setRefs] = useState<CastRef<T, C>[]>([])
  // Track registered elements to prevent duplicate registrations
  const registeredElements = useRef<Set<T>>(new Set())

  const onCastRef = useCallback((ref: CastRef<T, C>) => {
    const [element, inCast] = ref
    
    if (element) {
      // Check if already registered to prevent infinite loops
      if (registeredElements.current.has(element)) {
        return
      }
      registeredElements.current.add(element)
      
      setRefs(currentRefs => {
        return [...currentRefs, [element, inCast]] as CastRef<T, C>[]
      })
    } else {
      // Removing refs that match the casts
      // Also remove from registered set
      setRefs(currentRefs => {
        const filteredRefs = currentRefs.reduce((memo, entry) => {
          const [existingRef, casts] = entry
          // Keep entries where none of the casts are in inCast
          if (!casts.find(c => inCast.includes(c))) {
            memo.push(entry)
          } else if (casts.length > 1) {
            // If multiple casts, keep those not in inCast
            const remainingCasts = casts.filter(c => !inCast.includes(c))
            if (remainingCasts.length > 0) {
              memo.push([existingRef, remainingCasts] as CastRef<T, C>)
            } else {
              // All casts removed, unregister the element
              registeredElements.current.delete(existingRef)
            }
          } else {
            // Single cast that matches, remove entirely
            registeredElements.current.delete(existingRef)
          }
          return memo
        }, [] as CastRef<T, C>[])
        
        return filteredRefs
      })
    }
  }, [])

  return [refs, onCastRef]
}
