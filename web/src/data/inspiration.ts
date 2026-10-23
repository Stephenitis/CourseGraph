/**
 * Editorial starting points for curiosity, not official program recommendations.
 * Titles, speakers and video destinations were checked against the linked MIT
 * pages on the date below. Playback and accessibility of external hosts vary.
 * See docs/INSPIRATION.md for provenance and curation boundaries.
 */
export type InspirationProgramId = 'major6-3' | 'major6-4' | 'minor18' | 'master6-P';

export interface InspirationTalk {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  whyWatch: string;
  format: 'Public talk' | 'Short lecture';
  year: number;
  sourceLabel: string;
  sourceUrl: string;
  videoUrl: string;
  programIds: readonly InspirationProgramId[];
  verifiedAt: string;
}

const verifiedAt = '2026-10-23';
const generativeAiSource = 'https://mitgenerativeaiweek.csail.mit.edu/videos.html';

export const inspirationTalks: readonly InspirationTalk[] = [
  {
    id: 'donti-climate-machine-learning',
    title: 'Tackling Climate Change with Machine Learning',
    speaker: 'Priya Donti',
    topic: 'Climate and machine learning',
    whyWatch: 'Imagine using your computing skills to work on a problem that matters to you.',
    format: 'Public talk',
    year: 2023,
    sourceLabel: 'MIT Generative AI Week',
    sourceUrl: generativeAiSource,
    videoUrl: 'https://www.youtube.com/watch?v=nvqvtkmW6kE',
    programIds: ['major6-3', 'major6-4', 'master6-P'],
    verifiedAt,
  },
  {
    id: 'andreas-generative-language',
    title: 'Generative AI Foundations: Jacob Andreas',
    speaker: 'Jacob Andreas',
    topic: 'Generative language models',
    whyWatch: 'Start asking what language models can do, and what you would want to understand about them.',
    format: 'Public talk',
    year: 2023,
    sourceLabel: 'MIT Generative AI Week',
    sourceUrl: generativeAiSource,
    videoUrl: 'https://www.youtube.com/watch?v=kEplxgwkb4Q',
    programIds: ['major6-4', 'major6-3', 'master6-P'],
    verifiedAt,
  },
  {
    id: 'solar-lezama-code-generation',
    title: 'Generative AI Foundations: Armando Solar-Lezama',
    speaker: 'Armando Solar-Lezama',
    topic: 'AI and code generation',
    whyWatch: 'Explore a research question behind the tools: how could computers help create programs?',
    format: 'Public talk',
    year: 2023,
    sourceLabel: 'MIT Generative AI Week',
    sourceUrl: generativeAiSource,
    videoUrl: 'https://www.youtube.com/watch?v=H6-7mD5TH1s',
    programIds: ['major6-3', 'master6-P', 'major6-4'],
    verifiedAt,
  },
  {
    id: 'strang-start-linear-algebra',
    title: 'Intro: A New Way to Start Linear Algebra',
    speaker: 'Gilbert Strang',
    topic: 'Vectors, matrices and mathematical structure',
    whyWatch: 'Try a small taste of the mathematical thinking behind a much bigger path.',
    format: 'Short lecture',
    year: 2020,
    sourceLabel: 'MIT OpenCourseWare',
    sourceUrl: 'https://ocw.mit.edu/courses/res-18-010-a-2020-vision-of-linear-algebra-spring-2020/resources/a-new-way-to-start-linear-algebra/',
    videoUrl: 'https://www.youtube.com/watch?v=YrHlHbtiSM0',
    programIds: ['minor18', 'major6-4', 'major6-3', 'master6-P'],
    verifiedAt,
  },
];

/** Unknown or future programs receive no unrelated fallback recommendations. */
export function getProgramInspiration(programId: string): readonly InspirationTalk[] {
  return inspirationTalks.filter(talk => talk.programIds.some(id => id === programId));
}
