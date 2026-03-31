from app.db.database import engine, Base, SessionLocal
from app.models.user import User, Course, Announcement, Doubt, Enrollment
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding default professor...")
    db = SessionLocal()
    
    # Create a default professor
    # REMOVED 'id=1' so the database auto-assigns the correct ID
    default_prof = User(
        email="prof@school.edu",
        name="Admin Professor",
        hashed_password=pwd_context.hash("password123"),
        role="professor"
    )
    db.add(default_prof)
    db.commit()
    db.close()
    
    print("Database reset and seeded successfully!")

if __name__ == "__main__":
    reset_database()