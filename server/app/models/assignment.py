from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    created_by = Column(Integer, ForeignKey("users.id"))

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    deadline = Column(DateTime, nullable=False)

    question_file_url = Column(String, nullable=True)
    question_file_name = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship(
        "AssignmentSubmission",
        back_populates="assignment",
        cascade="all, delete-orphan"
    )


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), index=True)
    student_id = Column(Integer, ForeignKey("users.id"))

    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)

    submitted_at = Column(DateTime, default=datetime.utcnow)

    grade = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)

    assignment = relationship(
        "Assignment",
        back_populates="submissions"
    )