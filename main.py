from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="JobHunter AI API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy User Endpoint
@app.get("/api/v1/user")
def get_user_profile():
    return {
        "id": "usr_101",
        "name": "Dev User",
        "email": "user@jobhunter.ai"
    }

# Roadmaps Endpoint
@app.get("/api/v1/roadmaps")
def get_roadmaps():
    return [
        {
            "id": "1",
            "title": "Junior Full-Stack Engineer",
            "role": "Software Engineering",
            "status": "active",
            "progress": 45,
            "tasksCount": "3 of 8 completed",
            "date": "Sep 2026",
            "readiness": 75,
        },
        {
            "id": "2",
            "title": "Frontend Engineer — React",
            "role": "Frontend Development",
            "status": "active",
            "progress": 72,
            "tasksCount": "8 of 11 completed",
            "date": "Aug 2026",
            "readiness": 88,
        }
    ]

# Job Applications Endpoint
@app.get("/api/v1/applications")
def get_applications():
    return [
        {
            "id": "1",
            "company": "Vercel",
            "role": "Junior Frontend Engineer",
            "location": "Remote",
            "stage": "Technical Interview",
            "appliedDate": "Sep 18, 2026",
        }
    ]