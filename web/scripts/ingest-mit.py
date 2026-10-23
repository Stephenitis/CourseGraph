#!/usr/bin/env python3
"""Build the versioned MIT prototype subset. Offline by default; --refresh downloads public sources."""
import argparse
import datetime
import html
import json
import pathlib
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'src/data/source/mit-2026-2027.json'
YEAR = '2026-2027'
PROGRAMMING_UPDATE_URL = 'https://www.eecs.mit.edu/academics/subject-updates/changes-to-6-1903-6-1904/'
SEEDS = '''6.1000 6.100A 6.100B 6.100L 6.1010 6.1020 6.1200 6.1210 6.1220 6.1400 6.1800 6.1810 6.1903 6.1910 6.3700 6.3800 6.3900 6.3720 6.3000 6.3100 6.4110 6.4400 6.3950 6.4200 6.4210 6.4300 6.4610 6.5831 6.7900 6.7910 6.7920 6.5840 6.7800 6.9830 6.THM 18.01 18.02 18.03 18.05 18.06 18.C06 18.100A 18.100B 18.100P 18.200 18.404 18.600 18.650 18.700 18.701 16.C20 6.3260 6.4120 6.4590 6.C35 6.C571 6.4420'''.split()
GIRS = {'GIR:CAL1': ['18.01', '18.01A', '18.01L'], 'GIR:CAL2': ['18.02', '18.022', '18.02A'], 'GIR:PHY1': ['8.01', '8.012', '8.01L'], 'GIR:PHY2': ['8.02', '8.022']}
PROGRAM_URLS = {
 'major6-3': 'https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/',
 'major6-4': 'https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/',
 'minor18': 'https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext',
 'master6-P': 'https://catalog.mit.edu/degree-charts/master-electrical-engineering-computer-science-course-6-p/',
}
COURSE_PATTERN = r'\b(?:\d{1,2}|[A-Z]{2,5})\.[A-Za-z0-9]+'

def fetch(url):
    return subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '45', url], text=True)

def plain(value):
    return ' '.join(html.unescape(re.sub('<[^>]+>', ' ', value)).split())

def official_blocks(page):
    output = {}
    for block in re.split(r'<div class="courseblock">', page)[1:]:
        title = re.search(r'class="courseblocktitle"[^>]*>.*?<strong>(.*?)</strong>', block, re.S)
        if not title: continue
        title = plain(title.group(1))
        course_id = title.split(' ', 1)[0].replace('[J]', '')
        fields = {'title': title, 'sourceUrl': f'https://catalog.mit.edu/search/?P={course_id}'}
        for key, tag in [('prerequisiteText', 'prereq'), ('termText', 'terms'), ('unitsText', 'hours'), ('description', 'desc')]:
            match = re.search(r'class="courseblock' + tag + r'"[^>]*>(.*?)</(?:span|p)>', block, re.S)
            fields[key] = plain(match.group(1)) if match else ''
        output[course_id] = fields
    return output

def course(course_id): return {'kind': 'course', 'courseId': course_id}
def all_of(*items): return {'kind': 'all', 'items': list(items)}
def any_of(*items): return {'kind': 'any', 'items': [course(x) if isinstance(x, str) else x for x in items]}
def review(text): return {'kind': 'unknown', 'text': text}

def parse(raw):
    """Parse FireRoad's explicit comma=AND, slash=OR, parenthesis grammar; never infer free text."""
    raw = raw.strip()
    if not raw or raw.lower() == 'none': return None
    def split_at(text, delimiter):
        depth, quoted, start, parts, i = 0, False, 0, [], 0
        while i < len(text):
            if text[i:i+2] == "''": quoted = not quoted; i += 2; continue
            if not quoted:
                if text[i] == '(': depth += 1
                if text[i] == ')': depth -= 1
                if text[i] == delimiter and depth == 0: parts.append(text[start:i].strip()); start = i + 1
            i += 1
        if depth != 0 or quoted: raise ValueError(f'Unbalanced prerequisite: {text}')
        parts.append(text[start:].strip())
        return parts
    # Strip only parentheses spanning the entire expression.
    while raw.startswith('(') and raw.endswith(')'):
        depth = 0; closes_at_end = True
        for i, char in enumerate(raw):
            if char == '(': depth += 1
            if char == ')': depth -= 1
            if depth == 0 and i < len(raw) - 1: closes_at_end = False; break
        if not closes_at_end: break
        raw = raw[1:-1].strip()
    for delimiter, kind in [(',', 'all'), ('/', 'any')]:
        pieces = split_at(raw, delimiter)
        if len(pieces) > 1: return {'kind': kind, 'items': [parse(piece) for piece in pieces]}
    if raw in GIRS: return any_of(*GIRS[raw])
    if re.fullmatch(COURSE_PATTERN, raw): return course(raw)
    text = raw.strip("'")
    return {'kind': 'permission' if 'permission' in text.lower() else 'unknown', 'text': text}

