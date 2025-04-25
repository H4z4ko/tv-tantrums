// client/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value.
 * @param {any} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Set debouncedValue to value (passed in) after the specified delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Return a cleanup function that will be called every time useEffect runs again.
      // This cancels the previous timeout if value changes quickly.
      return () => {
        clearTimeout(handler);
      };
    },
    // Only re-call effect if value or delay changes
    [value, delay]
  );

  return debouncedValue;
}

export default useDebounce;