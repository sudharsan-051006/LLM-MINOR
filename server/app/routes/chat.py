from fastapi import APIRouter
from ..schemas.user_schema import ChatRequest, RepoRequest
from ..services.ai_service import AIService

router = APIRouter()

@router.post("/ask")
async def ask_doubt(request: ChatRequest):
    """
    Endpoint for Student Doubt Resolution (Hybrid-RAG)
    """
    result = await AIService.resolve_doubt(request.query, str(request.course_id))
    return result

@router.post("/analyze-repo")
async def analyze_repo(request: RepoRequest):
    """
    Endpoint for Project Code Analysis
    """
    result = await AIService.analyze_github_repo(request.repo_url, request.requirements)
    return result