from sqlalchemy import text
from app.db.database import engine, Base

# 🔥 IMPORT ALL MODELS (VERY IMPORTANT)
from app.models.user import User
from app.models.post import Post, Comment
from app.models.assignment import Assignment

def reset_tables():
    print("Connecting to database...")

    with engine.connect() as conn:
        print("Dropping old tables...")

        conn.execute(text("DROP TABLE IF EXISTS comments CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS posts CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS assignments CASCADE"))

        # Optional (only if you want fresh users too)
        # conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))

        conn.commit()

    print("Creating tables with new structure...")

    Base.metadata.create_all(bind=engine)

    print("✅ SUCCESS! Tables recreated.")

if __name__ == "__main__":
    reset_tables()