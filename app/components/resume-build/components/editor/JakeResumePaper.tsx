"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { JdKeyword, ResumeContent, SectionId } from '@/lib/resume/schema';

import { PAPER_HEIGHT_PX, PAPER_WIDTH_PX } from '../../constants';
import type { ResumeEditorActions } from '../../hooks/useResumeEditor';
import { useResumeKeywordHighlights } from '../../hooks/useResumeKeywordHighlights';
import EducationSection from './EducationSection';
import ExperienceSection from './ExperienceSection';
import HeaderSection from './HeaderSection';
import HonorsSection from './HonorsSection';
import ProjectsSection from './ProjectsSection';
import { SectionReorderProvider } from './SectionReorder';
import SkillsSection from './SkillsSection';
import SummarySection from './SummarySection';

type JakeResumePaperProps = {
  resume: ResumeContent;
  actions: ResumeEditorActions;
  /** Matched keywords to paint. An empty list leaves the page unmarked. */
  highlightKeywords: JdKeyword[];
};

/**
 * Editable HTML copy of the Jake template on a US Letter page (0.5in margins, 11pt Computer Modern).
 * The page keeps its true size and is scaled down with a transform to fit narrower panels.
 */
export default function JakeResumePaper({ resume, actions, highlightKeywords }: JakeResumePaperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(PAPER_HEIGHT_PX);
  const [summaryOpen, setSummaryOpen] = useState(resume.summary !== '');

  useResumeKeywordHighlights(paperRef, highlightKeywords, resume);

  const visibleOrder = useMemo(() => {
    const visible: Record<SectionId, boolean> = {
      summary: summaryOpen,
      education: resume.education.length > 0,
      experience: resume.experience.length > 0,
      projects: resume.projects.length > 0,
      skills: resume.skills.length > 0,
      honors: resume.honors.length > 0,
    };
    return resume.sectionOrder.filter((id) => visible[id]);
  }, [resume, summaryOpen]);

  const sections: Record<SectionId, ReactNode> = {
    summary: (
      <SummarySection summary={resume.summary} open={summaryOpen} onOpenChange={setSummaryOpen} actions={actions} />
    ),
    education: <EducationSection entries={resume.education} actions={actions} />,
    experience: <ExperienceSection entries={resume.experience} actions={actions} />,
    projects: <ProjectsSection entries={resume.projects} actions={actions} />,
    skills: <SkillsSection entries={resume.skills} actions={actions} />,
    honors: <HonorsSection entries={resume.honors} actions={actions} />,
  };

  useEffect(() => {
    const frame = frameRef.current;
    const paper = paperRef.current;
    if (!frame || !paper) return;

    // offsetHeight ignores transforms, so this is the unscaled height of the content.
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, frame.clientWidth / PAPER_WIDTH_PX));
      setPaperHeight(paper.offsetHeight);
    });
    observer.observe(frame);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  const overflowsPage = paperHeight > PAPER_HEIGHT_PX;

  return (
    // The transform doesn't shrink the layout box, so the frame reserves the scaled height itself.
    <div ref={frameRef} className="w-full" style={{ height: paperHeight * scale }}>
      <div
        ref={paperRef}
        className="jake-paper group/paper relative mx-auto origin-top-left bg-white p-[0.5in] shadow-lg ring-1 ring-black/5"
        style={{ width: PAPER_WIDTH_PX, minHeight: PAPER_HEIGHT_PX, transform: `scale(${scale})` }}
      >
        <HeaderSection header={resume.header} actions={actions} />
        <SectionReorderProvider visibleOrder={visibleOrder} onMove={actions.moveSection}>
          {resume.sectionOrder.map((id) => (
            <Fragment key={id}>{sections[id]}</Fragment>
          ))}
        </SectionReorderProvider>

        {/* Jake's format targets one page, so flag where the PDF would break onto page 2. */}
        {overflowsPage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400"
            style={{ top: PAPER_HEIGHT_PX }}
          >
            <span className="absolute right-3 top-0 -translate-y-1/2 bg-white px-1.5 font-sans text-[10px] font-medium uppercase tracking-wide text-red-500">
              Page 1 ends here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
