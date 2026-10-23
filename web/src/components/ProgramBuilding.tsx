import './ProgramBuilding.css';

const stata = {
  name: 'Stata Center', detail: 'MIT · EECS', image: 'stata-center.jpg',
  alt: 'Softly faded photograph of MIT’s Stata Center',
  source: 'https://commons.wikimedia.org/wiki/File:Stata_Center.JPG',
  credit: 'Millylang · Public domain',
  license: 'https://creativecommons.org/publicdomain/mark/1.0/',
  about: 'https://www.eecs.mit.edu/about/departmental-history/',
};
const simons = {
  name: 'Simons Building', detail: 'MIT · Mathematics', image: 'simons-building.jpg',
  alt: 'Softly faded photograph of MIT’s Simons Building, home of mathematics',
  source: 'https://commons.wikimedia.org/wiki/File:MIT_-_Department_of_Mathematics_(54960639561).jpg',
  credit: 'Ajay Suresh · CC BY 4.0',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  about: 'https://capitalprojects.mit.edu/projects/mathematics-building-2',
};
const buildings: Record<string, typeof stata> = {
  'major6-3': stata, 'major6-4': stata, 'master6-P': stata, 'minor18': simons,
};

/** Department context, not a claim about where an individual class meets. */
export function ProgramBuilding({ programId }: { programId: string }) {
  const building = buildings[programId];
  if (!building) return null;
  return <figure className="program-building" key={programId}>
    <img src={`/images/buildings/${building.image}`} alt={building.alt} width="240" height="150" decoding="async" />
    <figcaption>
      <a href={building.about} target="_blank" rel="noreferrer">{building.name}<span>{building.detail}</span></a>
      <details className="building-credit"><summary aria-label={`Photo credits for ${building.name}`}>Photo</summary>
        <div><a href={building.source} target="_blank" rel="noreferrer">{building.credit}</a><a href={building.license} target="_blank" rel="noreferrer">License</a><span>Photograph cropped, desaturated and softly faded for display.</span></div>
      </details>
    </figcaption>
  </figure>;
}
