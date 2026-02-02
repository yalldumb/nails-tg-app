"use client";

import { useEffect } from "react";

export function getTelegram(): any | null {
  // @ts-ignore
  return globalThis?.Telegram?.WebApp || null;
}

export function getTelegramUser(): any | null {
  // @ts-ignore
  return globalThis?.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function telegramReady() {
  const tg = getTelegram();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#050505");
    tg.setBackgroundColor?.("#050505");
  } catch {}
}

export function useTelegramMainButton(opts: {
  step: 1 | 2 | 3 | 4;
  loading: boolean;
  canNextFromStep2: boolean;
  canConfirm: boolean;
  onNext: () => void;
  onConfirm: () => Promise<void> | void;
  onMy: () => Promise<void> | void;
}) {
  useEffect(() => {
    const tg = getTelegram();
    const mb = tg?.MainButton;
    if (!mb) return;

    try {
      mb.setParams({ color: "#ffffff", text_color: "#000000" });
    } catch {}

    const handler = async () => {
      if (opts.step === 2) {
        if (opts.canNextFromStep2) opts.onNext();
      } else if (opts.step === 3) {
        if (opts.canConfirm && !opts.loading) await opts.onConfirm();
      } else if (opts.step === 4) {
        if (!opts.loading) await opts.onMy();
      }
    };

    try { mb.offClick(handler); } catch {}
    try { mb.onClick(handler); } catch {}

    try {
      if (opts.step === 1) {
        mb.hide();
      } else if (opts.step === 2) {
        mb.setText("Дальше");
        opts.canNextFromStep2 ? mb.enable() : mb.disable();
        mb.show();
      } else if (opts.step === 3) {
        mb.setText("Подтвердить");
        (opts.canConfirm && !opts.loading) ? mb.enable() : mb.disable();
        mb.show();
      } else if (opts.step === 4) {
        mb.setText("Мои записи");
        (!opts.loading) ? mb.enable() : mb.disable();
        mb.show();
      }
    } catch {}

    return () => {
      try { mb.offClick(handler); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.step, opts.loading, opts.canNextFromStep2, opts.canConfirm]);
}
