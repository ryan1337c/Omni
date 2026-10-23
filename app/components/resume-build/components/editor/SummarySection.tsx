import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import EditableText from './EditableText';
import { ResumeEntry, ResumeSection } from './ResumeSection';

type SummarySectionProps = {
  summary: string;
  /** Whether the section is on the page. Kept apart from `summary` so clearing the text doesn't hide it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: ResumeEditorActions;
};

/** Professional Summary: one small paragraph, flush under the section rule like Technical Skills. */
export default function SummarySection({ summary, open, onOpenChange, actions }: SummarySectionProps) {
  return (
    <ResumeSection
      id="summary"
      entryCount={open ? 1 : 0}
      maxEntries={1}
      addLabel="Add professional summary"
      onAdd={() => onOpenChange(true)}
      dense
    >
      {open && (
        <ResumeEntry
          removeLabel="Remove professional summary"
          onRemove={() => {
            actions.updateField({ section: 'summary' }, '');
            onOpenChange(false);
          }}
          placement={{ section: 'summary' }}
        >
          <p className="text-[10pt]">
            <EditableText
              value={summary}
              placeholder="Who you are, what you've done that matters for this role, and the value you'd bring (2-4 sentences)"
              onChange={(value) => actions.updateField({ section: 'summary' }, value)}
            />
          </p>
        </ResumeEntry>
      )}
    </ResumeSection>
  );
}
