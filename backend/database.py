from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "./support.db")
engine = create_engine(
    f"sqlite:///{DATABASE_URL}",
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Ticket(Base):
    __tablename__ = "tickets"

    id                 = Column(Integer, primary_key=True, index=True)
    ticket_id          = Column(String, unique=True, index=True)
    timestamp          = Column(DateTime, default=datetime.utcnow)
    customer_id        = Column(String, nullable=True)
    channel            = Column(String, nullable=True)
    message            = Column(Text)
    agent_reply        = Column(Text, nullable=True)
    product            = Column(String, nullable=True)
    order_value        = Column(Float, nullable=True)
    customer_country   = Column(String, nullable=True)
    resolution_status  = Column(String, nullable=True)

    # AI-generated fields
    category           = Column(String, nullable=True)
    sentiment          = Column(String, nullable=True)
    frustration_score  = Column(Integer, nullable=True)
    suggested_response = Column(Text, nullable=True)
    key_issue          = Column(Text, nullable=True)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()