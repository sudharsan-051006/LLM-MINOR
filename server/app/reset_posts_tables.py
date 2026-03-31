import os
from sqlalchemy import text
from app.db.database import engine, Base
# Import the NEW models to ensure SQLAlchemy knows the correct structure
from app.models.post import Post, Comment

def reset_tables():
    print("Connecting to database...")
    
    with engine.connect() as conn:
        # 1. Drop the old tables if they exist
        # We use IF EXISTS to prevent errors if they are already gone
        print("Dropping old tables (comments, posts)...")
        conn.execute(text("DROP TABLE IF EXISTS comments CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS posts CASCADE"))
        conn.commit()

    # 2. Create the tables with the NEW structure
    print("Creating tables with new structure...")
    Base.metadata.create_all(bind=engine)
    
    print("SUCCESS! Tables have been reset.")

if __name__ == "__main__":
    reset_tables()