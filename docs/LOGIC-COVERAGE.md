# Compact logic coverage

The prototype uses **81 real MIT subjects**, not invented demonstration courses. The small set demonstrates representative planning patterns; it does not claim to encode every university policy. Unsupported policy conditions remain visible for manual review instead of being guessed.

The coverage strategy has three layers:

1. Real MIT examples exercise the imported prerequisite structure.
2. Small, isolated **test-only fixtures** cover combinations not safely available from published production data, particularly section schedules.
3. Explicit manual-review boundaries cover policies that need more data or school-specific approval.

All fixture IDs such as `A`, `B`, `TARGET` and `OUTSIDE` exist only inside test files. Their artificial meeting times never enter `catalog.ts`, the public graph or a saved starter path.

## Requirement and chronology matrix

| Pattern | Example | Behavior and verification |
| --- | --- | --- |
| No listed prerequisite | MIT 6.1000 | No prior course requirement; this does not imply seat availability or degree credit approval. |
| One prerequisite | 6.1020 requires 6.1010 | Completed history or a valid earlier plan can support the next course. Same-term or later enrollment cannot satisfy a prerequisite. |
| AND | 6.1220 requires 6.1200 and 6.1210 | Both branches must be satisfied. |
| OR | 6.100B accepts 6.100A or instructor permission | A completed concrete alternative suffices. Permission remains unverified unless that concrete route is satisfied. |
| OR containing AND | 6.1010 accepts 6.1000 or the 6.100A + 6.100B/16.C20 route | Nested groups stay intact; selecting only one half of a required pair does not satisfy the branch. |
| AND containing nested OR | 6.1210 includes the 6.1200 route or the 6.120A plus probability route | Tests cover the valid combined alternative and the missing probability part. |
| Two independent alternatives | 6.3900 requires a programming choice and a mathematics choice | Selecting one valid choice in each group works; unused alternatives are not individually required. |
| Count of distinct courses | Mathematics minor's modeled six-subject and three-advanced-subject groups | Repeated identical IDs/items cannot inflate the count. These groups overlap, and degree eligibility/different content still need review. |
| Count of overlapping nested alternatives | Test fixture: choose two of `(A or B)` and `(A or C)` | `A` alone cannot count twice. If the evaluator cannot prove independent course allocation, it returns **review**. Disjoint routes still work. General allocation optimization is not claimed. |
| Unit threshold | Test fixtures over known course-unit values | Unique IDs contribute known units once. An OR alternative may satisfy the larger expression without completing the unused unit pool. |
| Overlap between separate unit groups | Test fixture with an explicit allocation-review condition | Each pool can be measured, but whether the same units may count toward two degree components is a separate policy. No automatic global double-counting approval. |
| Arranged, absent or invalid units | Real 6.THM; malformed unit fixtures | An arranged numeric placeholder, negative value or missing metadata cannot earn threshold credit. Enough other known credit can still satisfy the threshold. Otherwise the result is **review**, not a false credit total. |
| Permission, admission, free text | 18.701 instructor permission; MEng admission conditions | No course click grants consent or admission. Unknown conditions stay **review**. Empty alternative groups also stay unresolved. |
| Same-term corequisite | 18.03 with a Calculus II option | Completed, earlier or concurrent study can satisfy a corequisite. |
| Mutual corequisites | Real 16.001 and 16.002, with 18.03 and their other prerequisites | The term-group validator allows valid concurrent support without treating a prerequisite cycle as earned credit. |
| Broken upstream plan | 6.1010 planned without a valid entry route, followed by 6.1020 | The later course becomes **review**. An earlier planned course with unresolved requirements cannot certify later eligibility. |
| Valid conditional chain | Completed 6.1000 → planned 6.1010 → later planned 6.1020 | The planning check is met with an explicit conditional-completion reason. It does not turn planned courses into earned credit. |
| Valid alternative beside a broken route | Test fixture with a good alternative and an unused invalid planned branch | The good completed or valid planned alternative satisfies the choice; the unused broken route does not contaminate it. |
| Prerequisite cycle | Test fixtures, also exercised in progression traversal | Traversal terminates. A cyclic plan cannot bootstrap prerequisites; unresolved downstream reliance is marked for review. |
| Reference outside the catalog | Test fixture; production closure check | Coverage helpers report unavailable IDs. A planned subject with unavailable prerequisite data cannot certify another course. Current production program closures have no dangling references. |
| Completed history | A subject explicitly marked completed | Treated as user-stated history, not re-audited from its old prerequisites. Import validation still restricts known subject IDs. |
| Unknown term | Test fixtures | Unknown chronology cannot establish that a planned prerequisite came earlier. |
| Different catalog year | Persistence regression | Imports from a different year are rejected with a migration explanation. Current rules are not silently substituted for an older plan. |

