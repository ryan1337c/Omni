import type { ProjectEntry } from '@/lib/resume/schema';
import { MAX_BULLETS_PER_ENTRY } from '@/lib/resume/parseResumeJson';

import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import BulletList from './BulletList';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection, SubheadingRow } from './ResumeSection';

type ProjectsSectionProps = {
  entries: ProjectEntry[];
  actions: ResumeEditorActions;
};

/** `\resumeProjectHeading{\textbf{name} | \emph{technologies}}{dates}` followed by its bullets. */
export default function ProjectsSection({ entries, actions }: ProjectsSectionProps) {
  return (
    <ResumeSection
      id="projects"
      entryCount={entries.length}
      addLabel="Add project"
      onAdd={() => actions.addEntry('projects')}
    >
      {entries.map((entry, index) => {
        const edit = (field: Exclude<keyof ProjectEntry, 'bullets'>) => (value: string) =>
          actions.updateField({ section: 'projects', index, field }, value);
        // The PDF only prints the separator when both sides have text.
        const separatorMuted = !entry.name || !entry.technologies;

        return (
          <ResumeEntry
            key={index}
            removeLabel="Remove project"
            workHistoryEntry={{ section: 'projects', entry: index }}
            onRemove={() => actions.removeEntry('projects', index)}
            onAddBullet={
              entry.bullets.length < MAX_BULLETS_PER_ENTRY ? () => actions.addBullet('projects', index) : undefined
            }
          >
            <SubheadingRow
              left={
                <span className="text-[10pt]">
                  <EditableText value={entry.name} placeholder="Project Name" className="font-bold" onChange={edit('name')} />
                  <span className={`mx-[0.4em] ${separatorMuted ? 'text-slate-300' : ''}`}>|</span>
                  <EditableText value={entry.technologies} placeholder="Technologies" className="italic" onChange={edit('technologies')} />
                </span>
              }
              right={<EditableText value={entry.dates} placeholder="Dates" onChange={edit('dates')} />}
            />
            <BulletList section="projects" entryIndex={index} bullets={entry.bullets} actions={actions} />
          </ResumeEntry>
        );
      })}
    </ResumeSection>
  );
}
