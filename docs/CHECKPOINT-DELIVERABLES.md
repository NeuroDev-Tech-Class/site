# Checkpoint Deliverables

Companion to [LMS-ROADMAP.md](LMS-ROADMAP.md). Audit of every lesson page that asks a student to produce or submit something (36 pages plus the GitHub Classroom exercises), and the in-site form each one gets. Audited Sep 8 2026.

## How to read this

Every checkpoint becomes a form built from these field types:

| Field | Meaning |
|---|---|
| **Text** | Long text area, one per question |
| **Short** | One-line answer |
| **URL** | A link (repo, share link, video) |
| **File** | Upload, restricted to listed types |
| **Image** | Image upload (PNG, JPEG, WebP) |
| **Code** | Monospace block with a language tag |
| **Checklist** | Tick boxes the student checks off |
| **Sign-off** | The mentor confirms in person. The student sees "Your coach will confirm this in person" and cannot tick it. |

"Text only" means the current page converts with no special handling: one text area under each question.

## Text only (7)

| Certificate | Checkpoint | Fields |
|---|---|---|
| Digital Literacy U1 | Checkpoint: How Will Technology Help Me? | 4 Text |
| AI Usage U2 | Hands-on Generative AI Exercises | 3 Text (one per exercise) |
| AI Usage | Working with Modern AI Tools, "Try it out" | Checklist (which two were tried) + 1 Text |
| AI Usage | Responsible AI Use, "Reflect" | 3 Text |
| Unreal U3 | Game Design Document template | 11 Short/Text (Title, Author, Genre, Setting, Audience, Core Mechanics, Reference Images, Must-have, Nice-to-have, Timeline, Pitch) |
| Hardware U1 | Navigating the BIOS/UEFI | 3 Short + optional Image |
| Hardware U2 | Identifying Computer Hardware | **Content bug: the file is a duplicate of the BIOS page.** A real lesson must be written before conversion. |

## Need a file or image upload (16)

| Certificate | Checkpoint | Fields | Why text is not enough |
|---|---|---|---|
| Office U1 | Practice: Word Processors | File (.docx/.pdf) or URL (share link) | Formatting is the deliverable |
| Office U1 | Application: Creating a Resume | File (.docx/.pdf) or URL | Same |
| Office U2 | Worksheet: Spreadsheet Formulas (Google Sheet linked from the course page) | URL (copy link) or File | Today: "make a copy of this sheet" |
| Office U2 | Practice: Spreadsheets | File (.xlsx) or URL | Formulas, charts, conditional formatting |
| Office U2 | Application: Creating a Budget | File (.xlsx) or URL + 1 Text (explain categories) | Same |
| Office U3 | Application: Career Day Presentation | File (.pptx) or URL + 4 Text (outline bullets) | Slides |
| AI Usage U3 | Final Assignment: AI Application | 4 Text (reflection) + Image (multiple screenshots) or Code (pasted transcript) | Screenshots of AI conversations |
| Blender U1 | Activity: Create a Scene | File (.blend) + Image (render PNG) + Checklist (9) | Model and render |
| Audacity U1 | Activity: 60-Second Introduction | Text (script) + File (.wav, .mp3, .aup3) + Checklist (12) | Audio |
| Audacity U2 | Final Project: Mini Podcast | File (.mp3, .aup3) + Text (music and sound sources) + Checklist (14) | Audio |
| DaVinci U1 | Activity: Highlight Reel | URL (YouTube or Drive unlisted) + Checklist | Video is too large to upload |
| DaVinci U2 | Activity: Color Grade a Scene | Image x2 (before/after) + Checklist | Visual |
| DaVinci U3 | Final Project: Short Video | URL (video) + Text (creative vision paragraph) | Video |
| GIMP U1 | Activity: Photo Restoration | Image x2 (before/after) + File (.xcf) + 3 Text (reflection) | Visual |
| GIMP U2 | Activity: Movie Poster | Image + File (.xcf) + Checklist (10) | Visual |
| GIMP U3 | Final Project: Portfolio Showcase | 3 x (Image + File + 3 Text) | Three pieces, each with a description |

## Need a URL or code field (5)

