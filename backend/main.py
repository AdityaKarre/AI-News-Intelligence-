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
# REQUEST MODELS
# ─────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: str


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
        articles = fetch_news(region, category)

        # FIX: Smarter fallback — only trigger when category is NOT
        # "All" (fetching "All" as fallback for "All" is pointless).
        # Also avoid re-adding duplicates more carefully using a set.
        if len(articles) < 5 and category != "All":

            fallback_articles = fetch_news(region, "All")

            existing_titles = {
                a.get("title", "").lower()
                for a in articles
            }

            for article in fallback_articles:
                title_key = article.get("title", "").lower()

                if title_key and title_key not in existing_titles:
                    articles.append(article)
                    existing_titles.add(title_key)

                if len(articles) >= 10:
                    break

        # FIX: Return up to 10 (was 8) so there's always enough to
        # display even if 1–2 cards get filtered on the frontend.
        return {
            "status": "success",
            "count": len(articles[:10]),
            "news": articles[:10],
        }

    except Exception as e:
        print(f"[NEWS ROUTE ERROR] {e}")
        return {
            "status": "error",
            "message": str(e),
            "news": [],
        }


# ─────────────────────────────────────────────
# ANALYZE ROUTE
# ─────────────────────────────────────────────

@app.post("/api/analyze")
def analyze_article(request: AnalyzeRequest):
    try:
        url = request.url
        article = Article(url)

        title = "News Article"
        content = ""

        try:
            article.download()
            article.parse()
            title = article.title or "News Article"
            content = article.text or ""
        except Exception as scrape_error:
            print(f"[SCRAPING ERROR] {scrape_error}")
            # Graceful fallback — AI will work from URL context
            content = f"Article URL: {url}"

        # Safety fallback
        if not content.strip():
            content = title if title != "News Article" else f"Article URL: {url}"

        # Generate AI Summary + Deep Context
        explanation = generate_explanation(title, content)
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