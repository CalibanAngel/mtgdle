import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n';

export interface PreviewCard {
  name: string;
  image: string | null;
  previewImage?: string | null;
}

export function useCardViewer() {
  const { t } = useI18n();
  const [card, setCard] = useState<PreviewCard | null>(null);
  const [hover, setHover] = useState<{
    card: PreviewCard;
    x: number;
    y: number;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setHover(null);
  }
  function peek(value: PreviewCard, anchor: HTMLElement) {
    hide();
    if (!window.matchMedia('(hover: hover)').matches || !value.image) return;
    const rect = anchor.getBoundingClientRect();
    const x = Math.max(12, Math.min(rect.right + 16, window.innerWidth - 280));
    const y = Math.max(12, Math.min(rect.top - 50, window.innerHeight - 400));

    timer.current = setTimeout(() => setHover({ card: value, x, y }), 350);
  }
  function open(value: PreviewCard) {
    hide();
    setCard(value);
  }
  useEffect(() => {
    if (card) dialog.current?.showModal();
  }, [card]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const viewer = (
    <>
      {hover &&
        createPortal(
          <div
            aria-hidden="true"
            className="classic-hover-preview"
            style={{ left: hover.x, top: hover.y }}
          >
            <img alt="" src={hover.card.previewImage || hover.card.image!} />
          </div>,
          document.body,
        )}
      <dialog
        ref={dialog}
        aria-label={card ? t('preview', { name: card.name }) : t('previewCard')}
        className="classic-card-dialog"
        onClose={() => setCard(null)}
      >
        <button
          aria-label={t('closePreview')}
          className="classic-dialog-close"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        {card && (
          <>
            <img alt={card.name} src={card.previewImage || card.image || ''} />
            <p>{card.name}</p>
          </>
        )}
      </dialog>
    </>
  );

  return { viewer, peek, hide, open };
}
