from fastapi import APIRouter, Depends, HTTPException, Header, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
from ..db.database import get_db
from ..models.user import User 
from ..models.post import Post, Comment, PostType 

router = APIRouter()

# Schemas
class CommentOut(BaseModel):
    id: int
    content: str
    created_at: str
    author_name: str
    user_id: int

    class Config:
        from_attributes = True

class PostOut(BaseModel):
    id: int
    content: Optional[str]
    post_type: str
    file_url: Optional[str]
    file_name: Optional[str]
    created_at: str
    author_name: str
    user_id: int
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True

# Helper to get current user
def get_current_user(token: str = Header(...), db: Session = Depends(get_db)):
    # Implement your JWT verification logic here
    pass 

@router.get("/{course_id}")
def get_posts(course_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.course_id == course_id).all()

    result = []
    for post in posts:
        result.append({
            "id": post.id,
            "content": post.content,
            "post_type": post.post_type,
            "file_url": post.file_url,
            "file_name": post.file_name,
            "created_at": post.created_at,
            "author_name": post.user.name if post.user else "Unknown",  # ✅ HERE
            "user_id": post.user_id,
            "comments": [
                {
                    "id": c.id,
                    "content": c.content,
                    "created_at": c.created_at,
                    "author_name": c.user.name if c.user else "Unknown",  # ✅ HERE
                    "user_id": c.user_id
                }
                for c in post.comments
            ]
        })

    return result

@router.post("/")
async def create_post(
    course_id: int = Form(...),
    content: str = Form(None),
    post_type: str = Form("text"),
    file: Optional[UploadFile] = File(None),
    user_id: int = Form(...), 
    db: Session = Depends(get_db)
):
    file_url = None
    file_name = None
    
    if file:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_location = f"{upload_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        file_url = f"/{file_location}"
        file_name = file.filename

    new_post = Post(
        course_id=course_id,
        user_id=user_id,
        content=content,
        post_type=post_type,
        file_url=file_url,
        file_name=file_name
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"message": "Posted successfully", "id": new_post.id}

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(post)
    db.commit()
    return {"message": "Deleted successfully"}

@router.post("/{post_id}/comments")
def create_comment(
    post_id: int, 
    content: str = Form(...),
    user_id: int = Form(...), 
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content
    )
    db.add(new_comment)
    db.commit()
    return {"message": "Comment added"}

@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}