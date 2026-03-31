from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import random
import string
from ..db.database import Base

def generate_class_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String, nullable=True)
    role = Column(String, default="student")
    google_id = Column(String, unique=True, index=True, nullable=True)
    
    courses = relationship("Course", back_populates="professor")
    enrollments = relationship("Enrollment", back_populates="student") # Needed for Student view

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    professor_id = Column(Integer, ForeignKey("users.id"))
    class_code = Column(String, unique=True, default=generate_class_code)
    materials = relationship("CourseMaterial", back_populates="course") # Add this
    professor = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course") # Needed for Student view
    announcements = relationship("Announcement", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    # Define relationships so we can access course.title etc. easily
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

# ... (Announcement and Doubt models follow) ...

# ... (Keep Announcement and Doubt models as before) ...
class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="announcements")

class Doubt(Base):
    __tablename__ = "doubts"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    query_text = Column(Text)
    status = Column(String)

class CourseMaterial(Base):
    __tablename__ = "course_materials"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    filename = Column(String)
    file_url = Column(String) # URL to access the file
    file_type = Column(String) # e.g., 'pdf', 'ppt'
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="materials")