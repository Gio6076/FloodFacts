# FloodFacts

FloodFacts is a student-built multi-page web application for flood preparedness and safety education. It combines educational guidance, interactive checklists, a flood-safety quiz, and community-submitted stories with Firebase-backed accounts and persistence.

## Overview

FloodFacts helps users learn practical steps to take before, during, and after a flood. The project was created by a student team during a bootcamp and is maintained as a functional coursework prototype.

The application is intended for educational use. It is not a live flood-monitoring system, emergency-response service, weather-analytics platform, real-time alert system, or production-grade public-safety application.

## Features

- Before-flood preparedness guidance and checklist
- During-flood safety guidance and checklist
- After-flood health, recovery, and support guidance
- Checklist progress persistence through Firestore for signed-in users
- `localStorage` fallback/client persistence for checklist progress
- 15-question flood-safety quiz
- Quiz-score persistence for signed-in users
- Firebase email/password registration and login
- Community-story submission for authenticated users
- Public display of community stories
- Story severity selection: critical, severe, or moderate

## Technology Stack

- HTML5
- CSS
- JavaScript
- Bootstrap 5
- Font Awesome
- Firebase Authentication
- Cloud Firestore
- Browser `localStorage`

There is no frontend framework, custom backend server, package manager configuration, or build system in this repository.

## Application Architecture

The application runs in the browser and uses static HTML pages, shared CSS, and shared JavaScript:

```text
Browser
  -> HTML / CSS / JavaScript
  -> Firebase Authentication
  -> Cloud Firestore
```

Firestore collections used by the application:

- `users/{uid}` — private user profile and progress data
- `stories/{storyId}` — community-submitted stories

There is no custom application backend. Firebase provides authentication and database services directly to the browser application.

## Firebase Data Model

### `users/{uid}`

The registration flow creates a user document containing:

- `fullName`
- `username`
- `email`
- `createdAt`
- `quizScores`
- `checklistProgress`
- `stories`

Checklist progress is stored under the `before` and `during` checklist sections. Quiz scores contain the score, total questions, percentage, and timestamp.

### `stories/{storyId}`

Submitted stories contain:

- `name`
- `location`
- `story`
- `severity`
- `userId`
- `submittedAt`

Story content is treated as plain text. The current UI limits locations to 100 characters and story text to 2,000 characters.

## Firestore Security Model

The repository includes [firestore.rules](firestore.rules), which defines the intended least-privilege model:

- `users/{uid}` is private and accessible only by the matching authenticated UID.
- Authenticated users can create and update only their own user document.
- Story creation requires authentication.
- A story's `userId` must match the authenticated user's UID.
- Community stories are intentionally publicly readable because visitors can view them before login.
- Story updates and deletes are denied because no moderation or editing workflow exists.
- Unspecified Firestore paths default to denied access.

These repository rules have **not** been deployed or verified against the live Firebase project. Firebase Console settings, Authentication configuration, Firestore deployment, and API-key restrictions still require manual verification.

## Community Story Safety

User-entered names, locations, and story text are rendered as plain text using safe DOM construction rather than interpolated into raw HTML. Client-side length limits and required-field validation are applied.

Community stories are publicly readable by design. A moderation/admin workflow is not implemented, so this is not a production content-moderation system.

## Checklist Persistence

Checklist items use unique, stable identifiers. Signed-in users can persist progress to Firestore, while browser storage is used for local fallback behavior.

Earlier versions contained duplicate checklist IDs. The current implementation preserves the original unambiguous keys where possible, but historical progress saved under duplicate keys may be ambiguous and cannot be reconstructed reliably.

## Running Locally

No package installation is required. Serve the repository with any simple static server, for example:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

Firebase Authentication and Firestore functionality depends on the included browser configuration and the linked Firebase project's settings. A local server alone does not guarantee that the Firebase services are available or correctly configured.

## Firebase Configuration

[`firebase-config.js`](firebase-config.js) contains browser-side Firebase client configuration used to initialize the application.

Firebase browser API keys are client configuration, not server secrets. Service-account credentials, private keys, and other server credentials must not be added to this repository. Project owners should configure appropriate Firebase Console restrictions and Firestore rules for the linked project.

## Testing / Validation

The repository has been checked with:

- JavaScript syntax checks using `node --check`
- duplicate HTML ID checks
- local asset-reference checks
- user-content/XSS rendering review
- Firestore operation and security-rule cross-check
- `git diff --check`

There is currently no automated browser test suite. Live Firebase behavior has not been comprehensively tested as part of this documentation pass.

## Accessibility

The cleanup includes several low-risk accessibility improvements:

- unique form and checklist IDs
- corrected checklist progress ARIA metadata
- form `name` and autocomplete metadata
- decorative icon handling where added

The project does not claim WCAG compliance and has not undergone a formal accessibility audit.

## Known Limitations

- No live flood or weather data
- No emergency alerts or real-time disaster notifications
- No custom backend server
- No moderation/admin workflow
- Community stories are publicly readable by design
- Firestore rules have not yet been deployed or verified against the live project
- Client-side validation is not a substitute for backend enforcement
- No automated browser test suite
- No production deployment is configured in this repository

## Project Status

Functional student prototype / coursework project.

The project demonstrates frontend implementation, Firebase integration, interactive client-side workflows, and collaborative student development. It should not be presented as production-ready public-safety software.

## Roadmap

Potential future improvements include:

- Deploy and test the Firestore rules against the linked Firebase project
- Add a defined moderation workflow if public stories are retained
- Expand automated browser and accessibility testing
- Improve deployment documentation and provide a live demo when appropriate
- Consider a real flood or weather-data integration as a separate future feature

These items are not currently implemented.

## Team / Contributors

This is a team project. The repository README and project history identify the following contributors:

- Giovani Paulo Ebarola
- Joshua John Alix
- Kurt Sebastian Bautista
- Kenneth Paul Mendoza

The repository is part of Giovani Ebarola's public project portfolio, while collaborator credit is retained here because the implementation history shows team development.

## Screenshots

The repository currently contains decorative page-background images, not verified screenshots of the application. A proper screenshots section can be added after capturing representative views of the homepage, checklist, quiz, and story pages.
