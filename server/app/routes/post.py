from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from ..db.database import get_db
from ..models.post import Post, Comment, PostType

router = APIRouter()

# Ensure you have an 'uploads' directory in your server root or create it
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Schemas for Response ---
class CommentOut(dict):
    id: int
    content: str
    created_at: str
    author_name: str
    user_id: int

class PostOut(dict):
    id: int
    content: Optional[str]
    post_type: str
    file_url: Optional[str]
    file_name: Optional[str]
    created_at: str
    author_name: str
    user_id: int
    comments: List[CommentOut]

@router.get("/{course_id}", response_model=List[PostOut])
def get_posts(course_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(
        Post.course_id == course_id
    ).order_by(Post.created_at.desc()).all()
    
    results = []
    for post in posts:
        # Serialize comments manually to handle names
        comments_data = []
        for c in post.comments:
            comments_data.append({
                "id": c.id,
                "content": c.content,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
                "author_name": f"User {c.user_id}", # Replace with real User lookup
                "user_id": c.user_id
            })

        results.append({
            "id": post.id,
            "content": post.content,
            "post_type": post.post_type.value,
            "file_url": post.file_url,
            "file_name": post.file_name,
            "created_at": post.created_at.strftime("%Y-%m-%d %H:%M"),
            "author_name": f"User {post.user_id}", # Replace with real User lookup
            "user_id": post.user_id,
            "comments": comments_data
        })
    return results

@router.post("/")
async def create_post(
    course_id: int = Form(...),
    content: str = Form(None),
    post_type: str = Form("text"),
    file: Optional[UploadFile] = File(None),
    user_id: int = Form(...), # Passed from frontend
    db: Session = Depends(get_db)
):
    file_url = None
    file_name = None
    
    if file:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
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
    
    # Optionally delete file from disk here
    # if post.file_url and os.path.exists(post.file_url[1:]):
    #     os.remove(post.file_url[1:])

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