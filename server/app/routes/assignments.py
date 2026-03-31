import os
import csv
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from ..db.database import get_db
from ..models.assignment import Assignment, AssignmentSubmission
from ..models.user import User
# from app.models.assignment import Assignment, AssignmentSubmission 
router = APIRouter()

# ── Folder helpers ────────────────────────────────────────────────────────────

def get_assignment_dir(course_code: str, assignment_id: int) -> str:
    """
    uploads/
      assignments/
        <class_code>/
          <assignment_id>/
            questions/
            submissions/
            results/
    """
    base = os.path.join("uploads", "assignments", course_code, str(assignment_id))
    for sub in ("questions", "submissions", "results"):
        os.makedirs(os.path.join(base, sub), exist_ok=True)
    return base


# ── Create Assignment (Professor) ─────────────────────────────────────────────

@router.post("/")
async def create_assignment(
    course_id: int = Form(...),
    course_code: str = Form(...),       # class code e.g. "AB12345"
    title: str = Form(...),
    description: Optional[str] = Form(None),
    deadline: str = Form(...),          # ISO string: "2025-12-31T23:59"
    created_by: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    deadline_dt = datetime.fromisoformat(deadline)

    # 1. Create DB row first to get the assignment id
    assignment = Assignment(
        course_id=course_id,
        created_by=created_by,
        title=title,
        description=description,
        deadline=deadline_dt,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # 2. Build folder structure now that we have the id
    assignment_dir = get_assignment_dir(course_code, assignment.id)

    # 3. Save question file if provided
    if file:
        questions_dir = os.path.join(assignment_dir, "questions")
        file_path = os.path.join(questions_dir, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        assignment.question_file_url = f"/{file_path}"
        assignment.question_file_name = file.filename
        db.commit()
        db.refresh(assignment)

    # 4. Create empty results CSV
    results_path = os.path.join(assignment_dir, "results", "results.csv")
    if not os.path.exists(results_path):
        with open(results_path, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["student_id", "student_name", "file_name", "submitted_at", "grade", "feedback"])

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "deadline": assignment.deadline.isoformat(),
        "question_file_url": assignment.question_file_url,
        "question_file_name": assignment.question_file_name,
        "created_at": assignment.created_at.isoformat(),
    }


# ── List Assignments for a Course ─────────────────────────────────────────────

@router.get("/course/{course_id}")
def get_assignments(course_id: int, db: Session = Depends(get_db)):
    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "deadline": a.deadline.isoformat(),
            "question_file_url": a.question_file_url,
            "question_file_name": a.question_file_name,
            "created_at": a.created_at.isoformat(),
            "submission_count": len(a.submissions),
        }
        for a in assignments
    ]


# ── Get Single Assignment ──────────────────────────────────────────────────────

@router.get("/{assignment_id}")
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "deadline": assignment.deadline.isoformat(),
        "question_file_url": assignment.question_file_url,
        "question_file_name": assignment.question_file_name,
        "created_at": assignment.created_at.isoformat(),
        "submissions": [
            {
                "id": s.id,
                "student_id": s.student_id,
                "file_name": s.file_name,
                "submitted_at": s.submitted_at.isoformat(),
                "grade": s.grade,
                "feedback": s.feedback,
            }
            for s in assignment.submissions
        ],
    }


# ── Submit Assignment (Student) ────────────────────────────────────────────────

@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    course_code: str = Form(...),
    student_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Deadline check
    if datetime.utcnow() > assignment.deadline:
        raise HTTPException(status_code=400, detail="Submission deadline has passed")

    # Check if already submitted — replace if so
    existing = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id,
        )
        .first()
    )

    # Save file as originalname_studentid.ext
    ext = os.path.splitext(file.filename)[1]
    base_name = os.path.splitext(file.filename)[0]
    saved_name = f"{base_name}_{student_id}{ext}"

    assignment_dir = get_assignment_dir(course_code, assignment_id)
    submissions_dir = os.path.join(assignment_dir, "submissions")
    file_path = os.path.join(submissions_dir, saved_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_url = f"/{file_path}"

    if existing:
        # Update existing submission
        existing.file_url = file_url
        existing.file_name = saved_name
        existing.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        submission = existing
    else:
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            file_url=file_url,
            file_name=saved_name,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    # Update results CSV
    student = db.query(User).filter(User.id == student_id).first()
    _update_results_csv(course_code, assignment_id, submission, student)

    return {
        "id": submission.id,
        "file_name": submission.file_name,
        "submitted_at": submission.submitted_at.isoformat(),
    }


# ── Get Student's Own Submission ───────────────────────────────────────────────

@router.get("/{assignment_id}/submission/{student_id}")
def get_student_submission(assignment_id: int, student_id: int, db: Session = Depends(get_db)):
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id,
        )
        .first()
    )
    if not submission:
        return {"submitted": False}
    return {
        "submitted": True,
        "file_name": submission.file_name,
        "submitted_at": submission.submitted_at.isoformat(),
        "grade": submission.grade,
        "feedback": submission.feedback,
    }


# ── Delete Assignment (Professor) ──────────────────────────────────────────────

@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, course_code: str, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Remove files from disk
    assignment_dir = os.path.join("uploads", "assignments", course_code, str(assignment_id))
    if os.path.exists(assignment_dir):
        shutil.rmtree(assignment_dir)

    db.delete(assignment)
    db.commit()
    return {"detail": "Assignment deleted"}


# ── Results CSV helper ─────────────────────────────────────────────────────────

def _update_results_csv(course_code: str, assignment_id: int, submission: AssignmentSubmission, student: User):
    results_path = os.path.join(
        "uploads", "assignments", course_code, str(assignment_id), "results", "results.csv"
    )
    os.makedirs(os.path.dirname(results_path), exist_ok=True)

    # Read existing rows
    rows = []
    if os.path.exists(results_path):
        with open(results_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            rows = [r for r in reader if r["student_id"] != str(submission.student_id)]

    # Add/update this student's row
    rows.append({
        "student_id": submission.student_id,
        "student_name": student.name if student else "",
        "file_name": submission.file_name,
        "submitted_at": submission.submitted_at.isoformat(),
        "grade": submission.grade or "",
        "feedback": submission.feedback or "",
    })

    with open(results_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["student_id", "student_name", "file_name", "submitted_at", "grade", "feedback"])
        writer.writeheader()
        writer.writerows(rows)