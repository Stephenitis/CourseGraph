# A spark of curiosity

CourseGraph offers four public MIT videos as optional starting points for students wondering what a field could lead to. These are an editorial selection for this prototype. They are not admissions guidance, required coursework, official recommendations for a particular program, or an MIT endorsement of CourseGraph.

The typed data lives in `web/src/data/inspiration.ts`. `getProgramInspiration(programId)` uses the actual catalog IDs: `major6-3`, `major6-4`, `minor18`, and `master6-P`. Unknown IDs receive an empty list. A talk can appear in several related contexts; selecting a school appearance theme does not change this MIT content.

## Verified sources

Checked on **October 23, 2026**. The official pages were accessible and identify the speakers, titles, topics, and embedded YouTube destinations below. Direct YouTube fetches were throttled in this environment, so this verifies MIT's published destination links, not uninterrupted playback or present geographic availability. No duration is claimed. No video, thumbnail, transcript, or audio was downloaded or republished.

| Video | Speaker | Published context | Prototype contexts |
| --- | --- | --- | --- |
| [Tackling Climate Change with Machine Learning](https://www.youtube.com/watch?v=nvqvtkmW6kE) | Priya Donti | MIT Generative AI Week, 2023 | CS, AI, EECS MEng |
| [Generative AI Foundations: Jacob Andreas](https://www.youtube.com/watch?v=kEplxgwkb4Q) | Jacob Andreas | MIT Generative AI Week, 2023 | AI, CS, EECS MEng |
| [Generative AI Foundations: Armando Solar-Lezama](https://www.youtube.com/watch?v=H6-7mD5TH1s) | Armando Solar-Lezama | MIT Generative AI Week, 2023 | CS, EECS MEng, AI |
| [Intro: A New Way to Start Linear Algebra](https://www.youtube.com/watch?v=YrHlHbtiSM0) | Gilbert Strang | MIT OpenCourseWare, 2020 | Mathematics minor and the three computing contexts |

The first three titles and video IDs come from the [official MIT Generative AI Week video index](https://mitgenerativeaiweek.csail.mit.edu/videos.html). Its [event home page](https://mitgenerativeaiweek.csail.mit.edu/home.html) establishes 2023; the [agenda](https://mitgenerativeaiweek.csail.mit.edu/agenda.html) gives the research topics. Donti connects machine learning to climate; Andreas discusses language models; Solar-Lezama discusses code generation. These are public research talks, not descriptions of degree requirements. The program associations and the short “why watch” prompts are CourseGraph's editorial judgments.

The [official OCW resource page](https://ocw.mit.edu/courses/res-18-010-a-2020-vision-of-linear-algebra-spring-2020/resources/a-new-way-to-start-linear-algebra/) credits Strang and supplies the video ID. The [collection description](https://ocw.mit.edu/courses/res-18-010-a-2020-vision-of-linear-algebra-spring-2020/) identifies the six introductory videos as recorded in 2020. This is a subject introduction, offering a taste of mathematics rather than an overview of the minor.

## Presentation guidance

Keep this feature optional and small: a calm “Find your spark” disclosure near the program introduction, followed by a speaker, topic, year, one curiosity prompt, a “Watch talk” link, and a separate official source link. Open only after a student chooses a link. Avoid autoplay, recommendation-feed behavior, invented watch times, or placing external media over the course map. Use text cards without scraped thumbnails. Let students return to their saved path without losing their place.

Retain the source and year near each item so a 2023 AI talk is understood as a view from that time. Recheck official page mappings when refreshing this file; if a destination disappears, retain the official source link or remove the entry rather than substituting an unofficial upload. Keep future school catalogs and university appearance themes separate from curation.
