"use client";

import { useCallback, useSyncExternalStore } from "react";

function getServerSnapshot<T>(initialValue: T): T {
  return initialValue;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const subscribe = useCallback((callback: () => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => getServerSnapshot(initialValue)
  );

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const currentValue = getSnapshot();
      const valueToStore = value instanceof Function ? value(currentValue) : value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new StorageEvent("storage", { key }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, getSnapshot]);

  return [storedValue, setValue];
}
