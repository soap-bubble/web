import { describe, expect, it } from 'vitest';

import {
  livingSaveCatalogResolved,
  livingSaveOperationFailed,
  livingSaveOperationStarted,
  livingSavesReducer,
} from './livingSavesSlice';
import { createEmptyLivingSaveCatalogFixture } from '../testFixtures';

describe('livingSavesSlice', () => {
  it('resolves exactly three durable slot summaries', () => {
    const catalog = createEmptyLivingSaveCatalogFixture();
    const state = livingSavesReducer(
      undefined,
      livingSaveCatalogResolved({ catalog, operationId: 'bootstrap-1' }),
    );

    expect(state.bootstrapPhase).toBe('ready');
    expect(state.catalogRevision).toBe(0);
    expect(state.slots.map((slot) => slot.slotId)).toEqual([
      'slot-1',
      'slot-2',
      'slot-3',
    ]);
  });

  it('ignores a failure from an operation that has been superseded', () => {
    let state = livingSavesReducer(
      undefined,
      livingSaveOperationStarted({
        operationId: 'restore-1',
        kind: 'restore',
      }),
    );
    state = livingSavesReducer(
      state,
      livingSaveOperationStarted({
        operationId: 'restore-2',
        kind: 'restore',
      }),
    );
    state = livingSavesReducer(
      state,
      livingSaveOperationFailed({
        operationId: 'restore-1',
        reason: 'unavailable-scene',
      }),
    );

    expect(state.operation?.id).toBe('restore-2');
    expect(state.failureReason).toBeNull();
  });
});
