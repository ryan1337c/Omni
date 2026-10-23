import type { ExperienceEntry } from '@/lib/resume/schema';
import { MAX_BULLETS_PER_ENTRY } from '@/lib/resume/parseResumeJson';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import BulletList from './BulletList';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection, SubheadingRow } from './ResumeSection';

type ExperienceSectionProps = {
  entries: ExperienceEntry[];
  actions: ResumeEditorActions;
};

/** `\resumeSubheading{title}{dates}{company}{location}` followed by its bullets. */
export default function ExperienceSection({ entries, actions }: ExperienceSectionProps) {
  return (
    <ResumeSection
      id="experience"
      entryCount={entries.length}
      addLabel="Add experience"
      onAdd={() => actions.addEntry('experience')}
    >
      {entries.map((entry, index) => {
        const edit = (field: Exclude<keyof ExperienceEntry, 'bullets'>) => (value: string) =>
          actions.updateField({ section: 'experience', index, field }, value);

        return (
          <ResumeEntry
            key={index}
            removeLabel="Remove experience"
            placement={{ section: 'experience', entry: index }}
            onRemove={() => actions.removeEntry('experience', index)}
            onAddBullet={
              entry.bullets.length < MAX_BULLETS_PER_ENTRY ? () => actions.addBullet('experience', index) : undefined
            }
          >
            <SubheadingRow
              left={<EditableText value={entry.title} placeholder="Job Title" className="font-bold" onChange={edit('title')} />}
              right={<EditableText value={entry.dates} placeholder="Dates" onChange={edit('dates')} />}
            />
            <SubheadingRow
              className="text-[10pt] italic"
              left={<EditableText value={entry.company} placeholder="Company" onChange={edit('company')} />}
              right={<EditableText value={entry.location} placeholder="Location" onChange={edit('location')} />}
            />
            <BulletList section="experience" entryIndex={index} bullets={entry.bullets} actions={actions} />
          </ResumeEntry>
        );
      })}
    </ResumeSection>
  );
}
