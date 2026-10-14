import { Fragment } from 'react';
import type { ResumeHeader } from '@/lib/resume/schema';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import EditableText from './EditableText';

type HeaderSectionProps = {
  header: ResumeHeader;
  actions: ResumeEditorActions;
};

const CONTACT_FIELDS: readonly { field: Exclude<keyof ResumeHeader, 'name'>; placeholder: string; isLink: boolean }[] = [
  { field: 'phone', placeholder: 'Phone', isLink: false },
  { field: 'email', placeholder: 'Email', isLink: true },
  { field: 'linkedin', placeholder: 'LinkedIn', isLink: true },
  { field: 'github', placeholder: 'GitHub', isLink: true },
];

/** Centered small-caps name over a `|`-separated contact line; links are underlined like `\href{\underline{}}`. */
export default function HeaderSection({ header, actions }: HeaderSectionProps) {
  return (
    <header className="text-center">
      <h1 className="text-[25pt] font-bold leading-none [font-variant-caps:small-caps]">
        <EditableText
          value={header.name}
          placeholder="Your Name"
          onChange={(value) => actions.updateField({ section: 'header', field: 'name' }, value)}
        />
      </h1>

      <p className="mt-[4pt] text-[10pt]">
        {CONTACT_FIELDS.map(({ field, placeholder, isLink }, i) => {
          // Empty fields are dropped from the PDF along with their separator, so mute it here.
          const separatorMuted = i > 0 && (!header[field] || !header[CONTACT_FIELDS[i - 1].field]);
          return (
            <Fragment key={field}>
              {i > 0 && <span className={`mx-[0.4em] ${separatorMuted ? 'text-slate-300' : ''}`}>|</span>}
              <EditableText
                value={header[field]}
                placeholder={placeholder}
                className={isLink ? 'underline' : undefined}
                onChange={(value) => actions.updateField({ section: 'header', field }, value)}
              />
            </Fragment>
          );
        })}
      </p>
    </header>
  );
}
