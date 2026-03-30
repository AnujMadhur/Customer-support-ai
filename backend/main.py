from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import create_tables
from routes.tickets import router as tickets_router
from routes.insights import router as insights_router

load_dotenv()

app = FastAPI(
    title="Customer Support AI Platform",
    description="AI-powered analysis of customer support tickets",
    version="1.0.0"
)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_tables()
    print("✅ Database tables ready")

app.include_router(tickets_router)
app.include_router(insights_router)

@app.get("/")
def root():
    return {"status": "running", "message": "Customer Support AI Platform ✅"}