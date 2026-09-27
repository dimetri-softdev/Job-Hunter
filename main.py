import os
import json
import jwt
import io
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prisma import Prisma
from groq import Groq
from pypdf import PdfReader

# 1. Database & AI Client Initialization
db = Prisma()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", os.getenv("JWT_SECRET", "super-secret-key"))
ALGORITHM = "HS256"

# 2. Application Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    # Seed default user if none exists
    user = await db.user.find_first()
    if not user:
        await db.user.create(
            data={
                "id": "usr_demo",
                "email": "user@jobhunter.ai",
                "name": "Developer"
            }
        )
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

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Decodes Supabase JWT token from Authorization header.
    Automatically syncs user to Neon DB if not present.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Dev fallback when no token is supplied
        return "usr_demo"
    
    token = authorization.split(" ")[1]
    try:
        # Supabase JWTs use HS256 with the project JWT Secret
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[ALGORITHM], 
            options={"verify_aud": False}
        )
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email", f"{user_id}@jobhunter.ai")

        if not user_id:
            return "usr_demo"

        # Ensure user exists in Neon DB to prevent FK violations
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            await db.user.create(
                data={
                    "id": user_id,
                    "email": email or f"{user_id}@jobhunter.ai",
                    "name": email.split("@")[0] if email else "User"
                }
            )

        return user_id

    except jwt.PyJWTError:
        # Return fallback on invalid/expired token during local testing
        return "usr_demo"

# 5. Helper Function for Prisma Nested Writes
def build_roadmap_data(data: Dict[str, Any], user_id: str, default_title: str) -> Dict[str, Any]:
    projects_to_create = []
    for proj in data.get("projects", []):
        tasks_to_create = [{"label": str(task), "completed": False} for task in proj.get("tasks", [])]
        projects_to_create.append({
            "title": str(proj.get("title", "Project")),
            "description": str(proj.get("description", "")),
            "level": str(proj.get("level", "INTERMEDIATE")),
            "tasks": {"create": tasks_to_create}
        })

    return {
        "title": str(data.get("title", default_title)),
        "readinessScore": int(data.get("readinessScore", 75)),
        "userId": user_id,
        "projects": {"create": projects_to_create}
    }

# 6. Route Handlers
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
async def update_task_status(task_id: str, payload: TaskUpdate):
    task = await db.task.update(
        where={"id": task_id},
        data={"completed": payload.completed}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "task": task}

@app.post("/api/v1/roadmaps/generate")
async def generate_roadmap(
    payload: GenerateRoadmapRequest,
    user_id: str = Depends(get_current_user)
):
    prompt = f"""
    Create a detailed learning roadmap for a {payload.targetLevel} {payload.role}.
    You MUST return JSON matching this exact structure:
    {{
      "title": "{payload.role} Strategy",
      "readinessScore": 75,
      "projects": [
        {{
          "title": "Core Foundations",
          "description": "Short summary",
          "level": "{payload.targetLevel.upper()}",
          "tasks": ["Task 1", "Task 2", "Task 3"]
        }}
      ]
    }}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a software engineering career planner. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )

        raw_content = chat_completion.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=500, detail="Empty response from AI model.")

        data = json.loads(raw_content)
        roadmap_payload = build_roadmap_data(data, user_id, f"{payload.role} Roadmap")

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

        You MUST return JSON matching this exact structure:
        {{
          "title": "Resume Skill Acceleration Strategy",
          "readinessScore": 80,
          "projects": [
            {{
              "title": "Targeted Skill Bridge",
              "description": "Key areas to improve based on resume analysis",
              "level": "INTERMEDIATE",
              "tasks": ["Task 1", "Task 2", "Task 3"]
            }}
          ]
        }}
        """

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a senior tech recruiter and software career coach. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )

        raw_content = chat_completion.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=500, detail="Empty response from AI model.")

        data = json.loads(raw_content)
        roadmap_payload = build_roadmap_data(data, user_id, "CV Skill Acceleration Strategy")

        new_roadmap = await db.roadmap.create(
            data=roadmap_payload,  # type: ignore
            include={"projects": {"include": {"tasks": True}}}
        )

        return new_roadmap

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))