import { describe, expect, it } from 'vitest'

import type { LivingSavesState } from '@/morpheus-app/store/slices/livingSavesSlice'
import {
  MAX_SAVE_DIAGNOSTIC_FAILURE_LENGTH,
  isLivingSaveDiagnostics
} from '@/lib/game-control-protocol'
import { projectLivingSaveDiagnostics } from './useGameControl'

describe('projectLivingSaveDiagnostics', () => {
  it('projects only ordered bounded slot identity', () => {
    const state: LivingSavesState = {
      bootstrapPhase: 'ready',
      catalogRevision: 11,
      activeSlotId: 'slot-2',
      slots: [
        {
          slotId: 'slot-3',
          revision: 7,
          state: 'unloadable',
          active: false,
          sceneId: null,
          savedAt: null,
          resumePointId: null,
          unloadableReason: 'unsupported-version'
        },
        {
          slotId: 'slot-2',
          revision: 4,
          state: 'occupied',
          active: true,
          sceneId: 105049,
          savedAt: 1_784_390_400_000,
          resumePointId: 'resume-4',
          unloadableReason: null
        },
        {
          slotId: 'slot-1',
          revision: 0,
          state: 'empty',
          active: false,
          sceneId: null,
          savedAt: null,
          resumePointId: null,
          unloadableReason: null
        }
      ],
      tombstones: {},
    runtimeGeneration: 3,
    runtimeSlotId: 'slot-2',
    skipSceneEntryActions: false,
      operation: null,
      saveHealth: 'save-unavailable',
      failureReason: 'x'.repeat(MAX_SAVE_DIAGNOSTIC_FAILURE_LENGTH + 40)
    }

    const diagnostics = projectLivingSaveDiagnostics(state)

    expect(diagnostics.slots.map((slot) => slot.slotId)).toEqual([
      'slot-1',
      'slot-2',
      'slot-3'
    ])
    expect(diagnostics.slots[1]).toEqual({
      slotId: 'slot-2',
      revision: 4,
      state: 'occupied',
      savedAt: 1_784_390_400_000,
      sceneId: 105049,
      resumePointId: 'resume-4',
      unloadableReason: null
    })
    expect(diagnostics.failureReason).toHaveLength(
      MAX_SAVE_DIAGNOSTIC_FAILURE_LENGTH
    )
    expect(isLivingSaveDiagnostics(diagnostics)).toBe(true)
    expect(JSON.stringify(diagnostics)).not.toContain('gamestate')
    expect(JSON.stringify(diagnostics)).not.toContain('fileBytes')
  })
})
