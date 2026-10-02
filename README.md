# Job Hunter App

A comprehensive job search management platform designed to help job seekers optimize their employability by streamlining application tracking, resume management, and professional profile enhancement.

## About

Job Hunter is a web application designed to streamline the job search process. It helps users track job applications, manage contacts, and stay organized while looking for their next career opportunity. Whether you're a recent graduate, career changer, or experienced professional, Job Hunter provides the tools to enhance your job search strategy.

## Key Features

*   **Application Tracking**: Keep a detailed record of all your job applications with status updates and notes.
*   **Secure Authentication**: User accounts are securely managed with Clerk, ensuring your data is protected.
*   **Resume Optimization**: Tools to help you craft and refine your resume for different positions.
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
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── (routes)/          # Page routes
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
├── public/                # Static assets
├── styles/                # CSS/styling
├── .env.local             # Environment variables (not committed)
├── package.json           # Project dependencies
└── README.md              # This file
```

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
