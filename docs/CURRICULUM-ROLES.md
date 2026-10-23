# MIT curriculum roles

Verified against official MIT sources on October 23, 2026, for the existing 81-subject, 2026–2027 prototype. `web/src/domain/progression.ts` contains the explicit mappings. This replaces the former prerequisite-depth labels; the prerequisite graph still determines course ordering.

Foundation and Core are CourseGraph's short display names for documented curriculum groups. They are not universal MIT difficulty ratings, recommended class years, or claims that every displayed option is required. A subject's role can depend on the selected program. The fallback is Undergraduate, using the catalog's published subject level.

## Source-backed mapping

| Official evidence | Display role | Imported subjects covered |
| --- | --- | --- |
| [MIT science GIR options](https://catalog.mit.edu/mit/undergraduate-education/general-institute-requirements/) | Foundation | 18.01, 18.01A, 18.01L, 18.02, 18.02A, 18.022, 8.01, 8.012, 8.01L, 8.02, 8.022 |
| [MIT REST foundation options](https://catalog.mit.edu/mit/undergraduate-education/general-institute-requirements/) | Foundation, unless an advanced designation takes precedence | 1.00, 14.30, 16.001, 16.C20, 18.03, 18.032, 18.05, 18.06, 18.090, 18.C06, 2.003, 9.01 |
| [EECS common entry points](https://www.eecs.mit.edu/academics/subject-numbering/) | Foundation, unless the selected program gives a more specific role | 6.1000, 6.100A, 6.100B, 6.1010, 6.1200, 6.1210, 6.1910, 6.3000, 6.3700, 6.3800, 6.3900 |
| [Official subject descriptions](https://catalog.mit.edu/subjects/6/) | Foundation | 6.100L explicitly serves new programmers; 6.120A covers elementary discrete mathematics and proof |
| [EECS introductory C and Assembly update](https://www.eecs.mit.edu/academics/subject-updates/changes-to-6-1903-6-1904/) | Foundation | 6.1903 and its historical 6.1904 variant; offering availability remains separate |
| [6-3 departmental requirements](https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/) | Core | 6.1020, 6.1220, 6.1400, 6.1800; other named options retain their explicit Foundation or Advanced roles |
| [6-4 Fundamentals, Centers, and Application CI-M groups](https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/) | Fundamentals → Foundation; Centers/Application → Core unless officially Advanced | Exact imported intersections are enumerated in the module. For example, 6.3900 and 6.3000 are Core in the 6-4 view; 18.06 is Foundation. |
| [EECS Advanced Undergraduate Subjects](https://catalog.mit.edu/degree-charts/eecs-subject-groupings/) | Advanced | 6.1810, 6.3100, 6.3260, 6.3720, 6.4210, 6.4300, 6.4400, 6.4420, 6.4610, 6.5831, 6.C571, 18.404 |
| [EECS Advanced Departmental Laboratories](https://catalog.mit.edu/degree-charts/eecs-subject-groupings/) | Advanced | 6.4200, 6.C35, plus overlapping subjects already listed above |
| [Mathematics degree/minor advanced-subject definition](https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext) | Advanced | 18.100A, 18.100B, 18.100P, 18.100Q, 18.200, 18.404, 18.600, 18.650, 18.700, 18.701 |
| Each course's official MIT subject page | Graduate | The imported `level: 'graduate'` always takes precedence. |

For Mathematics, MIT explicitly defines its advanced group using the first decimal digit. We enumerate the imported subjects that meet that definition; we do not extend it to other departments or automatically classify future imports. In EECS, the number also identifies subject areas and undergraduate/graduate variants. A larger number is not a linear measure of difficulty. In particular, 6.1220 remains Core because its deeper prerequisite chain is not evidence of membership in the official advanced list.

The [6-P chart](https://catalog.mit.edu/degree-charts/master-electrical-engineering-computer-science-course-6-p/) describes a graduate component following an eligible EECS bachelor's degree. Its undergraduate preparation retains undergraduate roles; MEng membership does not promote a course to Graduate. Admission, approved subject allocation, and degree certification remain outside this display classifier.

Transfer/AP credit is a student's credit status, never a course role. This change creates no transfer records or substitutions. The role helper neither edits earned history nor changes prerequisite eligibility, units, course completion, program progress, or admission status.

## API and precedence

`getCourseStage(course, courses, program?)` returns `id`, `label`, `order`, `explanation`, `sourceUrl`, and `sourceLabel`. Existing styling IDs remain: `introductory` means Foundation, `intermediate` means Core, plus `advanced`, `graduate`, and the new `undergraduate` fallback. Order is Foundation 0, Core/Undergraduate 1, Advanced 2, Graduate 3. Prerequisite constraints take precedence over this broad grouping in layout.

Graduate level wins, followed by explicit advanced groups, selected-program groups, documented foundational groups, and the published Undergraduate fallback. No graph-depth or numeric heuristic is used.
