# Job Hunter App

[![CI][ci-shield]][ci-url]
[![MIT License][license-shield]][license-url]

Job Hunter is a web application designed to streamline the job search process. It helps users track job applications, manage contacts, and stay organized while looking for their next career opportunity.

## Features

*   **Application Tracking**: Keep a detailed record of all your job applications.
*   **Secure Authentication**: User accounts are securely managed with Clerk.
*   **Organized Workflow**: Stay on top of your job hunt with an intuitive interface.
*   **Data Persistence**: Your data is safely stored in a PostgreSQL database, managed with Prisma.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)
*   **Authentication**: [Clerk](https://clerk.com/)
*   **Deployment**: Vercel (inferred from `.vercel` in `.gitignore`)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or newer)
*   npm, yarn, or pnpm
*   A running PostgreSQL database instance.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd jobhunter-app
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of your project and add your database connection string and Clerk keys. Your application uses `dotenvx`, so you might manage multiple `.env` files.

    ```env
    # .env

    # Database
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
    CLERK_SECRET_KEY=sk_...
    ```

    > **Note**: Ensure `.env` is listed in your `.gitignore` file to prevent committing secrets.

4.  **Run database migrations:**

    Apply the database schema and generate the Prisma Client.

    ```bash
    npx prisma migrate dev
    ```

### Running the Development Server

Once the setup is complete, you can start the development server:

```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the result.

## API Routes

The application provides a RESTful API for managing job applications. All API routes are protected and require authentication.

| Method   | Endpoint          | Description                                  |
| :------- | :---------------- | :------------------------------------------- |
| `GET`    | `/api/jobs`       | Retrieves all job applications for the user. |
| `POST`   | `/api/jobs`       | Creates a new job application.               |
| `GET`    | `/api/jobs/{id}`  | Retrieves a single job application by its ID.|
| `PATCH`  | `/api/jobs/{id}`  | Updates an existing job application.         |
| `DELETE` | `/api/jobs/{id}`  | Deletes a job application.                   |

### Example Request Body for `POST /api/jobs`

```json
{
  "position": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "status": "Applied"
}
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

<!-- MARKDOWN LINKS & IMAGES -->
[ci-shield]: https://img.shields.io/github/actions/workflow/status/dimetri-softdev/jobhunter-app/ci.yml?style=for-the-badge
[ci-url]: https://github.com/dimetri-softdev/jobhunter-app/actions
[license-shield]: https://img.shields.io/github/license/dimetri-softdev/jobhunter-app?style=for-the-badge
[license-url]: https://github.com/dimetri-softdev/jobhunter-app/blob/main/LICENSE.md