from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi import Query
import os
import csv

from ..db.database import get_db

# Models
from app.models.assignment import Assignment
from app.models.user import User, Course

# 🔥 NEW: use LLM builder instead of old evaluation_service
from app.services.llm_grader import grade_answer

# CSV updater
from app.routes.assignments import _update_results_csv

# PDF text extractor (you should already have this)
from app.services.pdf_parser import extract_text_from_pdf

router = APIRouter()


@router.post("/{assignment_id}")
def evaluate_assignment(assignment_id: int, db: Session = Depends(get_db)):

    # 1. Get assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # 2. Get course
    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_code = course.class_code

    # 3. Extract QUESTION text once
    question_text = ""
    if assignment.question_file_url:
        try:
            question_text = extract_text_from_pdf(
                assignment.question_file_url.strip("/")
            )
        except Exception as e:
            print("Question parsing error:", e)

    results = []

    # 4. Loop through submissions
    for sub in assignment.submissions:

        if not sub.file_url:
            continue

        try:
            # 5. Extract student answer text
            answer_text = extract_text_from_pdf(sub.file_url.strip("/"))

            # 🔥 IMPORTANT: limit text (CPU optimization)
            answer_text = answer_text[:3000]

            # 6. LLM grading
            result = grade_answer(question_text, answer_text)

            # 7. Save to DB
            sub.grade = f"{result['score']}/{result['max_score']}"
            sub.feedback = result["feedback"]

            # 8. Update CSV
            student = db.query(User).filter(User.id == sub.student_id).first()

            _update_results_csv(
                course_code=course_code,
                assignment_id=assignment.id,
                submission=sub,
                student=student
            )

            results.append({
                "student_id": sub.student_id,
                "grade": sub.grade
            })

        except Exception as e:
            print("Evaluation error:", e)

    db.commit()

    return {
        "status": "Evaluation completed",
        "evaluated_count": len(results),
        "results": results
    }


@router.get("/assignments/{assignment_id}/results")
def get_results(assignment_id: int, course_code: str):
    import os, csv

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    results_path = os.path.join(
        BASE_DIR,
        "uploads",
        "assignments",
        course_code,
        str(assignment_id),
        "results",
        "results.csv"
    )

    print("Reading CSV from:", results_path)

    if not os.path.exists(results_path):
        return {"results": []}

    results = []

    with open(results_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            results.append(row)   # 🔥 KEY LINE

    return {"results": results}