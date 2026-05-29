import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from newspaper import Article

from services.news_service import fetch_news
from services.explanation_service import (
    generate_explanation,
    generate_deep_context,
)

app = FastAPI()

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# REQUEST MODELS (Updated with Fallbacks)
# ─────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    url: str
    title: str = ""
    description: str = ""

# ─────────────────────────────────────────────
# HOME ROUTE
# ─────────────────────────────────────────────
@app.get("/")
def home():
    return {
        "status": "success",
        "message": "AI News Intelligence Backend Running",
    }

# ─────────────────────────────────────────────
# NEWS ROUTE
# ─────────────────────────────────────────────
@app.get("/api/news")
def get_news(region: str = "India", category: str = "All"):
    try:
        articles = fetch_news(region, category, limit=35)
        return {
            "status": "success",
            "count": len(articles),
            "news": articles,
        }
    except Exception as e:
        print(f"[NEWS ROUTE ERROR] {e}")
        return {
            "status": "error",
            "message": str(e),
            "news": [],
        }

# ─────────────────────────────────────────────
# ANALYZE ROUTE (Updated with Smart Fallback)
# ─────────────────────────────────────────────
@app.post("/api/analyze")
def analyze_article(request: AnalyzeRequest):
    try:
        url = request.url
        title = request.title or "News Article"
        content = ""

        try:
            # Attempt to scrape the full article text
            article = Article(url)
            article.download()
            article.parse()
            
            if article.title:
                title = article.title
            content = article.text or ""
            
        except Exception as scrape_error:
            print(f"[SCRAPING ERROR] {scrape_error}")

        # Smart Fallback: Use frontend description if scraping fails
        if not content.strip():
            content = request.description if request.description else f"Article URL: {url}"

        explanation  = generate_explanation(title, content)
        deep_context = generate_deep_context(title, content)

        return {
            "status": "success",
            "analysis": {
                "explanation": explanation,
                "deep_context": deep_context,
            },
        }

    except Exception as e:
        print(f"[ANALYZE ERROR] {e}")
        return {
            "status": "error",
            "message": str(e),
            "analysis": {
                "explanation": "Unable to generate AI summary right now.",
                "deep_context": "Unable to generate deep context right now.",
            },
        }