`evaluateCourse().state === 'met'` means the modeled prerequisite/corequisite planning check is met. It does **not** mean a course is offered, admission is approved, a seat is reserved, a grade will be earned or a degree is complete. Valid plans relying on future subjects retain a conditional-completion reason.

The upstream validator evaluates regular chronological term groups. A group first has to satisfy prerequisites using completed or previously validated courses. It then removes courses whose corequisites cannot be supported by that group's remaining valid candidates. This allows true concurrent corequisite groups while preventing a failed prerequisite chain from silently propagating success.

## Offering and schedule matrix

| Pattern | Evidence | Behavior and boundary |
| --- | --- | --- |
| Known season pattern | MIT 18.700 lists Fall | The inspector warns when the selected season differs. This is distinct from prerequisite eligibility. |
| Known academic-year unavailability | 6.5831 and 18.100Q are not offered in 2026–2027 | Empty offerings plus explicit year-specific notes are preserved and displayed. |
| Future offering | Any plan beyond the source snapshot | No promise is made from a recurring catalog pattern. Current meeting times are not copied to a future year. |
| Overlapping time and day | Selected-section fixtures | A conflict identifies both course IDs, section IDs, shared days and actual overlap interval. |
| Lecture plus recitation/lab selection | Fixture with an overlapping selected recitation | Only the provided selected/required section meetings are tested. Replacing it with a nonoverlapping section removes that conflict. |
| Different weekdays | Fixtures | No conflict. |
| Different terms or stale meeting term | Fixtures | No conflict is fabricated across terms. |
| Back-to-back meetings | Fixtures | An end exactly equal to the next start is allowed. Travel time is not modeled. |
| Completed course vs future enrollment | Fixtures | Historical completion is excluded from planned meeting conflicts. |
| Duplicate or malformed meeting data | Fixtures | Duplicate overlaps are deduplicated; invalid time ranges and noninteger/out-of-range weekdays do not produce conflicts. |
| No meeting data | All 81 production subjects | **Schedule unverified**, not conflict-free. The public prototype has no invented meeting times. |

The current `Meeting[]` contract expects already-selected or required sections. The prototype does not yet select among all official lecture/recitation combinations, manage capacity, check travel time, model week-specific exceptions or import official live schedules. Those features require an expanded schedule model and source integration.

## Workload, progression and persistence matrix

