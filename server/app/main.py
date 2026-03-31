from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import courses, chat, auth, announcements, materials
from .db.database import engine, Base
import os
from .routes import assignments
from .routes import evaluation


# ✅ Create DB tables
Base.metadata.create_all(bind=engine)

# ✅ Create FastAPI app
app = FastAPI(title="Intelligent Classroom API")

# ✅ CORS MUST be added immediately after app creation
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Ensure uploads folder exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ✅ Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(announcements.router, prefix="/api/posts", tags=["Posts"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["Evaluation"])


# ✅ Root endpoint
@app.get("/")
def read_root():
    return {"status": "Backend connected to Neon DB"}