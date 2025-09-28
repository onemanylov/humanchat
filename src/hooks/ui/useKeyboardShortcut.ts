import { useEffect } from 'react';

export function useKeyboardShortcut(
  keys: { metaOrCtrl?: boolean; key: string },
  onTrigger: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const trigger =
        (!!keys.metaOrCtrl ? e.metaKey || e.ctrlKey : true) &&
        e.key.toLowerCase() === keys.key.toLowerCase();
      if (trigger) {
        onTrigger();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys.key, keys.metaOrCtrl, onTrigger]);
}
