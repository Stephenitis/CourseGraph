import { ChevronDown, ExternalLink, Play } from 'lucide-react';
import { getProgramInspiration } from '../data/inspiration';
import './InspirationPanel.css';

/** Official school videos remain optional, with playback chosen by the student. */
export function InspirationPanel({ programId }: { programId: string }) {
  const talks = getProgramInspiration(programId);
  if (!talks.length) return null;
  return <details className="inspiration-panel" key={programId}>
    <summary>
      <span className="inspiration-heading"><Play size={13} aria-hidden="true" /> Explore the field</span>
      <ChevronDown size={13} className="inspiration-chevron" aria-hidden="true" />
    </summary>
    <p className="inspiration-intro">Hear MIT faculty connect these ideas to the world.</p>
    <div className="inspiration-talks">
      {talks.map(talk => <article className="inspiration-talk" key={talk.id}>
        <span className="inspiration-format">{talk.format} · {talk.year}</span>
        <a className="inspiration-video" href={talk.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${talk.title} with ${talk.speaker} (opens in a new tab)`}>
          <span>{talk.title}</span><ExternalLink size={12} aria-hidden="true" />
        </a>
        <p className="inspiration-speaker">{talk.speaker}</p>
        <p className="inspiration-why">{talk.whyWatch}</p>
        <a className="inspiration-source" href={talk.sourceUrl} target="_blank" rel="noopener noreferrer">{talk.sourceLabel}<span className="sr-only"> source, opens in a new tab</span></a>
      </article>)}
    </div>
    <p className="inspiration-note">Curated inspiration. Program connections are our suggestions.</p>
  </details>;
}
