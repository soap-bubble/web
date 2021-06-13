import { TestScheduler } from 'rxjs';
import uuid from 'uuid';
import {
  keyDown,
  keyUp,
  inputHandler,
} from 'morpheus/input/actions';
import keyInputEpic from 'morpheus/input/epics';
import { ActionsObservable } from 'redux-observable';

describe('input test suite', () => {
  it('can emit an action in response to a key input', () => {
    const uniqueKey = uuid();
    inputHandler({
      key: uniqueKey,
      down: () => ({
        type: 'down',
      }),
      up: () => ({
        type: 'up',
      }),
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('ab', {
        a: keyDown(uniqueKey),
        b: keyUp(uniqueKey),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('ab', {
      a: { type: 'down' },
      b: { type: 'up' },
    });
    testScheduler.flush();
  });

  it('handlers can not emit action', () => {
    const uniqueKey = uuid();
    inputHandler({
      key: uniqueKey,
      down: () => {},
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('ab', {
        a: keyDown(uniqueKey),
        b: keyUp(uniqueKey),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('--');
    testScheduler.flush();
  });

  it('can emit an action in response to multiple key inputs', () => {
    const uniqueKey = uuid();
    inputHandler({
      key: uniqueKey,
      down: () => ({
        type: uniqueKey,
      }),
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('abab', {
        a: keyDown(uniqueKey),
        b: keyUp(uniqueKey),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('a-a', {
      a: { type: uniqueKey },
    });
    testScheduler.flush();
  });

  it('multiple input handlers can emit actions in response to a key input', () => {
    const uniqueKey1 = uuid();
    const uniqueKey2 = uuid();
    inputHandler({
      key: uniqueKey1,
      down: () => ({
        type: uniqueKey1,
      }),
    });
    inputHandler({
      key: uniqueKey2,
      down: () => ({
        type: uniqueKey2,
      }),
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('ab--cd', {
        a: keyDown(uniqueKey1),
        b: keyUp(uniqueKey1),
        c: keyDown(uniqueKey2),
        d: keyUp(uniqueKey2),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('a---b-', {
      a: { type: uniqueKey1 },
      b: { type: uniqueKey2 },
    });
    testScheduler.flush();
  });

  it('multiple input handlers can emit actions in response to same key input', () => {
    const uniqueKey1 = uuid();
    const type1 = {
      type: `${uniqueKey1}-0`,
    };
    const type2 = {
      type: `${uniqueKey1}-1`,
    };
    inputHandler({
      key: uniqueKey1,
      down: () => type1,
    });
    inputHandler({
      key: uniqueKey1,
      down: () => type2,
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('ab--ab', {
        a: keyDown(uniqueKey1),
        b: keyUp(uniqueKey1),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('(ab)(ab)', {
      a: type1,
      b: type2,
    });
    testScheduler.flush();
  });
  it('kitchen sink', () => {
    const uniqueKey1 = uuid();
    const uniqueKey2 = uuid();
    const uniqueKey3 = uuid();
    const type1 = {
      type: `${uniqueKey1}-0`,
    };
    const type2 = {
      type: `${uniqueKey1}-1`,
    };
    const type3 = {
      type: uniqueKey2,
    };
    inputHandler({
      key: uniqueKey1,
      down: () => type1,
    });
    inputHandler({
      key: uniqueKey1,
      down: () => type2,
    });
    inputHandler({
      key: uniqueKey2,
      down: () => type3,
    });
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    const action$ = new ActionsObservable(
      testScheduler.createHotObservable('ababcdef', {
        a: keyDown(uniqueKey2),
        b: keyUp(uniqueKey2),
        c: keyDown(uniqueKey3),
        d: keyUp(uniqueKey3),
        e: keyDown(uniqueKey1),
        f: keyUp(uniqueKey1),
      }),
    );

    const test$ = keyInputEpic(action$);
    testScheduler.expectObservable(test$).toBe('c-c---(ab)', {
      a: type1,
      b: type2,
      c: type3,
    });
    testScheduler.flush();
  });
});
