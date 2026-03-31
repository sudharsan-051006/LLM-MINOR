from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime

from ..db.database import get_db
from ..models.user import CourseMaterial, Course, User
from .dependencies import get_current_user
from ..services.ai_service import AIService

router = APIRouter()

UPLOAD_DIR = "uploads/"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_material(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can upload")
        
    # Save file locally
    file_location = f"{UPLOAD_DIR}{course_id}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create DB Record
    new_material = CourseMaterial(
        course_id=course_id,
        filename=file.filename,
        file_url=f"/static/{course_id}_{file.filename}", # We will serve static files later
        file_type=file.filename.split('.')[-1]
    )
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    
    # Ingest into AI Vector DB
    await AIService.ingest_pdf(file_location, str(course_id))
    
    return {"message": "File uploaded and processed", "id": new_material.id}

@router.get("/{course_id}")
def get_materials(course_id: int, db: Session = Depends(get_db)):
    materials = db.query(CourseMaterial).filter(CourseMaterial.course_id == course_id).all()
    return materials