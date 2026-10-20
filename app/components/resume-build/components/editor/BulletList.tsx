"use client";

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { MAX_BULLETS_PER_ENTRY } from '@/lib/resume/parseResumeJson';

import type { BulletSection, ResumeEditorActions } from '../../hooks/useResumeEditor';
import ControlButton from './ControlButton';
import EditableText, { focusAtEnd } from './EditableText';

type BulletListProps = {
  section: BulletSection;
  entryIndex: number;
  bullets: string[];
  actions: ResumeEditorActions;
};

/** Jake's `\resumeItemListStart` block: small text, tiny bullets, indented 0.15in. */
export default function BulletList({ section, entryIndex, bullets, actions }: BulletListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  // Which bullet to focus after an Enter/Backspace add or remove has rendered.
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    const index = pendingFocus.current;
    if (index === null) return;
    pendingFocus.current = null;
    const target = listRef.current?.querySelectorAll<HTMLElement>('[contenteditable]')[index];
    if (target) focusAtEnd(target);
  }, [bullets.length]);

  if (bullets.length === 0) return null;

  const insertAfter = (bulletIndex: number) => {
    if (bullets.length >= MAX_BULLETS_PER_ENTRY) return;
    pendingFocus.current = bulletIndex + 1;
    actions.addBullet(section, entryIndex, bulletIndex);
  };

  const removeEmpty = (bulletIndex: number) => {
    pendingFocus.current = bullets.length > 1 ? Math.max(0, bulletIndex - 1) : null;
    actions.removeBullet(section, entryIndex, bulletIndex);
  };

  return (
    <ul ref={listRef} className="ml-[0.15in] mt-[1pt] space-y-[2pt] text-[10pt]">
      {bullets.map((bullet, bulletIndex) => (
        // Index keys are safe here: EditableText re-syncs its DOM whenever its value prop changes.
        <li key={bulletIndex} className="group/bullet relative">
          <span aria-hidden className="absolute -left-[0.1in] top-[4.5pt] h-[3pt] w-[3pt] rounded-full bg-black" />
          <EditableText
            value={bullet}
            placeholder="Describe an accomplishment"
            onChange={(value) => actions.updateField({ section, index: entryIndex, bulletIndex }, value)}
            onEnter={() => insertAfter(bulletIndex)}
            onBackspaceWhenEmpty={() => removeEmpty(bulletIndex)}
          />
          <div className="absolute left-full top-0 ml-2 opacity-0 transition-opacity group-hover/bullet:opacity-100 group-focus-within/bullet:opacity-100">
            <ControlButton
              label="Remove bullet"
              icon={FiX}
              tone="danger"
              onClick={() => actions.removeBullet(section, entryIndex, bulletIndex)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
