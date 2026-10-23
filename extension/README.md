# JobHunter Autofill Assistant

Build the Chrome/Edge Manifest V3 extension from the repository root:

```sh
npm run build:extension
```

In Chrome or Edge, open the extensions page, enable developer mode, choose **Load unpacked**, and select `extension/dist`. Sign in with your existing JobHunter Supabase account. The first sign-in asks for access to the Supabase project host; the extension needs that host only for authentication and token refresh.

Open a job application page and click the extension icon. **Review fields on this page** scans visible, empty form controls on the active tab only. Review each suggestion, then choose **Fill selected fields**. Sensitive and lower-confidence suggestions are unselected and marked for review. Filling changes only the selected field values; it never submits the employer's form.

The tracker section is separate. Confirm the company, position, and source, then choose **Log application** to create a `SAVED` entry in your JobHunter tracker. The application page URL is included as the posting link. The extension does not send page text or saved profile values to an AI service.

The extension uses short-lived Supabase access tokens stored in extension-local storage and refreshes them through Supabase. It receives the public Supabase client configuration from `/api/v1/extension/config`; that endpoint exposes only the project's public anon key, never a service-role key. Deploy the backend config endpoint before testing extension sign-in.