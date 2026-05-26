from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from newspaper import Article

from services.news_service import fetch_news

from services.explanation_service import (
    generate_explanation,
    generate_deep_context
)

app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Model
class AnalyzeRequest(BaseModel):
    url: str


# Home Route
@app.get("/")
def home():

    return {
        "status": "success",
        "message": "AI News Intelligence Backend Running"
    }


# News Route
@app.get("/api/news")
def get_news(
    region: str = "World",
    category: str = "All"
):

    try:

        articles = fetch_news(region, category)

        # Ensure minimum articles
        if len(articles) < 5:

            fallback_articles = fetch_news(region, "All")

            existing_titles = {
                article.get("title", "")
                for article in articles
            }

            for article in fallback_articles:

                title = article.get("title", "")

                if title not in existing_titles:

                    articles.append(article)

                if len(articles) >= 8:
                    break

        return {
            "status": "success",
            "news": articles[:8]
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e),
            "news": []
        }


# Analyze Route
@app.post("/api/analyze")
def analyze_article(request: AnalyzeRequest):

    try:

        url = request.url

        article = Article(url)

        # Try extracting article
        try:

            article.download()

            article.parse()

            title = article.title or "News Article"

            content = article.text

        except Exception as scrape_error:

            print("SCRAPING ERROR:", str(scrape_error))

            # Fallback for blocked articles
            title = "News Article"

            content = f"""
            Analyze this news article intelligently.

            Article URL:
            {url}

            Generate:
            1. Concise AI Summary
            2. Deep Context Analysis
            """

        # Safety fallback
        if not content or not content.strip():

            content = title

        # Generate AI Summary
        explanation = generate_explanation(
            title,
            content
        )

        # Generate Deep Context
        deep_context = generate_deep_context(
            title,
            content
        )

        return {

            "status": "success",

            "analysis": {

                "explanation": explanation,

                "deep_context": deep_context
            }
        }

    except Exception as e:

        print("ANALYZE ERROR:", str(e))

        return {

            "status": "error",

            "message": str(e),

            "analysis": {

                "explanation":
                    "Unable to generate AI summary right now.",

                "deep_context":
                    "Unable to generate deep context right now."
            }
        }