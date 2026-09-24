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
            "id": "rd_101",
            "title": "Junior Full-Stack Engineer",
            "readinessScore": 75,
            "projects": [
                {
                    "id": "proj_1",
                    "title": "Core Junior Full-Stack Engineer Foundations",
                    "description": "Customized roadmap track focusing on Software Engineering.",
                    "level": "INTERMEDIATE",
                    "tasks": [
                        {
                            "id": "task_1",
                            "label": "Configure repository & build environment",
                            "completed": True,
                        },
                        {
                            "id": "task_2",
                            "label": "Implement core backend API services",
                            "completed": False,
                        },
                        {
                            "id": "task_3",
                            "label": "Deploy frontend client to Vercel",
                            "completed": False,
                        },
                    ],
                }
            ],
        }
    ]

# Task status update route
@app.patch("/api/v1/tasks/{task_id}")
def update_task_status(task_id: str, data: dict):
    return {"status": "success", "task_id": task_id, "completed": data.get("completed")}


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "JobHunter API",
        "docs": "http://127.0.0.1:8000/docs"
    }

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