import type { HonorEntry } from '@/lib/resume/schema';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection } from './ResumeSection';

type HonorsSectionProps = {
  entries: HonorEntry[];
  actions: ResumeEditorActions;
};

/** Licenses, Certifications, and Awards: one `\resumeItem{\textbf{title}, issuer, date --- description}` per honor. */
export default function HonorsSection({ entries, actions }: HonorsSectionProps) {
  return (
    <ResumeSection
      id="honors"
      entryCount={entries.length}
      addLabel="Add license, certification, or award"
      onAdd={() => actions.addEntry('honors')}
      dense
    >
      {entries.map((entry, index) => {
        const edit = (field: keyof HonorEntry) => (value: string) =>
          actions.updateField({ section: 'honors', index, field }, value);
        // The PDF only prints a separator between two parts that both have text.
        const separatorClass = (printed: boolean) => (printed ? '' : 'text-slate-300');
        const hasCore = !!(entry.title || entry.issuer || entry.date);

        return (
          <ResumeEntry
            key={index}
            removeLabel="Remove honor"
            onRemove={() => actions.removeEntry('honors', index)}
            placement={{ section: 'honors' }}
          >
            <p className="relative mt-[2pt] text-[10pt]">
              <span aria-hidden className="absolute -left-[0.1in] top-[4.5pt] h-[3pt] w-[3pt] rounded-full bg-black" />
              <EditableText value={entry.title} placeholder="Title" className="font-bold" onChange={edit('title')} />
              <span className={separatorClass(!!entry.title && !!entry.issuer)}>, </span>
              <EditableText value={entry.issuer} placeholder="Issuing organization" onChange={edit('issuer')} />
              <span className={separatorClass(!!(entry.title || entry.issuer) && !!entry.date)}>, </span>
              <EditableText value={entry.date} placeholder="Date" onChange={edit('date')} />
              <span className={separatorClass(hasCore && !!entry.description)}> — </span>
              <EditableText
                value={entry.description}
                placeholder="Add context: why you won it or the scale of the competition"
                onChange={edit('description')}
              />
            </p>
          </ResumeEntry>
        );
      })}
    </ResumeSection>
  );
}
