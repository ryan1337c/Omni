"use client";

import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

type EditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown while empty; also gives empty fields a clickable width and an accessible name. */
  placeholder: string;
  className?: string;
  /** When set, Enter calls this (e.g. to add the next bullet). Otherwise Enter is ignored. */
  onEnter?: () => void;
  /** Called when Backspace is pressed in an already-empty field (e.g. to remove a bullet). */
  onBackspaceWhenEmpty?: () => void;
};

/** Focus an editable element and put the caret after its last character. */
export function focusAtEnd(element: HTMLElement) {
  element.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Single-line inline editor. It is uncontrolled: the DOM owns the text while the user types, and
 * `value` is written back only when it differs from what's on screen, so the caret never jumps.
 */
export default function EditableText({
  value,
  onChange,
  placeholder,
  className,
  onEnter,
  onBackspaceWhenEmpty,
}: EditableTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  const handleInput = () => {
    const element = ref.current;
    if (!element) return;
    const text = element.textContent ?? '';
    // Browsers can leave a stray <br> after the text is cleared, which defeats the :empty placeholder.
    if (!text && element.childNodes.length > 0) {
      element.replaceChildren();
    }
    onChange(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      onEnter?.();
    } else if (event.key === 'Backspace' && onBackspaceWhenEmpty && !ref.current?.textContent) {
      event.preventDefault();
      onBackspaceWhenEmpty();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain').replace(/\s+/g, ' ');
    // Deprecated, but still the only insertion API that keeps the browser's native undo stack.
    document.execCommand('insertText', false, text);
  };

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={placeholder}
      contentEditable="plaintext-only"
      spellCheck
      data-placeholder={placeholder}
      className={className}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
}
