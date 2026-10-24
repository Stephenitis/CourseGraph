import { useEffect, useMemo, useState } from 'react';
import type { SavedPath } from '../domain/types';
import { getSemesterRevealStages } from './semesterReveal';

export function useSemesterReveal(path: SavedPath, enabled: boolean) {
  const [run, setRun] = useState(0);
  const [sequence, setSequence] = useState(() => ({pathId:path.id, stages:getSemesterRevealStages(path.courses), index:-1, playing:true}));
  // Snapshot on map entry/path switch/replay; edits should never restart an entrance.
  useEffect(() => {
    const stages = getSemesterRevealStages(path.courses);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => setSequence(current => ({...current, playing:false}));
    if (!enabled || media.matches || !stages.length) {
      setSequence({pathId:path.id, stages, index:stages.length, playing:false});
      return;
    }
    setSequence({pathId:path.id, stages, index:-1, playing:true});
    const interval = Math.max(500, Math.min(1150, 8000 / stages.length));
    const timers = stages.map((_, index) => window.setTimeout(() => {
      setSequence(current => current.playing ? {...current,index} : current);
    }, 300 + index * interval));
    timers.push(window.setTimeout(stop, 300 + stages.length * interval));
    media.addEventListener('change', stop);
    return () => {timers.forEach(window.clearTimeout);media.removeEventListener('change',stop);};
    // The latest plan is captured when an entrance starts, not on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path.id, enabled, run]);
  const stageById = useMemo(() => new Map(sequence.stages.flatMap((stage,index) => stage.courseIds.map(id => [id,index] as const))), [sequence.stages]);
  const playing = enabled && sequence.pathId === path.id && sequence.playing;
  return {...sequence, playing, stageById,
    skip: () => setSequence(current => current.playing ? {...current,playing:false} : current),
    replay: () => setRun(current => current + 1)};
}
