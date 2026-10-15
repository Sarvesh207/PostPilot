import { describe, expect, it } from 'vitest';
import { countChars, counterState } from './counter';

describe('countChars', () => {
  it('counts an emoji as one character', () => {
    expect(countChars('🪔')).toBe(1);
    expect(countChars('Shop now 📸')).toBe(10);
    expect(countChars('')).toBe(0);
  });
});

describe('counterState', () => {
  it('turns amber above 90% of the limit and red over it', () => {
    expect(counterState(252, 280)).toBe('normal'); // exactly 90%
    expect(counterState(253, 280)).toBe('warning');
    expect(counterState(280, 280)).toBe('warning');
    expect(counterState(281, 280)).toBe('over');
  });
});
