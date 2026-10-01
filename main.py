import os
import json
import io
import httpx
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prisma import Prisma
from groq import Groq
from pypdf import PdfReader

# 1. Database & AI Client Initialization
db = Prisma()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# 2. Application Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

# 3. Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic Models & Auth Helpers
class GenerateRoadmapRequest(BaseModel):
    role: str
    targetLevel: str

class TaskUpdate(BaseModel):
    completed: bool

class ApplicationCreate(BaseModel):
    company: str
    position: str
    status: Optional[str] = "APPLIED" # APPLIED, INTERVIEWING, REJECTED, OFFERED
    notes: Optional[str] = None

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")

    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {parts[1]}",
                },
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="Identity provider is unavailable.") from exc

    if response.status_code in (401, 403):
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="Unable to verify the access token.")

    try:
        auth_user = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="Invalid identity provider response.") from exc

    user_id = auth_user.get("id")
    email = auth_user.get("email")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Access token has no account ID.")
    if not isinstance(email, str) or not email:
        raise HTTPException(status_code=401, detail="Access token has no account email.")

    user_metadata = auth_user.get("user_metadata")
    name = user_metadata.get("full_name") if isinstance(user_metadata, dict) else None
    if not isinstance(name, str):
        name = None

    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        await db.user.create(
            data={
                "id": user_id,
                "email": email,
                "name": name,
            }
        )

    return user_id

# 5. Helper Function for Prisma Nested Writes
def build_roadmap_data(data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    projects_to_create = []
    projects = data.get("projects")
    if not isinstance(projects, list) or not projects:
        raise ValueError("The generated roadmap must contain projects.")

    readiness_score = int(data["readinessScore"])
    if not 0 <= readiness_score <= 100:
        raise ValueError("The generated readiness score must be between 0 and 100.")

    for proj in projects:
        if not isinstance(proj, dict) or not isinstance(proj.get("tasks"), list):
            raise ValueError("Each generated project must include a task list.")

        tasks_to_create = [
            {"label": str(task), "completed": False}
            for task in proj["tasks"]
        ]
        projects_to_create.append({
            "title": str(proj["title"]),
            "description": str(proj["description"]),
            "level": str(proj["level"]),
            "tasks": {"create": tasks_to_create}
        })

    return {
        "title": str(data["title"]),
        "readinessScore": readiness_score,
        "userId": user_id,
        "projects": {"create": projects_to_create}
    }

# 6. User & Roadmap Route Handlers
@app.get("/api/v1/user")
async def get_user_profile(user_id: str = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/v1/roadmaps")
async def get_roadmaps(user_id: str = Depends(get_current_user)):
    return await db.roadmap.find_many(
        where={"userId": user_id},
        include={
            "projects": {
                "include": {
                    "tasks": True
                }
            }
        }
    )

@app.patch("/api/v1/tasks/{task_id}")
async def update_task_status(
    task_id: str,
    payload: TaskUpdate,
    user_id: str = Depends(get_current_user),
):
    task = await db.task.find_unique(
        where={"id": task_id},
        include={"projectTrack": {"include": {"roadmap": True}}}
    )
    if (
        not task
        or not task.projectTrack
        or not task.projectTrack.roadmap
        or task.projectTrack.roadmap.userId != user_id
    ):
        raise HTTPException(status_code=404, detail="Task not found")

    updated_task = await db.task.update(
        where={"id": task_id},
        data={"completed": payload.completed}
    )
    return {"status": "success", "task": updated_task}

@app.post("/api/v1/roadmaps/generate")
async def generate_roadmap(
    payload: GenerateRoadmapRequest,
    user_id: str = Depends(get_current_user)
):
    prompt = f"""
    Create a detailed learning roadmap for a {payload.targetLevel} {payload.role}.
    Return one valid JSON object with a title, a readinessScore from 0 to 100
    based on the requested role and level, and a non-empty projects array.
    Each project must include a title, description, level, and a tasks array
    containing concrete learning tasks. Do not copy example or placeholder data.
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a software engineering career planner. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            response_format={"type": "json_object"}
        )

        raw_content = chat_completion.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=500, detail="Empty response from AI model.")

        data = json.loads(raw_content)
        roadmap_payload = build_roadmap_data(data, user_id)

        new_roadmap = await db.roadmap.create(
            data=roadmap_payload,  # type: ignore
            include={"projects": {"include": {"tasks": True}}}
        )

        return new_roadmap

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/roadmaps/generate-from-cv")
async def generate_roadmap_from_cv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    try:
        pdf_bytes = await file.read()
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        cv_text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                cv_text += extracted + "\n"

        if not cv_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF file.")

        prompt = f"""
        Analyze the following resume text and create a targeted learning roadmap to bridge skill gaps and level up the candidate.
        Resume Context:
        {cv_text[:3000]}

                Return one valid JSON object with a title, a readinessScore from 0 to 100
                derived from the resume evidence, and a non-empty projects array. Each
                project must include a title, description, level, and a tasks array
                containing concrete, resume-specific learning tasks. Do not use preset
                scores or example project data.
        """

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a senior tech recruiter and software career coach. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            response_format={"type": "json_object"}
        )

        raw_content = chat_completion.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=500, detail="Empty response from AI model.")

        data = json.loads(raw_content)
        roadmap_payload = build_roadmap_data(data, user_id)

        new_roadmap = await db.roadmap.create(
            data=roadmap_payload,  # type: ignore
            include={"projects": {"include": {"tasks": True}}}
        )

        return new_roadmap

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 7. Job Application Tracker Handlers
@app.get("/api/v1/applications")
async def get_applications(user_id: str = Depends(get_current_user)):
    """Fetch all job applications for the logged in user."""
    return await db.application.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"}
    )

@app.post("/api/v1/applications")
async def create_application(
    payload: ApplicationCreate, 
    user_id: str = Depends(get_current_user)
):
    """Log a new job application."""
    new_app = await db.application.create(
        data={
            "company": payload.company,
            "position": payload.position,
            "status": payload.status or "APPLIED",
            "notes": payload.notes,
            "userId": user_id
        }
    )
    return new_app