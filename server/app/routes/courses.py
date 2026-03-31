from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..db.database import get_db
from ..models.user import Course, User, Enrollment
from .dependencies import get_current_user

router = APIRouter()

class CourseCreate(BaseModel):
    title: str
    description: str

class JoinRequest(BaseModel):
    class_code: str

# --- 1. GET ALL COURSES (Filtered by Role) ---
@router.get("/")
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "professor":
        courses = db.query(Course).filter(Course.professor_id == current_user.id).all()
    else:
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        courses = [enrollment.course for enrollment in enrollments]
    return courses

# --- 2. GET SINGLE COURSE (Fixes the 404 Error) ---
@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "professor_name": course.professor.name if course.professor else "Unknown",
        "class_code": course.class_code
    }

# --- 3. CREATE COURSE ---
@router.post("/")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can create courses")

    new_course = Course(
        title=course.title,
        description=course.description,
        professor_id=current_user.id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return {"message": "Course created", "id": new_course.id, "class_code": new_course.class_code}

# --- 4. JOIN COURSE ---
@router.post("/join")
def join_course(request: JoinRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.class_code == request.class_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Invalid Class Code")
    
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id, 
        Enrollment.course_id == course.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
        
    new_enrollment = Enrollment(student_id=current_user.id, course_id=course.id)
    db.add(new_enrollment)
    db.commit()
    
    return {"message": f"Successfully joined {course.title}"}

# For professors — courses they teach
@router.get("/my")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    courses = db.query(Course).filter(Course.professor_id == current_user.id).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "professor_name": c.professor.name if c.professor else "Unknown",
            "class_code": c.class_code
        }
        for c in courses
    ]
    
# For students — courses they're enrolled in
@router.get("/enrolled")
def get_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()

    return [
        {
            "id": e.course.id,
            "title": e.course.title,
            "professor_name": e.course.professor.name if e.course.professor else "Unknown",
            "class_code": e.course.class_code
        }
        for e in enrollments if e.course
    ]