def refs(requirement):
    if not requirement: return []
    if requirement['kind'] == 'course': return [requirement['courseId']]
    return [x for item in requirement.get('items', []) for x in refs(item)]

def refresh():
    raw = json.loads(fetch('https://fireroad.mit.edu/courses/all?full=true'))
    available = {item['subject_id']: item for item in raw if not item.get('is_historical')}
    chosen, todo = set(), SEEDS.copy()
    while todo:
        course_id = todo.pop(0)
        if course_id in chosen: continue
        if course_id not in available: raise ValueError(f'Missing current course {course_id}; review before changing snapshot')
        chosen.add(course_id)
        item = available[course_id]
        todo += refs(parse(item.get('prerequisites', ''))) + refs(parse(item.get('corequisites', '')))
    departments = sorted({item.split('.')[0] for item in chosen})
    with ThreadPoolExecutor(max_workers=4) as pool:
        pages = dict(zip(departments, pool.map(lambda dept: fetch(f'https://catalog.mit.edu/subjects/{dept}/'), departments)))
    official = {key: value for page in pages.values() for key, value in official_blocks(page).items()}
    missing = chosen - set(official)
    if missing: raise ValueError(f'Official catalog has no course block: {missing}')
    if not any('Acad Year ' + YEAR in page for page in pages.values()): raise ValueError('Catalog year could not be verified')
    # Keep only the source fields used by the prototype. Raw schedule strings are deliberately not imported.
    keys = ['subject_id', 'title', 'description', 'level', 'total_units', 'lecture_units', 'lab_units', 'preparation_units', 'is_variable_units', 'prerequisites', 'corequisites', 'offered_fall', 'offered_IAP', 'offered_spring', 'offered_summer', 'not_offered_year', 'joint_subjects', 'equivalent_subjects']
    source = {
        'catalogYear': YEAR,
        'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'fireroadVersion': json.loads(fetch('https://fireroad.mit.edu/courseupdater/semesters'))[-1],
        'courses': [{key: available[course_id][key] for key in keys if key in available[course_id]} for course_id in sorted(chosen)],
        'official': {course_id: official[course_id] for course_id in sorted(chosen)},
        'programSourceUrls': PROGRAM_URLS,
    }
    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(json.dumps(source, indent=2, ensure_ascii=False) + '\n')
    return source

