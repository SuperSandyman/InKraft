import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

beforeEach(() => {
    mockMatchMedia.mockReset();
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
    });
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
    });
});

describe('useIsMobile', () => {
    it('should return false for desktop width (>= 768px)', () => {
        // Setup
        const mockMql = {
            matches: false,
            media: '(max-width: 767px)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        mockMatchMedia.mockReturnValue(mockMql);
        
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        // Test
        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(false);
    });

    it('should return true for mobile width (< 768px)', () => {
        // Setup
        const mockMql = {
            matches: true,
            media: '(max-width: 767px)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        mockMatchMedia.mockReturnValue(mockMql);
        
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 320,
        });

        // Test
        const { result } = renderHook(() => useIsMobile());
        
        expect(result.current).toBe(true);
    });

    it('should update when window is resized', () => {
        // Setup
        let changeHandler: () => void;
        const mockMql = {
            matches: false,
            media: '(max-width: 767px)',
            addEventListener: vi.fn((event, handler) => {
                if (event === 'change') {
                    changeHandler = handler;
                }
            }),
            removeEventListener: vi.fn(),
        };
        mockMatchMedia.mockReturnValue(mockMql);
        
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        // Test initial state
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        // Simulate window resize to mobile
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 320,
            });
            changeHandler();
        });

        expect(result.current).toBe(true);
    });

    it('should clean up event listener on unmount', () => {
        const mockMql = {
            matches: false,
            media: '(max-width: 767px)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        mockMatchMedia.mockReturnValue(mockMql);

        const { unmount } = renderHook(() => useIsMobile());
        
        unmount();
        
        expect(mockMql.removeEventListener).toHaveBeenCalled();
    });
});