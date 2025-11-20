This folder contains helper scripts for UI smoke tests.

participants-e2e.mjs
- A Puppeteer headless script that opens the admin dashboard, navigates to Manage Participants, creates a participant and tries to create a duplicate to assert validation.

Usage
1. Start the frontend dev server (Vite) from project root:
   npm run dev
2. (Optional) Ensure backend API is running at http://localhost:5001 if you want data persisted.
3. Run the script:
   npm run e2e:participants

Artifacts
- ui-participants-body.txt  — textual dump of the page body
- ui-participants.png       — full page screenshot
- ui-participants-fail.html — full HTML dump produced when selectors are not found

Note: testids used by the script are added to components only in development builds (guarded by `process.env.NODE_ENV === 'development'`).