# MIT workload and semester planning

CourseGraph separates three questions that look similar but need different evidence:

1. **What has this student put on the calendar?** The planned horizon is the last term containing a selected course, with empty intervening regular semesters included in its span.
2. **Which modeled requirements have selected-course coverage?** Coverage counts the program's explicitly modeled requirement groups, preserving alternatives. It is partial and conditional on passing courses, valid prerequisites and degree allocation.
3. **How many semesters of unit capacity might be needed?** This requires the student's **advisor-confirmed remaining units**. It does not derive remaining degree credit from the small catalog subset or a universal degree total.

## Verified MIT facts

Sources checked October 23, 2026:

| Guidance | Official source |
| --- | --- |
| MIT generally expects an SB in four years; an average of 48 units across eight regular terms is its planning benchmark. | [MIT academic performance standards](https://catalog.mit.edu/mit/procedures/academic-performance-grades/) |
| The Office of the First Year calls 48–54 units typical. Sixty regular units may suit some students but is not the usual expectation. | [Credit limits and grading](https://firstyear.mit.edu/academics-exploration/credit-limits-grading/) |
| First-year fall permits 54 regular units, with up to 6 extra units restricted to approved discovery/advising subjects. Spring permits 60 regular units plus up to 6 approved discovery units. IAP is limited to 12 units. | [Registrar first-year guidance](https://registrar.mit.edu/registration-academics/advising-resources-students/progressing-through-mit-first-year) |
| First-year students on CAP warning after fall have a spring limit of four subjects, up to 48 units; other individual limits may apply. | [First-year credit limits](https://firstyear.mit.edu/academics-exploration/credit-limits-grading/) |
| A unit represents about 14 hours of work per term. For a full-term subject, this is approximately one hour per week, including instruction, lab and preparation. | [Registrar credit definition](https://registrar.mit.edu/registration-academics/academic-requirements/subject-levels-credit) and [catalog registration guidance](https://catalog.mit.edu/mit/procedures/registration/) |

The extra six first-year units are **not a general extra-course allowance**. The dataset does not classify all eligible discovery exceptions, so `exceedsRegularUnitCap` means above the regular-credit cap; it does not decide whether approved exception units make a particular registration valid. No universal upper-level or graduate cap is invented.

Unit-based hours describe academic workload assumptions, not measured workload or contact hours. Half-term subjects can concentrate that work into fewer weeks. Arranged units remain unknown. The helper returns no weekly estimate for IAP, summer or an unknown term; the approximately 14-hours-per-unit total still applies to the known units.

## Program totals and overlap

| Program | Published scope | What it does not mean |
| --- | --- | --- |
| [6-3 CS and Engineering](https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/) | 17 GIR subjects and 180–198 units beyond the GIRs. The major is 177–183 units; 36–60 of those also satisfy GIRs. Unrestricted electives are 48–60 units. | These figures overlap. Adding them all together produces an incorrect total. |
| [6-4 AI and Decision Making](https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/) | 17 GIR subjects and 180–189 units beyond the GIRs. The major is 168–177 units, with 36 units also satisfying GIRs, plus 48 unrestricted elective units. | Centers, CI-M, SERC and other requirements need valid subject allocation. Units alone do not fulfill them. |
| [Mathematics minor](https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext) | Six 12-unit mathematics subjects beyond the Institute Mathematics Requirement, including at least three advanced subjects, with essentially different content. | Its 72 units are a minor component; they are not automatically 72 additional units on top of a student's major. |
| [6-P EECS MEng](https://catalog.mit.edu/degree-charts/master-electrical-engineering-computer-science-course-6-p/) | The graduate component is 91 units: 24 thesis, 1 internship, 48 approved graduate subjects and 18 qualifying electives. | This excludes the required eligible bachelor degree and separate admission. A unit budget cannot predict thesis completion or concentration approval. |

The current 2026–2027 HTML degree charts are the source. Older PDFs may contain prior requirements. The prototype deliberately does not convert the average `48 × 8` planning benchmark into a universal 384-unit degree audit.

## Pace scenarios

The interface compares **36, 48 and 54 units per regular term**:

- **Lighter, 36:** a CourseGraph planning scenario, roughly three 12-unit subjects. It is not a personalized MIT recommendation or a statement that any student satisfies academic-progress rules.
- **Typical, 48:** MIT's average regular-term planning benchmark, roughly four 12-unit subjects.
- **Intensive, 54:** a CourseGraph label for the upper end of the published typical range. It is not a promise that a student can finish earlier.

These are undergraduate reference loads. The graduate MEng component may be explored as arithmetic capacity but still needs program-specific advising, thesis planning and approval. A smaller unit total does not necessarily mean a less demanding term.

For an advisor-confirmed 150 remaining units, the three capacity scenarios are:

| Pace | Capacity-only semesters | Unit budgets |
| --- | --- | --- |
| 36 | 5 | 36, 36, 36, 36, 6 |
| 48 | 4 | 48, 48, 48, 6 |
| 54 | 3 | 54, 54, 42 |

Those last-term fragments are arithmetic, not guaranteed combinations of available classes. The projection alternates fall and spring and does not silently assume summer or IAP availability. Prerequisite sequences, annual offerings, course sizes, approvals and degree rules can extend the calendar. A zero remaining-unit entry does not verify graduation requirements.

## Implementation contract

`web/src/domain/workload.ts` exports:

- `workloadGuidance`: source-linked facts and limits, with verification date.
- `programRequirementSummaries[programId]`: published unit ranges, component scope, requirement summary and source.
- `paceScenarios`: 36/48/54-unit options and explanations.
- `getCreditLimit(term, context?)`: applicable regular-unit cap, restricted discovery allowance, optional subject cap and explanation. `context` takes `isFirstYear?` and `onAcademicWarning?`; the UI must not infer student year from a calendar year alone.
- `summarizeTermWorkload(path, courses, term, context?)`: planned unique course count, known-unit subtotal, unknown/arranged-unit IDs, approximate hours, relative-load band and cap checks. Completed academic history is excluded from future workload.
- `estimateRemainingSemesters(remainingUnits, unitsPerTerm)`: `ceil(remaining / pace)`, or `null` when the input is absent, negative, non-finite or the pace is invalid. Zero is a valid explicit input.
- `projectCapacity(remainingUnits, unitsPerTerm, startTerm)`: semester count, fall/spring unit-budget rows and a required limitation message. It never assigns courses. It bounds the visual series at 40 terms while retaining the full calculated count.
- `getPlannedHorizon(path)`: first/last known planned term, distinct planned-term count, regular-semester span and unknown terms. It explicitly labels this as a selected-course horizon.
- `getMappedRequirementProgress(program, path, courses)`: completed/selected/missing known groups plus manual-review reasons. Groups can overlap, particularly in the mathematics minor; they must not be described as remaining subjects or unit credit. Planned coverage does not imply prior-course eligibility.

Optional persisted `remainingUnits` must originate from user input, labeled as advisor-confirmed; it must have no prefilled degree-derived default. Optional `paceUnits` records the chosen comparison capacity. Imported values need finite, nonnegative validation for remaining units and validation against supported pace options.

## Validation

`npm test` in `web/` covers official-value distinctions, normal load versus caps, absent/invalid remaining units, explicit zero, arithmetic budgets and calendar order, exclusion of completed history, deduplication, arranged credit, IAP workload handling, restricted allowance separation, CAP subject limits, empty semesters in the selected-course horizon, and manual degree-audit boundaries.
