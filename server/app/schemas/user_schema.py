from pydantic import BaseModel
from typing import Optional

# --- User Schemas ---
class UserCreate(BaseModel):
    email: str
    name: str
    role: str = "student"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True # Pydantic v2 syntax (orm_mode)

# --- Course Schemas ---
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    professor_id: int

# --- Chat Schemas ---
class ChatRequest(BaseModel):
    query: str
    course_id: int

class RepoRequest(BaseModel):
    repo_url: str
    requirements: str