| Certificate | Checkpoint | Fields |
|---|---|---|
| Python I U3 | Final Project: Text Adventure Game | URL (repo) + Code (python, optional paste) + Text (design notes) |
| Linux | Final Project: Linux Task Challenge | 10 Code (terminal output per task; the page already allows paste instead of a screenshot) + Code (fixed broken.sh) + Text (sysinfo.log contents) + Short (octal answer) + Text (reflection) + optional Image (htop) |
| Digital Literacy U1 | Unit 1 Recap | Text (properties comparison, formats comparison, slowdown findings) + URL (PCPartPicker build) + 2 Sign-off (explain the build, show a disabled startup app) |
| Python I, Python II, Web Dev II, Web Dev III | All 58 GitHub Classroom exercises (21 / 14 / 17 / 6) | `github-exercise` preset: URL (repo) + Code (starter from `exercise.py` or the starter files; the student pastes the final version) + Text (notes). Lesson text is imported from `lesson.md` or `README.md` in `NeuroDev/tech-class-courses/`. The Python `tests/` folder is shown to the grader as a rubric hint. |
| Web Dev I | 3 Unit Assignments (blog) and 3 Unit Quizzes, currently `https://url` placeholders | Assignments: URL (blog) + Text. Quizzes: author as native tests. Nothing to migrate; build fresh. |

## Need a live mentor sign-off (11)

These cannot be fully digitised. The form captures what it can and the coach confirms the rest in person.

| Certificate | Checkpoint | Fields | What the coach confirms |
|---|---|---|---|
| Digital Literacy U1 | Hands-on: Identifying Hardware | Checklist + Text (component notes) + Sign-off | Ports, components, case opened and reassembled. **The page is written to the coach, not the student, and refers to a worksheet that does not exist. Rewrite it.** |
| Digital Literacy U1 | Unit 1 Recap | See the URL/code table above | Build explanation, disabled startup app |
| Digital Literacy U2 | Unit 2 Recap | 10 Short (shortcut names) + Text (explanations, findings) + Sign-off + optional Image (wallpaper slideshow) | Shortcut demonstration |
| Digital Literacy U2 | Hands-on: Keyboard Shortcuts | Checklist (14 steps) + 1 Text + optional Image (screenshots) + Sign-off | Demonstration. The page says "open a blank Google Doc"; reword. |
| Digital Literacy U3 | Hands-on: Email Account | Text (folder explanations) + Sign-off | The student emailing the coach is the task itself |
| Digital Literacy U3 | Hands-on: Social Media | Checklist + optional URL (profile) | Optional and sensitive. Keep opt-out. No sign-off required. |
| Blender U2 | Activity: Model and Print a Ring | Checklist (10) + Short (target diameter) + File (.stl) + Sign-off | Physical print |
| Blender U3 | Final Project: Portfolio Sculpt and Print | Image (sketch photo, finished piece) + File (.obj/.stl) + Checklist (12) + Sign-off | Physical print and paint |
| Hardware | Final Project: Build a Custom PC | URL (PCPartPicker) + Text (component justification) + Image (build photos) + Sign-off | Physical build and presentation |
| Unreal U1 and U2 | Activity: Castle Courtyard; Activity: Obstacle Course | Checklist (10 / 9) + Image (screenshot) + Sign-off | Level play-test |
| Unreal U3 | Final Project: Build Your Game Level | GDD as 7 Text + Image or URL (video) + Sign-off | Level |

## Inline exercises with no deliverable (about 40)

Audacity, GIMP, Blender, DaVinci and Unreal each list "Exercise N.N" items as plain text on the course page. They import as self-checked items tagged `exercise`. Roadmap open decision 7: keep them as checkboxes (default) or promote them to image-upload checkpoints later.

Linux has similar inline exercises and one "Reflection: CLI vs GUI" that has no submission path today. Recommendation: make that one a Text checkpoint.

## Content fixes to do alongside conversion

1. Replace the duplicated `identifying_computer_hardware.html` body with real content.
2. Remove the "email the tech coach" and "share with instructor@neurodevtech.com" sentences from all 36 pages once the forms exist. The two addresses are inconsistent today.
3. Rewrite the Identifying Hardware exercise in student voice.
4. Add the two missing Web Dev II instruction PDFs, or fold their content into the new test items.
5. Remove the `TODO:` line and the six placeholder links from `web-dev-1.html`.
6. Fix the `web-dev-2.html` links to `courses/python1.html` and `courses/web-dev-1` (wrong filenames).

## Totals

| Group | Pages |
|---|---|
| Text only | 7 |
| File or image upload | 16 |
| URL or code field | 5 (plus 58 Classroom exercises and 6 Web Dev I items) |
| Mentor sign-off | 11 (3 of these also appear in other groups) |
| Distinct checkpoint pages | 36 |
