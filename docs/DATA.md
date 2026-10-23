# MIT catalog and rule engine

The prototype includes **81 real MIT subjects** and four program views: Computer Science and Engineering (6-3), Artificial Intelligence and Decision Making (6-4), the mathematics minor, and EECS MEng (6-P). The dataset is a curated exploration subset with the prerequisite/corequisite closure needed to avoid dangling course references. Saved starter paths are examples, not student records.

## Snapshot and sources

- Catalog year: **2026–2027**. The official subject pages identify this academic year. The live snapshot was fetched October 23, 2026; its exact UTC timestamp is recorded in the catalog.
- Structured catalog: [FireRoad catalog API](https://fireroad.mit.edu/reference/catalog), [`/courses/all?full=true`](https://fireroad.mit.edu/courses/all?full=true).
- Source revision: [FireRoad semester manifest](https://fireroad.mit.edu/courseupdater/semesters), **fall-2026, version 44** at ingestion.
- Authoritative literal prerequisites, descriptions and offering context: [MIT subject catalog](https://catalog.mit.edu/subjects/), departments 1, 2, 6, 8, 9, 14, 16 and 18. Every course links to its own MIT catalog search result.
- [6-3 degree chart](https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/).
- [6-4 degree chart](https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/). The URL's `artifical` spelling is MIT's published URL.
- [Mathematics minor](https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext).
- [6-P degree chart](https://catalog.mit.edu/degree-charts/master-electrical-engineering-computer-science-course-6-p/).

`web/src/data/source/mit-2026-2027.json` preserves the selected FireRoad fields, official catalog extracts, source URLs, retrieval time, and source revision. `web/src/data/catalog.ts` is generated from it. Source facts, including titles, subject IDs, units and raw prerequisites, are not invented.

## What is automated

`web/src/domain/requirements.ts` is a pure deterministic evaluator; ordinary exploration requires no language-model API call.

- Nested all/any expressions retain the alternative structure. A fulfilled OR branch makes its unused alternatives unnecessary.
- Course, subject-count and unit requirements are evaluated against an explicit course set. Duplicate identical items/IDs do not inflate counts or units. Unit totals with missing or arranged credit data remain unresolved.
- Permission and unknown/free-text requirements return **review**. Adding a course cannot resolve instructor consent or admission.
- A prerequisite must be marked completed or be planned in an earlier calendar term. Corequisites can be completed, earlier, or planned in the same term. Unknown terms cannot prove ordering.
- Completed course records represent the student's stated history. The prototype does not re-audit how those courses were completed.
- Transitive downstream traversal is cycle-safe and means “contributes toward,” not “guarantees eligibility.”
- For `any`, `count` and `units`, `missingCourseIds` contains possible ways to fill the gap, not a list of individually mandatory courses. The accompanying reasons preserve this distinction.

Dates are calendar-year terms: Fall 2026 precedes IAP 2027, then Spring 2027. Both `Fall 2026` and `fall-2026` strings are understood.

## What needs a human check

All four program expressions deliberately retain an unresolved review condition even when every course in the subset is selected. They must not report a completed degree audit.

The 6-3 view models core departmental requirements but not full track allocation. The 6-4 view models foundations and application CI-M options; its five center areas overlap, so allocation and full elective coverage remain manual. The math minor includes six-subject and three-advanced-subject thresholds, but distinct content, equivalencies, eligibility and degree overlap still require review. Different versions of analysis or linear algebra must not be presumed to earn separate minor credit.

The MEng view includes thesis/internship subjects and graduate exploration examples. It does not verify program admission, eligible MIT undergraduate status, approved graduate lists, concentration allocation, thesis completion or approved credit. The current 2026–2027 HTML degree chart specifies **48 graduate units plus 18 qualifying elective units**; older downloadable PDFs/search results showed different totals. The prototype follows the current HTML and exposes the source.

GIR nodes expand common subject alternatives for Calculus I/II and Physics I/II. The subset does not include every GIR pathway. Advanced standing, transfer/AP credit, cross-listed aliases, other equivalent subjects, substitutions and exceptions need advisor review. Catalog notes preserve joint numbers and excluded-credit relationships without automatically treating them as interchangeable.

`6.THM` has arranged units in the subject catalog. Its numeric placeholder is zero and its label/notes state that units are arranged. The MEng degree chart's 24-unit thesis requirement is separate; selecting this node does not award 24 units.

## Scheduling

**No meeting schedules are supplied in this snapshot.** Seasonal offerings describe catalog patterns, not future class times or guaranteed availability. Subjects not offered in 2026–2027, including 6.5831 and 18.100Q, have empty offering arrays and explicit notes. A reproducible importer override follows the [official Fall 2026 EECS update](https://www.eecs.mit.edu/academics/subject-updates/changes-to-6-1903-6-1904/), verified October 23, 2026: 6.1903 runs in Fall and Spring as a prerequisite to 6.1910; 6.1904 is no longer offered. The 6.1904 record and prerequisite alternative remain for historical earned credit, but its empty offering array prevents future automatic scheduling. The original source snapshot is preserved, and each corrected subject carries the update's provenance.

FireRoad exposes compact schedules, but those strings can include alternative recitations/labs and do not capture a student's selected section. Importing every alternative as compulsory would create false conflicts. The ingestion deliberately omits them.

`detectScheduleConflicts(path, courses)` is ready for validated meeting data. It compares only planned courses, the same known term, shared weekdays and overlapping time intervals. Back-to-back meetings do not conflict, and last year's times are never applied to next year. Meetings must describe selected/required sections, not all alternative sections. Days use integers 0–6 consistently (Sunday–Saturday). An empty result with missing meeting data means **unverified**, not conflict-free.

A future schedule importer needs official term-specific sections, a section-selection model, linked lecture/lab combinations, exceptions/holiday dates and a clear schedule freshness indicator before the UI can make stronger claims.

## Rebuild or refresh

Rebuild deterministically from the checked-in snapshot, with Python 3 and no Python dependencies:

```sh
python3 web/scripts/ingest-mit.py
```

Fetch current public sources and replace the pinned snapshot (requires `curl` and internet access):

```sh
python3 web/scripts/ingest-mit.py --refresh
```

The refresh expands prerequisite/corequisite closure, rejects missing current subjects, confirms the pinned academic year is present, and compares explicit prerequisite subject references against official course blocks. Disagreements become manual-review conditions. This check detects reference mismatches; it does not prove every nested operator or policy condition matches. Program mappings are a reviewed snapshot coded in the importer and must be checked against their source pages when refreshing. A new academic year should get a new snapshot file, reviewed mappings and a plan migration decision, not a silent overwrite of students' prior catalogs.

Validate the engine and importer:

```sh
cd web
npm test
cd ..
python3 web/scripts/test_ingest_mit.py
```

Tests cover nested alternatives, permission conditions, real MIT prerequisite choices, chronological planning/corequisites, unit/count handling, cycle-safe traversal, actual-time conflict rules, dependency closure, unavailable schedule data, and program audit boundaries.

## Curriculum roles and expanded program maps

`web/src/domain/progression.ts` supplies source-backed curriculum roles for every imported subject:

- **Graduate** comes directly from MIT's published graduate subject level.
- **Foundation** summarizes MIT entry-point, Fundamentals, and science/REST foundation groups. **Core** summarizes documented departmental requirement groups, with the selected program used where relevant.
- **Advanced** requires an explicit MIT advanced-subject or advanced-laboratory designation. Mathematics' published advanced-subject definition is applied only to the enumerated imported math subjects.
- **Undergraduate** is the published-level fallback where no more specific source-backed role is mapped. Course numbers and prerequisite depth do not create a role. Actual prerequisite relationships remain responsible for map ordering.

`getCourseStage(course, courses, program?)` returns an ID, display label, broad order, explanatory text, source URL and source label. The [curriculum role source matrix](CURRICULUM-ROLES.md) documents every mapping group and its boundaries. Roles do not represent student transfer credit, difficulty, earned history, or degree certification.

`getProgramCourseClosure(program, courses, additionalCourseIds?)` includes every subject ID in the prototype's program record, every modeled requirement option, optional additional planned IDs, and recursive prerequisite **and corequisite** subjects. It deduplicates cycles and reports unavailable IDs separately. The base closures currently contain:

| Program | Available subjects including prerequisite/corequisite closure |
| --- | ---: |
| 6-3 CS and Engineering | 39 |
| 6-4 AI and Decision Making | 56 |
| Mathematics minor | 24 |
| 6-P EECS MEng | 39 |

All four current closures have zero dangling subject references. These counts overlap between programs and do not represent degree requirements or the number of classes a student must take. Displaying the entire closure removes the earlier small visual selection limit, but it does not expand the underlying catalog or complete its degree audit. Some approved alternatives and electives remain outside the curated subset—for example, the 6-4 center option combining 6.C01 and 6.C011, and several advanced electives. Full MIT degree coverage still needs additional ingestion and reviewed policy mappings.
