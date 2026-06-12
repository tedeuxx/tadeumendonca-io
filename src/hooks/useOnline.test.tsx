import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { useOnline } from './useOnline';

afterEach(() => act(() => onlineManager.setOnline(true)));

describe('useOnline', () => {
  it('tracks the onlineManager connectivity state', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    act(() => onlineManager.setOnline(false));
    expect(result.current).toBe(false);
    act(() => onlineManager.setOnline(true));
    expect(result.current).toBe(true);
  });
});
