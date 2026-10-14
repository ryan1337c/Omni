import type { SkillEntry } from '@/lib/resume/schema';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection } from './ResumeSection';

type SkillsSectionProps = {
  entries: SkillEntry[];
  actions: ResumeEditorActions;
};

/** Technical Skills: one `\textbf{category}{: items}` line per entry. */
export default function SkillsSection({ entries, actions }: SkillsSectionProps) {
  return (
    <ResumeSection
      title="Technical Skills"
      entryCount={entries.length}
      addLabel="Add skill category"
      onAdd={() => actions.addEntry('skills')}
      dense
    >
      {entries.map((entry, index) => {
        const edit = (field: keyof SkillEntry) => (value: string) =>
          actions.updateField({ section: 'skills', index, field }, value);

        return (
          <ResumeEntry key={index} removeLabel="Remove skill category" onRemove={() => actions.removeEntry('skills', index)}>
            <p className="text-[10pt]">
              <EditableText value={entry.category} placeholder="Category" className="font-bold" onChange={edit('category')} />
              {': '}
              <EditableText value={entry.items} placeholder="Skills, comma separated" onChange={edit('items')} />
            </p>
          </ResumeEntry>
        );
      })}
    </ResumeSection>
  );
}