def normalize(source):
    output = []
    for item in source['courses']:
        course_id = item['subject_id']; verified = source['official'][course_id]
        notes = []
        prerequisite = parse(item.get('prerequisites', '')); corequisite = parse(item.get('corequisites', ''))
        # Cross-check explicit subject IDs against the authoritative catalog. GIR expansions are handled separately.
        official_ids = set(re.findall(COURSE_PATTERN, verified['prerequisiteText']))
        raw_ids = set(re.findall(COURSE_PATTERN, item.get('prerequisites', '') + ' ' + item.get('corequisites', '')))
        if official_ids != raw_ids:
            notes.append('Source prerequisite mismatch: automated eligibility requires manual review of the official catalog.')
            prerequisite = all_of(prerequisite or all_of(), review(verified['prerequisiteText']))
        terms = [label for key, label in [('offered_fall', 'Fall'), ('offered_IAP', 'IAP'), ('offered_spring', 'Spring'), ('offered_summer', 'Summer')] if item.get(key)]
        if item.get('not_offered_year') == YEAR or f'Acad Year {YEAR}: Not offered' in verified['termText']:
            terms = []
            notes.append(f'Not offered in academic year {YEAR}; future availability is not guaranteed.')
        if any(key in item.get('prerequisites', '') + item.get('corequisites', '') for key in GIRS):
            notes.append('GIR prerequisites include common MIT subject options. Transfer credit, advanced standing, substitutions, and other GIR equivalents require advisor review.')
        if 'Not offered regularly' in verified['termText']:
            notes.append('Not offered regularly; consult the department.')
        if item.get('is_variable_units'):
            notes.append('Units are arranged. The 0-unit placeholder is excluded from automatic unit guarantees; thesis degree requirements are separate.')
        if item.get('joint_subjects'):
            notes.append('Joint subject numbers: ' + ', '.join(item['joint_subjects']) + '. Alias credit is not automatically merged in this prototype.')
        if item.get('equivalent_subjects'):
            notes.append('Credit cannot also be received for: ' + ', '.join(item['equivalent_subjects']) + '. Double-counting requires review.')
        if item.get('level') == 'G':
            notes.append('Graduate registration/admission and program approval are separate from course prerequisites.')
        # Official Fall 2026 departmental update supersedes the older term flags.
        # Verified 2026-10-23. Keep 6.1904 for historical credit/prerequisite references.
        if source['catalogYear'] == '2026-2027' and course_id in ('6.1903', '6.1904', '6.1910'):
            if course_id == '6.1903':
                terms = ['Fall', 'Spring']
                notes.append('EECS Fall 2026 update: offered every regular semester as a full-semester subject; it must precede 6.1910. Source: ' + PROGRAMMING_UPDATE_URL)
            elif course_id == '6.1904':
                terms = []
                notes.append('EECS Fall 2026 update: 6.1904 is no longer offered. Retained for historical credit; plan 6.1903 instead. Source: ' + PROGRAMMING_UPDATE_URL)
            else:
                notes.append('EECS Fall 2026 update: 6.1903 must be completed in an earlier semester, not taken as a corequisite. Historical 6.1904 credit remains represented in the catalog prerequisite alternatives. Source: ' + PROGRAMMING_UPDATE_URL)
        output.append({
            'id': course_id, 'title': item['title'], 'department': course_id.split('.')[0],
            'units': item.get('total_units', 0), 'unitsLabel': 'Units arranged' if item.get('is_variable_units') else f"{item.get('lecture_units', 0)}-{item.get('lab_units', 0)}-{item.get('preparation_units', 0)} units",
            'level': 'graduate' if item.get('level') == 'G' else 'undergraduate', 'terms': terms,
            'description': verified['description'] or item.get('description', ''),
            'prerequisites': prerequisite, 'corequisites': corequisite,
            'prerequisiteText': verified['prerequisiteText'], 'sourceUrl': verified['sourceUrl'], 'notes': notes,
        })
    return output

