import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function getSnapshot(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent);
}

/**
 * Se a pessoa está num aparelho da Apple (atalhos com ⌘) ou não (atalhos com Ctrl).
 * No servidor e na hidratação é null: quem usa deve mostrar algo neutro até saber.
 */
export function useIsApple(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** "⌘K" ou "Ctrl+K" (com shift: "⇧⌘Z" ou "Ctrl+Shift+Z") */
export function shortcutLabel(isApple: boolean, key: string, shift = false): string {
  return isApple ? `${shift ? "⇧" : ""}⌘${key}` : `Ctrl+${shift ? "Shift+" : ""}${key}`;
}
