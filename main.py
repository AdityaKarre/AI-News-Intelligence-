from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services import news_service,explanation_service

# Initialize the core FastAPI Application Engine
app = FastAPI(title="🧠 AI News Intelligence Platform Systems")

# 🔓 CROSS-ORIGIN CONNECTIVITY GUARD
# Allows your browser layout to safely make network fetches locally without CORS blocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local files or live servers to interface smoothly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic validation schema for processing requests
class AnalysisRequest(BaseModel):
    title: str
    link: str

@app.get("/api/news")
def get_news_stream(region: str = "India", category: str = "All"):
    """
    Exposes raw aggregated regional news streams filtered by domain taxonomy.
    """
    try:
        articles = news_service.fetch_news(region, category)
        
        # Serialize python datetime objects cleanly into string strings for JSON compliance
        for article in articles:
            if article["published"]:
                article["published"] = article["published"].isoformat()
                
        return {"status": "success", "count": len(articles), "articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data Extraction Interruption: {str(e)}")

@app.post("/analyze")
def run_nlp_analysis(payload: AnalysisRequest):
    """
    Scrapes full-text layers and queries Groq to assemble AI Intelligence analytics.
    """
    try:
        # 1. Harvest raw plaintext context from core document URL
        full_text = news_service.extract_full_article(payload.link)
        
        if not full_text or len(full_text.strip()) == 0:
            return {
                "status": "partial_success",
                "analysis": {
                    "explanation": "Could not automatically scrape full body content.",
                    "deep_context": "Insufficient core data context captured to parse systemic tracking vectors."
                }
            }
        
        # 2. Fire simultaneous/ordered processing queries to Llama-3.1 via Groq
        short_summary = explanation_service.generate_explanation(payload.title, full_text)
        deep_context_narrative = explanation_service.generate_deep_context(payload.title, full_text)
        
        return {
            "status": "success",
            "analysis": {
                "explanation": short_summary,
                "deep_context": deep_context_narrative
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP Compilation Exception: {str(e)}")