| Pattern | Verification |
| --- | --- |
| MIT units vs conventional credits | Source-linked MIT guidance; about 14 work hours per unit per term, with no unofficial conversion used in degree calculations. |
| Typical load vs first-year cap | 48-unit planning benchmark, 48–54 typical range, first-year fall/spring caps and restricted discovery allowance remain separate. |
| Lower individual cap | First-year spring CAP warning checks the 48-unit and four-subject limits. Other individual restrictions require advising. |
| Unknown or arranged workload | A known-unit subtotal is displayed; absent credit is not zero workload. |
| IAP/summer intensity | No ordinary weekly-hours estimate is inferred from a short-term unit total. |
| Lighter/typical/intensive comparisons | 36/48/54 are capacity scenarios, not promises of accelerated graduation. |
| Remaining units absent, blank or zero | Absence stays unknown; explicit zero survives storage; clearing an estimate removes it. |
| Remaining units malformed | Negative, nonfinite, text and unsupported values are rejected. Failed saves preserve the last valid state. |
| Semester projection | Fall/spring budgets preserve the entered remaining units and skip unpromised summer enrollment. |
| Minor/graduate component scope | Minor 72-unit component and MEng 91-unit graduate component are not added blindly to a bachelor degree. |
| Degree switch | The old advisor-confirmed remaining-unit entry is cleared; the selected comparison pace can remain. |
| Separate saved alternatives | Workload settings remain per path. Browser save, reload, export/import validation and recovery have dedicated tests. |
| Inferred progression | AND uses the deepest required route; OR uses the shortest concrete route. Cycles terminate; corequisites do not create prior-term depth. |
| Official graduate designation | MIT's graduate level overrides inferred undergraduate progression. |
| Expanded map coverage | Program subjects, modeled choices and recursive prerequisites/corequisites all appear in the available-subject closure. |
| Major milestone | Only an explicit student-recorded advisor review creates the emblem. Completing the imported subset or entering zero remaining units never creates it. |
| Review scope and reset | Record stores path ID, major ID, catalog year, confirmation timestamp and completed-course IDs. Changing scope or completed-course membership clears the record. Planned-course moves, names, workload settings and completed-course term labels do not change earned-course membership. Reset leaves the prior immutable path available to Undo. |
| Review import/export | Valid same-path backup restoration retains the record. A copied or appended imported path receives a new identity and needs a new record. Legacy exports remain valid; malformed records are rejected; well-formed stale records are removed after shared-history synchronization and before saving/exporting. |

### Student-recorded advisor review

`programCompletion.ts` deliberately does not call the requirement evaluator to create a milestone. The student must explicitly confirm that an advisor discussion and full major-fulfillment review took place. The partial course catalog cannot establish that event. The saved record has no advisor identity, institutional signature or admission approval, and the UI must call it a student-recorded review.

The milestone applies only to an undergraduate major. It does not set whole-degree remaining units to zero, award a bachelor's degree, certify GIR completion or unlock admission to a master's or PhD program. Graduate possibilities remain subject to advising and their separate institutional admission requirements.

UI integration: call `recordProgramCompletion(path, catalog)` only after the confirmation action; derive display state from `getProgramCompletionStatus`; call `clearProgramCompletion` to reset. Run `reconcileProgramCompletion` after every path update, including updates to shared completed history. Persistence repeats that reconciliation to prevent an old record reappearing on reload. `serializeStore(store, catalog)` is the validated export representation.

## Explicit manual-review boundaries

The current schema does not automatically certify:

- AP, transfer or advanced-standing credit; substitutions and waivers.
- Cross-listed aliases, excluded/duplicate credit, repeated-course grade replacement or minimum-grade policies.
- Double majors, major/minor shared-credit allocation, every track elective or all approved graduate-subject lists.
- Thesis completion, graduate admission, residency, instructor permission or enrollment priority.
- All GIR, HASS, communication, PE, concentration and SERC policies.
- Every combination of a school's academic policies or every possible future calendar.

Some of those facts are retained in source notes or explicit `unknown`/`permission` conditions. All four program expressions retain manual-review requirements even when every imported course is selected. The coverage claim is **tested representative logic plus honest unresolved boundaries**, not universal degree-audit completeness.

## Verification files

- `web/src/domain/requirements.test.ts`: core requirement rules, chronological enrollment, dataset integrity and no false completed-degree audit.
- `web/src/domain/logic-coverage.test.ts`: the compact edge-case matrix added for this audit.
- `web/src/domain/progression.test.ts`: stage inference, cycles, alternatives and expanded closure.
- `web/src/domain/workload.test.ts`: unit capacity, limits, unknown credit and program scope.
- `web/src/domain/programCompletion.test.ts`: explicit review, scope invalidation, no automatic fulfillment, and reversible reset.
- `web/src/lib/persistence.test.ts`: durable plans, workload values, recovery and import/catalog validation.
- `web/scripts/test_ingest_mit.py`: source AND/OR grammar, literal permission, GIR expansion and malformed-source rejection.

Run the TypeScript tests with a supported modern Node runtime (22 or newer) and `npm test` from `web/`; run `python3 web/scripts/test_ingest_mit.py` from the repository root. No test-only fixture is exported into the production catalog.