def programs(courses):
    foundation = ['6.1000', '6.100A', '6.100B', '16.C20', '6.1010', '6.1200', '6.1210']
    intro = any_of('6.1000', all_of(course('6.100A'), course('6.100B')), all_of(course('6.100A'), course('16.C20')))
    common = [intro, course('6.1010'), course('6.1200'), course('6.1210')]
    probability = any_of('6.3700', '6.3800', '18.05')
    shared_note = 'Exploration subset, not a complete degree audit. GIRs, HASS, communication, PE, residency, substitutions, overlap and credit rules require advisor review.'
    math_ids = ['18.03', '18.032', '18.05', '18.06', '18.C06', '18.100A', '18.100B', '18.100P', '18.200', '18.404', '18.600', '18.650', '18.700', '18.701']
    return [
      {'id': 'major6-3', 'name': 'Computer Science and Engineering', 'shortName': 'Computer Science · 6-3', 'kind': 'major',
       'courseIds': foundation + ['6.1020', '6.1220', '6.1400', '6.1800', '6.1810', '6.1903', '6.1910', '6.3700', '6.3800', '18.05', '18.06', '18.C06', '6.3900', '6.4300', '6.4610', '6.5831', '6.5840', '18.01', '18.02'],
       'requirements': all_of(*common, course('6.1020'), any_of('6.1400', '6.1220'), any_of('6.1800', '6.1810', '6.5831'), course('6.1903'), course('6.1910'), any_of(probability, '18.06', '18.C06'), review('Complete track electives, advanced-undergraduate and AI subject requirements, institute requirements, communication requirements, and all credit/overlap rules.')),
       'sourceUrl': PROGRAM_URLS['major6-3'], 'notes': [shared_note, 'Core departmental requirements are modeled; the elective/track audit remains incomplete.']},
      {'id': 'major6-4', 'name': 'Artificial Intelligence and Decision Making', 'shortName': 'AI + Decision Making · 6-4', 'kind': 'major',
       'courseIds': foundation + ['18.06', '18.C06', '6.3700', '6.3800', '18.05', '6.3720', '6.3900', '6.3000', '6.3100', '6.4110', '6.4420', '6.4400', '6.C571', '6.1220', '6.1400', '6.3260', '6.3950', '6.4120', '6.4590', '6.C35', '6.4200', '6.4210', '6.4300', '6.4610', '18.01', '18.02'],
       'requirements': all_of(*common, any_of('18.06', '18.C06'), probability, any_of('6.4200', '6.4210', '6.4300', '6.4610'), review('Five center subjects must cover all five areas with valid subject allocation. Complete electives, advanced-undergraduate, second CI-M and SERC requirements, institute requirements, and credit/overlap rules.')),
       'sourceUrl': PROGRAM_URLS['major6-4'], 'notes': [shared_note, 'Centers include overlapping area choices; allocation is intentionally left for manual review. Not all approved electives are included.']},
      {'id': 'minor18', 'name': 'Mathematics Minor', 'shortName': 'Mathematics minor', 'kind': 'minor', 'courseIds': math_ids,
       'requirements': all_of({'kind': 'count', 'minimum': 6, 'items': [course(x) for x in math_ids]}, {'kind': 'count', 'minimum': 3, 'items': [course(x) for x in math_ids if x.split('.')[1][0] in '123456789']}, review('Six 12-unit mathematics subjects must be beyond the Institute Mathematics Requirement and have essentially different content. Confirm eligibility, equivalent subjects, major/minor overlap, and omitted subject options with an advisor.')),
       'sourceUrl': PROGRAM_URLS['minor18'], 'notes': [shared_note, 'Six 12-unit subjects, including three advanced subjects, are required. This subset offers examples; it is not the full set of eligible mathematics subjects.']},
      {'id': 'master6-P', 'name': 'Electrical Engineering and Computer Science MEng', 'shortName': 'EECS MEng · 6-P', 'kind': 'masters',
       'courseIds': ['6.1000', '6.1010', '6.1200', '6.1210', '6.1800', '6.1910', '6.3900', '18.06', '6.3700', '6.7900', '6.7910', '6.7920', '6.7800', '6.5840', '6.9830', '6.THM'],
       'requirements': all_of(course('6.THM'), course('6.9830'), review('Requires the eligible MIT EECS bachelor degree and MEng admission; 24 thesis units, four approved graduate subjects totaling at least 48 units with the concentration rule, and at least 18 units of qualifying Course 6/18 electives. Approval and allocation are not automated.')),
       'sourceUrl': PROGRAM_URLS['master6-P'], 'notes': ['Available to eligible MIT EECS undergraduates through a separate application; course selection does not imply admission.', 'Graduate courses shown are exploration examples. This is not a verified approved-subject/concentration audit.', 'The current 2026–2027 HTML degree chart specifies 48 graduate units plus 18 qualifying elective units; older PDF requirements differ.']},
    ]

def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--refresh', action='store_true'); args = parser.parse_args()
    source = refresh() if args.refresh else json.loads(SNAPSHOT.read_text())
    courses = normalize(source)
    catalog = {'school': 'MIT', 'catalogYear': source['catalogYear'], 'fetchedAt': source['fetchedAt'],
      'sourceUrls': ['https://fireroad.mit.edu/reference/catalog', 'https://fireroad.mit.edu/courses/all?full=true', 'https://fireroad.mit.edu/courseupdater/semesters', PROGRAMMING_UPDATE_URL, *PROGRAM_URLS.values(), *sorted({f'https://catalog.mit.edu/subjects/{c["department"]}/' for c in courses})],
      'courses': courses, 'programs': programs(courses),
      'notes': [f'MIT {YEAR} catalog subset with {len(courses)} real subjects; FireRoad {source["fireroadVersion"]["sem"]} version {source["fireroadVersion"]["v"]}.', 'Academic planning prototype; not a complete degree audit or registration system.', 'Course descriptions and literal prerequisite text are from official MIT catalog pages; structured prerequisites come from FireRoad and are cross-checked for subject references.', 'Meeting times are deliberately unavailable. No future schedule or conflict-free guarantee is inferred from seasonal offerings.', 'GIR alternatives, transfer/AP credit, cross-listed aliases, duplicate credit and special permission require manual review. School themes are appearance-only; every theme uses the same MIT data.']}
    path = ROOT / 'src/data/catalog.ts'
    path.write_text("// Generated by scripts/ingest-mit.py from the checked-in source snapshot.\nimport type { Catalog } from '../domain/types';\n\nexport const catalog: Catalog = " + json.dumps(catalog, indent=2, ensure_ascii=False) + ';\n')
    print(f'Wrote {len(courses)} courses and {len(catalog["programs"])} programs to {path}')
    print('Source mismatch review markers:', sum(any('mismatch' in n for n in c['notes']) for c in courses))

if __name__ == '__main__': main()
