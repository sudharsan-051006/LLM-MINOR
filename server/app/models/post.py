from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# Import Base from your database setup. 
# Adjust the import path if your database.py is located differently.
from ..db.database import Base 

class PostType(str, enum.Enum):
    TEXT = "text"
    FILE = "file"
    ASSIGNMENT = "assignment"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))  # ✅ FIX

    user = relationship("User")  # ✅ ADD THIS

    content = Column(Text, nullable=True)
    post_type = Column(Enum(PostType), default=PostType.TEXT)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))

    user_id = Column(Integer, ForeignKey("users.id"))  # ✅ FIX
    user = relationship("User")  # ✅ ADD THIS

    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")