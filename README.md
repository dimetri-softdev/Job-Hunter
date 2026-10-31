# Job Hunter App

A comprehensive job search management platform designed to help job seekers optimize their employability by streamlining application tracking, resume management, and professional profile enhancement.

## About

Job Hunter is a web application designed to streamline the job search process. It helps users track job applications, manage contacts, and stay organized while looking for their next career opportunity. Whether you're a recent graduate, career changer, or experienced professional, Job Hunter provides the tools to enhance your job search strategy.

## Key Features

*   **Application Tracking**: Keep a detailed record of all your job applications with status updates and notes.
*   **Conversion Analytics**: Review stage-to-stage movement based on recorded application status changes.
*   **Secure Authentication**: User accounts are securely managed with Clerk, ensuring your data is protected.
*   **Resume Optimization**: Tools to help you craft and refine your resume for different positions.
*   **Cover Letter Studio**: Generate a tailored cover letter from your resume and completed roadmap proof.
*   **Interview Practice**: Generate role-focused mock questions and get optional, consent-based coaching on your answers.
*   **Follow-up Sequences**: Prepare editable, stage-aware email drafts, with optional opt-in application reminders by email or browser notification.
*   **Portfolio Management**: Manage and showcase your GitHub portfolio and professional projects.
*   **Profile Enhancement**: Resources to optimize your LinkedIn and other professional profiles.
*   **Organized Workflow**: Stay on top of your job hunt with an intuitive and responsive interface.
*   **Data Persistence**: Your data is safely stored in a PostgreSQL database, managed with Prisma.
*   **RESTful API**: Programmatic access to manage your job applications.

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | [Next.js](https://nextjs.org/) | React-based framework for building performant web applications |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (82.9%) | Type-safe JavaScript development |
| **Backend Logic** | [Python](https://www.python.org/) (16.5%) | Data processing and analysis utilities |
| **ORM** | [Prisma](https://www.prisma.io/) | Type-safe database access and migrations |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Reliable relational database for data storage |
| **Authentication** | [Clerk](https://clerk.com/) | Secure user authentication and management |
| **Deployment** | [Vercel](https://vercel.com/) | Fast and reliable serverless deployment |

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or newer)
*   npm, yarn, or pnpm
*   A running PostgreSQL database instance
*   Clerk account for authentication setup
*   Python 3.8+ (optional, for backend utilities)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/dimetri-softdev/Job-Hunter.git
    cd Job-Hunter
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of your project and add your configuration:

    ```env
    # Database
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/job_hunter"

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
    CLERK_SECRET_KEY=sk_test_your_key_here

    # Clerk URLs (optional, for local development)
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
    ```

    > **Security Note**: Ensure `.env.local` is listed in your `.gitignore` file to prevent committing secrets.

4.  **Run database migrations:**

    Apply the database schema and generate the Prisma Client:

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **(Optional) Seed the database:**

    ```bash
    npx prisma db seed
    ```

### Running the Development Server

Once the setup is complete, start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Admin feedback

Feedback responses are anonymous and can be reviewed at `/admin` by an authenticated Supabase account whose email is listed in the server-only `ADMIN_EMAILS` environment variable. Set it to one or more comma-separated email addresses on the Node service (or in `.env.local` for local development), then sign in with that account. Do not expose this variable with a `NEXT_PUBLIC_` prefix.

The dashboard includes feedback analytics and filtering, CSV export, feedback review notes, and account controls for suspending accounts, deleting accounts, and granting or removing administrator access. Only accounts in `ADMIN_EMAILS` or in the database-managed admin list can use these controls. Bootstrap admins from `ADMIN_EMAILS` cannot be removed or deleted in the dashboard; change that environment variable deliberately to change bootstrap access.

Set `SUPABASE_SERVICE_ROLE_KEY` on the Node service to enable user and administrator management. This is a server-only secret: never add a `NEXT_PUBLIC_` prefix or commit the key. Without it, feedback review still works, but the Users & admins section cannot manage accounts.

Apply the schema migration before deploying the updated admin APIs:

```bash
npx prisma migrate deploy
npx prisma generate
```

The migration adds review metadata to feedback and the database-managed administrator table. Ensure the Node service uses the same PostgreSQL `DATABASE_URL` as the Prisma migration setup. Deleting an account permanently removes its Supabase identity and associated application data; the dashboard requires typing the account email to confirm.

### Application reminder delivery

Email reminders are globally disabled by default. Configure these private environment variables on the FastAPI service before enabling **Admin → Reminders**:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=verified-sender@example.com
REMINDER_CRON_SECRET=long-random-secret
```

Verify the sender domain with Resend before enabling delivery. Add an hourly cron job (for example, a Render Cron Job) that can reach the deployed API, with `JOBHUNTER_API_URL` set to the API base URL ending in `/api/v1` and `REMINDER_CRON_SECRET` set to the same secret as the API service. Hourly runs allow transient failures to be retried within Resend's 24-hour idempotency window. Use this command for the job:

```sh
curl --fail --silent --show-error -X POST "$JOBHUNTER_API_URL/internal/reminders/send" \
  -H "X-Reminder-Cron-Secret: $REMINDER_CRON_SECRET"
```

The endpoint sends reminders only while the admin feature switch is enabled, for opted-in accounts and due follow-up dates. Successful sends are recorded so repeated job runs do not resend for the same application and date. Failed sends are retried at most three times, no sooner than six hours apart, while Resend's idempotency key protects retries within its 24-hour window. Browser notifications require permission and the signed-in dashboard to remain open in that browser; they are not controlled by the email feature switch.

### Advertising

Advertising is disabled by default and can be switched on or off by an administrator under **Admin → Ads**. The first provider integration uses Google AdSense and places ads on the public home page and signed-in workspace; admin pages are excluded. Before enabling it, obtain AdSense site approval, configure the IDs below, and make sure the privacy notice and any required consent experience are ready:

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0000000000000000
NEXT_PUBLIC_ADSENSE_PUBLIC_SLOT_ID=0000000000
NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT_ID=0000000000
```

Set these public IDs in the web app's build environment and redeploy. The admin switch cannot be enabled unless all three IDs are valid. Apply the database migration and regenerate Prisma Client before deploying:

```bash
npx prisma migrate deploy
npx prisma generate
```

### PayFast sandbox subscriptions

The current checkout integration is sandbox-only. Configure these variables on the FastAPI service (for Render, use the service's private environment settings):

```env
PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=your_sandbox_merchant_id
PAYFAST_MERCHANT_KEY=your_sandbox_merchant_key
PAYFAST_PASSPHRASE=your_sandbox_subscription_passphrase
PAYFAST_RETURN_URL=https://your-site.example/billing
PAYFAST_CANCEL_URL=https://your-site.example/billing
PAYFAST_NOTIFY_URL=https://your-api.example/api/v1/billing/payfast/itn
```

Get the merchant credentials from the PayFast sandbox account and set its **Salt Passphrase** under sandbox Settings. Never paste these values into chat or commit them. The passphrase stays on the backend; the hosted checkout form is signed server-side. The notification URL must be publicly reachable over HTTPS.

Apply the database migration before deploying the backend and web app:

```bash
npx prisma migrate deploy
npx prisma generate
```

Checkout stays unavailable unless sandbox mode, all credentials, and all three HTTPS URLs are configured. The return and cancel URLs only send the browser back to the app; access is granted only after the backend validates the signed PayFast notification against the sandbox validation endpoint. Keep the existing Admin billing-enforcement switch disabled during sandbox testing. Live payments and in-app subscription cancellation/plan changes are not implemented.

### Password requirements

Sign-up and password reset require a password of 7–128 characters with at least one number and one symbol. The form checks these rules before submitting. For enforcement by Supabase Auth (including requests that bypass the web form), configure the project's Email password requirements in the Supabase Auth settings to require a minimum length of 7 and the required number and symbol characters. Supabase's predefined strongest option may additionally require lowercase and uppercase letters. Existing accounts with passwords that do not meet newly configured Supabase requirements may need to reset their passwords before signing in.

### Building for Production

```bash
npm run build
npm start
```

## API Documentation

The application provides a RESTful API for managing job applications. All API routes are protected with Clerk authentication.

### Endpoints

| Method   | Endpoint          | Description                                  | Auth Required |
| :------- | :---------------- | :------------------------------------------- | :------------ |
| `GET`    | `/api/jobs`       | Retrieves all job applications for the user  | ✓ Yes         |
| `POST`   | `/api/jobs`       | Creates a new job application                | ✓ Yes         |
| `GET`    | `/api/jobs/{id}`  | Retrieves a single job application by ID     | ✓ Yes         |
| `PATCH`  | `/api/jobs/{id}`  | Updates an existing job application          | ✓ Yes         |
| `DELETE` | `/api/jobs/{id}`  | Deletes a job application                    | ✓ Yes         |

### Example API Usage

#### Create a Job Application

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Software Engineer",
    "company": "Tech Corp",
    "location": "Remote",
    "status": "Applied",
    "appliedDate": "2026-10-02",
    "notes": "Excited about this opportunity"
  }'
```

#### Request Body Schema

```json
{
  "position": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "status": "Applied",
  "appliedDate": "2026-10-02",
  "notes": "Additional notes about the application",
  "salary": "100,000-120,000",
  "contactInfo": "email@example.com"
}
```

#### Response Example

```json
{
  "id": "123456",
  "position": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "status": "Applied",
  "appliedDate": "2026-10-02",
  "createdAt": "2026-10-02T08:29:57Z",
  "updatedAt": "2026-10-02T08:29:57Z"
}
```

## Project Structure

```
Job-Hunter/
├── src/
│   ├── app/               # Next.js App Router pages and API routes
│   ├── components/        # Shared React components
│   ├── context/           # React context providers
│   └── lib/               # Frontend utilities and integrations
├── api/
│   ├── routes/            # FastAPI feature routers
│   ├── schemas/           # Pydantic request and response models
│   └── services/          # Backend business logic
├── extension/             # Browser extension
├── tests/                 # Python backend tests
├── main.py                # FastAPI application entry point
├── prisma/                # Prisma schema and migrations
├── public/                # Static assets
├── package.json           # Frontend dependencies and scripts
├── requirements.txt       # Python backend dependencies
└── README.md
```

Run the Python backend tests from the repository root with
`python -m unittest discover -s tests -v`. The FastAPI application is exposed
as `main:app`.

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: Managed by Clerk (stored via Clerk ID)
- **JobApplication**: Stores job application records with status tracking
- **Contact**: Manages recruiter and company contact information

Run `npx prisma studio` to view and manage your database visually.

## Development Tips

*   Use `npx prisma generate` to regenerate Prisma Client after schema changes
*   Run `npm run lint` to check code quality
*   Run `npm run type-check` to verify TypeScript types
*   Use `npm run dev` with `--turbopack` flag for faster builds

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com) and import the repository
3. Add your environment variables in the Vercel dashboard
4. Deploy with a single click

### Deploy to Other Platforms

Ensure your platform supports:
- Node.js 18+
- PostgreSQL database connectivity
- Environment variable configuration

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### Steps to Contribute

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

### Code Style

*   Use TypeScript for type safety
*   Follow the existing code structure
*   Write meaningful commit messages
*   Add comments for complex logic

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support & Resources

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📚 [Prisma Documentation](https://www.prisma.io/docs)
- 🔐 [Clerk Documentation](https://clerk.com/docs)
- 🗄️ [PostgreSQL Documentation](https://www.postgresql.org/docs)

## Roadmap

- [ ] Resume builder with templates
- [ ] LinkedIn profile integration
- [ ] Job search automation
- [ ] Interview preparation resources
- [ ] Salary negotiation guide
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## Acknowledgments

*   Built with [Next.js](https://nextjs.org/)
*   Authentication powered by [Clerk](https://clerk.com/)
*   Database management with [Prisma](https://www.prisma.io/)
*   Deployed on [Vercel](https://vercel.com)

---

**Last Updated**: October 2, 2026  
**Repository**: [dimetri-softdev/Job-Hunter](https://github.com/dimetri-softdev/Job-Hunter)  
**Language Composition**: TypeScript (82.9%) | Python (16.5%) | Other (0.6%)
