# NASA Space Apps submission preparation

Reviewed on **2026-11-15** for team **by-star**. This is BY STAR's preparation checklist, not an official competition guide or a confirmation of eligibility.

The project owner supplied PDF captures of the two official guides, both dated **November 13, 2026**. They were reviewed visually, including the relevant requirements and page breaks:

| Source | Supplied capture | Pages used here |
| --- | --- | --- |
| [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/) | `1.pdf` | 1-3: edition, eligibility, criteria and award stages. Page 4 contains no further substantive guidance. |
| [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) | `2.pdf` | 1-5: dates, editing, files, demonstration, submission and certificates. Page 6 contains no further substantive guidance. |

Page references below refer to these supplied captures. The PDFs are not redistributed in this repository. Some expandable sections were closed when the captures were made; their hidden contents remain unverified. The previous inability to retrieve the guide pages online does not prevent verification of the visible requirements in these supplied copies.

## Current BY STAR status

| Item | Status |
| --- | --- |
| Team registration | The project owner confirmed that the team is registered and participates in a **Local Event**. This is user confirmation, not an independent portal check. |
| Event details | The event name, assigned time zone, team/project URL and complete member roster have not been supplied or independently checked. |
| Working application | Public at [by-star-team-challenge.pages.dev](https://by-star-team-challenge.pages.dev/), deployed from `main`. |
| Source and documentation | [Public repository](https://github.com/yoenieves-design/by-star-team-challenge), README, project description and source references prepared. The tested application release is tagged `v0.2.0`. |
| Verification | Type checking, 30 unit tests, 17 browser cases, GitHub verification and Cloudflare deployment passed during release review. See [Verification](VERIFICATION.md). |
| Licensing | Original code uses the owner-approved MIT license. Third-party materials retain their licenses and credits. MIT is the team's choice, not a license mandated by these captured guides. |
| Required Project Demo | **Pending:** a public video of at most 30 seconds or a slide presentation of at most seven slides. The live app alone does not replace this required presentation. |
| Competition submission | **Not verified:** preparing or publishing this repository does not submit the project. The team must complete the portal process and check its confirmation. |

## Deadline and event eligibility

The Project Submission Guide, pages 1-2 and 4, states that submission opens **November 14, 2026 at 09:00** and closes **November 15, 2026 at 23:59**, using the team's **Local Event time zone**. For a Universal Event team, the exception uses the local time of the **Team Owner's area of residence**. Local presentation and judging schedules can differ; check with the Local Lead.

BY STAR's owner has confirmed Local Event participation, so confirm that event's assigned time zone in the portal. The computer's time zone does not establish the event's deadline.

The Judging & Awards Guide, page 2, lists these minimum conditions for Global Judging:

- Respond to an official NASA Space Apps challenge.
- All team members must be registered, accepted rather than waitlisted, registered for the same Local Event or Universal Event, and visible on the team's **Members** tab. This includes the Team Owner.
- Local Event teams may have **one to six members**; Universal Event teams require **two to six members**.
- New members cannot be added after project submission closes.
- Complete every required project field, provide the required short demonstration, follow the language rules, accept the required declarations and submit before the applicable deadline.

The guide also describes NASA's review of eligibility under its China funding restriction policy and refers participants to the [Participant Terms and Conditions](https://www.spaceappschallenge.org/legal/). This checklist does not determine individual eligibility or replace NASA's decision.

## Required Project Demo and language

Both guides confirm the presentation requirement: Judging & Awards, page 2; Project Submission, page 4.

| Requirement | Rule in the guides |
| --- | --- |
| Presentation format | **Either** a video lasting **30 seconds or less**, **or** a slide deck with **no more than seven slides**, including title and introduction slides. |
| Purpose | Give a concise project overview and demonstrate the final project, including software or hardware created by the team. |
| Hosting | Host the video or slides externally and provide a publicly accessible link. They cannot be uploaded directly to the Space Apps form. |
| Language | The project page and linked materials must be in English. A video may use another spoken language only with English subtitles. Slides must be in English. |
| Limits | Projects exceeding the 30-second or seven-slide limit are not eligible for Global Judging. |
| Minors' likeness | The Project Submission Guide, page 4, says project demonstrations and final projects may not contain images, video, audio or other likeness of persons under 18. |

Keep the required **Project Demo** link distinct from the **Final Project** link. For BY STAR, the live application is the working project; the short video or slide deck still needs to be completed and published. The longer [walkthrough](ROADMAP.md) supports exploration but is not automatically a compliant 30-second presentation.

The submission guide recommends readable slides, strong visuals, a view of the prototype and user experience, and an explanation of how NASA and space-agency resources support the solution. It also asks that the slide content include the team name, team members' names and selected challenge. These recommendations should fit within the seven-slide limit.

## Form fields visible in the supplied capture

Project Submission Guide, page 3, shows the following field-instruction headings:

1. Project Name
2. High-Level Project Summary
3. Link to Project Demo
4. Link to Final Project
5. Detailed Project Description
6. Use of Super Intelligence (SI)
7. NASA Data
8. Space Agency Partner Data and Other References

The sixth heading is reproduced as it appears in the capture. **All eight explanatory sections are collapsed.** Their detailed instructions, numeric text limits and individual required/optional flags are not visible. Check the live form before pasting content. The exact AI/SI declaration instructions also remain unverified; do not infer them from the heading alone.

Use [PROJECT-SUBMISSION.md](PROJECT-SUBMISSION.md) as the English content draft. Replace team-specific placeholders, match the actual field labels and limits, and describe Codex assistance accurately in the appropriate disclosure field.

## Files, links, sources and permissions

Project Submission Guide, page 3:

- Images can be uploaded or pasted in **JPG, PNG or GIF**, up to **10 MB**.
- Videos and documents cannot be uploaded directly. Host them on an external service or repository and provide links.
- Submitted links must work without a login, registration or special permission. Set public access and test in a private browser window. Judges cannot evaluate material they cannot access.
- Requesting a FortiGuard web-filter classification for a new website is a **recommendation, not a submission requirement**. No classification request has been submitted for this project as part of this review.

Judging & Awards Guide, page 2, requires the team to confirm original work, permission to use copyrighted material, and listing **all external resources in the form's References field**, including code, text and images even when open source or freely available. Repository credits alone do not replace completing that portal field.

For BY STAR, use the NASA source explanations in [PROJECT-SUBMISSION.md](PROJECT-SUBMISSION.md), the [third-party notices](../THIRD-PARTY-NOTICES.md), the original [MIT license](../LICENSE), and the bundled dependency licenses when assembling references. Distinguish the real historical RadLab sample from synthetic mission telemetry, and retain the NASA imagery credit. Do not claim that the application is clinically validated, NASA-endorsed or connected to actual spacecraft sensors.

## Save, submit and confirm

The Project Submission Guide, pages 2 and 4-5, describes this workflow:

1. Sign in and open the profile menu, choose **My Team**, then the team's **Project** tab.
2. Select the blue **Edit** button. Use **Save Progress** frequently. Saved changes remain visible to the team until submitted for judging.
3. Coordinate editing with teammates. The optional **Lock** control indicates that editing is in progress, but another member can remove it and overwrite unpublished changes.
4. Complete every required field, insert the public Project Demo and Final Project links, and review all references and permissions.
5. The team must review and accept the terms/privacy declaration and the originality/permissions declaration. In the submission guide these are labelled **Terms and Conditions** and **Confirm All Work is Original**. The project owner must make these declarations knowingly; this checklist does not accept them on the team's behalf.
6. Click **Submit for Judging** before the applicable deadline. Missing required sections prevent submission. **Save Progress alone does not submit the project.**
7. Check for the success banner and confirmation message. Preserve the confirmation and the submitted links.
8. The guide allows editing and resubmitting until the end of the hackathon; only the final saved submission is reviewed. After editing an already submitted entry, use **Submit for Judging** again and verify the confirmation. The guide does not authorize edits to submitted materials after the deadline.

## Judging and award stages

Judging & Awards Guide, page 2, says that each of the following five criteria is scored from **1 to 5** at every judging level:

| Criterion | BY STAR evidence to present; these are our recommendations |
| --- | --- |
| Impact | Show how a crew member can identify what needs attention and coordinate the next review when Earth support is limited. |
| Creativity | Explain the combination of source quality, activity and breathing-zone context, clinical revision history and traceable follow-up. |
| Validity | Identify NASA sources, separate real and synthetic data, demonstrate tests, and state the prototype's clinical and hardware limits. |
| Relevance | Connect the demonstrated workflow directly to the selected astronaut health-monitoring challenge. |
| Presentation | Use a concise visual scenario with readable English, a clear result, and public links that work. |

The criteria's detailed definitions are in collapsed sections of the supplied capture. The evidence suggestions above are project recommendations, not quotations or verified definitions of the official rubric. No additional weighting is established by the visible text.

Judging & Awards Guide, page 3, gives this schedule:

| Stage | Announcement date |
| --- | --- |
| Global Nominees selected from Local and Universal Events | **December 3, 2026** |
| Global Finalists and Honorable Mentions | **December 17, 2026** |
| Global Winners | **January 26, 2027** |

Honorable Mentions do not advance to Executive Judging or become eligible for awards. Global Finalists are reviewed by NASA and Space Agency Partner executives for ten awards: **Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling Award, Global Connection Award, Art & Technology Award, and Local Impact Award**. The guide also describes a virtual winners' celebration in early 2027. These dates and stages come from the supplied November 13 edition; they are not a claim that BY STAR has advanced.

## Final BY STAR checklist

- [ ] Confirm the Local Event's name and time zone, exact challenge, project URL and accepted member roster in the portal.
- [ ] Publish the required video of at most 30 seconds or deck of at most seven slides, in the permitted language format.
- [ ] Check the live form's expanded instructions and numeric limits, including its AI/SI disclosure field.
- [ ] Fill every required field with the English project draft and real team details.
- [ ] Include all external sources and materials in the form's References field, with permissions and credits checked.
- [ ] Test the presentation, [live application](https://by-star-team-challenge.pages.dev/) and [repository](https://github.com/yoenieves-design/by-star-team-challenge) links without an account.
- [ ] Review and accept the required declarations, click **Submit for Judging** before the Local Event deadline, and verify the success banner.
- [ ] Save the submitted text, public artifact URLs, source version and confirmation. Recheck and resubmit if editing before the deadline.

This checklist records preparation steps, not a claim that the unchecked steps have been completed.

## Participant certificate

Project Submission Guide, page 5, says certificates become available after a timely project submission. Open **Profile -> Participant Information -> 2026 NASA Space Apps Challenge -> Download Participant Certificate**. The certificate uses the profile's Full Name and is available as a PDF. The guide recommends a desktop or laptop and Letter paper size. A website deployment without **Submit for Judging** does not establish certificate eligibility.

## Remaining verification boundary

The visible guide content is now checked against the supplied PDFs. Still unverified are the collapsed field explanations and rubric definitions, detailed local judging arrangements, live portal limits and the team's account-specific roster, event time zone, challenge and final submission status. The supplied materials describe official requirements; they do not authorize external submission or acceptance of terms on the user's behalf.

Other official references: [Resources](https://www.spaceappschallenge.org/resources/), [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/), [Legal information](https://www.spaceappschallenge.org/legal/), and the corroborating [GO-team answer on editing and deadlines](https://github.com/nasa/spaceapps/discussions/1916).
