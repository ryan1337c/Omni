import type { EducationEntry } from '@/lib/resume/schema';
import { MAX_BULLETS_PER_ENTRY } from '@/lib/resume/parseResumeJson';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import BulletList from './BulletList';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection, SubheadingRow } from './ResumeSection';

type EducationSectionProps = {
  entries: EducationEntry[];
  actions: ResumeEditorActions;
};

/** `\resumeSubheading{institution}{location}{degree}{dates}` followed by its bullets. */
export default function EducationSection({ entries, actions }: EducationSectionProps) {
  return (
    <ResumeSection
      title="Education"
      entryCount={entries.length}
      addLabel="Add education"
      onAdd={() => actions.addEntry('education')}
    >
      {entries.map((entry, index) => {
        const edit = (field: Exclude<keyof EducationEntry, 'bullets'>) => (value: string) =>
          actions.updateField({ section: 'education', index, field }, value);

        return (
          <ResumeEntry
            key={index}
            removeLabel="Remove education"
            onRemove={() => actions.removeEntry('education', index)}
            onAddBullet={
              entry.bullets.length < MAX_BULLETS_PER_ENTRY ? () => actions.addBullet('education', index) : undefined
            }
          >
            <SubheadingRow
              left={<EditableText value={entry.institution} placeholder="Institution" className="font-bold" onChange={edit('institution')} />}
              right={<EditableText value={entry.location} placeholder="Location" onChange={edit('location')} />}
            />
            <SubheadingRow
              className="text-[10pt] italic"
              left={<EditableText value={entry.degree} placeholder="Degree" onChange={edit('degree')} />}
              right={<EditableText value={entry.dates} placeholder="Dates" onChange={edit('dates')} />}
            />
            <BulletList section="education" entryIndex={index} bullets={entry.bullets} actions={actions} />
          </ResumeEntry>
        );
      })}
    </ResumeSection>
  );
}
