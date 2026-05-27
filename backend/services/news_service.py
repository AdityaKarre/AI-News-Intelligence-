import feedparser
import requests
import time

from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta


# ─────────────────────────────────────────────
# RSS FEEDS
#
# KEY CHANGE: "All" category now uses CLEAN
# general feeds only. TOI/NDTV removed from
# category-specific feeds — they bleed general
# news into every category.
# ─────────────────────────────────────────────

RSS_FEEDS = {

    "India": {

        # "All" uses top-story feeds — these are
        # intentionally general, shown only when
        # user selects "All"
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://indianexpress.com/section/india/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss",
        ],

        # Category feeds: ONLY dedicated sources
        # No TOI/NDTV general feeds here
        "Technology": [
            "https://feeds.feedburner.com/gadgets360-latest",
            "https://www.livemint.com/rss/technology",
            "https://tech.hindustantimes.com/rss/topnews/rssfeed.xml",
        ],

        "Business": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.livemint.com/rss/markets",
            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        ],

        "Sports": [
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
            "https://sports.yahoo.com/top/rss.xml",
            "https://feeds.bbci.co.uk/sport/rss.xml",
        ],

        "Entertainment": [
            "https://www.bollywoodhungama.com/rss/news.xml",
            "https://www.ndtv.com/entertainment/feed",
            "https://www.billboard.com/feed/",
        ],

        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://feeds.bbci.co.uk/news/politics/rss.xml",
            "http://rss.cnn.com/rss/cnn_allpolitics.rss",
        ],
    },

    "World": {

        "All": [
            "http://rss.cnn.com/rss/edition.rss",
            "http://feeds.bbci.co.uk/news/rss.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        ],

        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://feeds.arstechnica.com/arstechnica/index",
        ],

        "Business": [
            "https://www.cnbc.com/id/10001147/device/rss/rss.html",
            "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
            "https://feeds.bbci.co.uk/news/business/rss.xml",
        ],

        "Sports": [
            "https://www.espn.com/espn/rss/news",
            "https://sports.yahoo.com/top/rss.xml",
            "https://feeds.bbci.co.uk/sport/rss.xml",
        ],

        "Entertainment": [
            "https://www.hollywoodreporter.com/feed/",
            "https://www.billboard.com/feed/",
            "https://variety.com/feed/",
        ],

        "Politics": [
            "https://feeds.bbci.co.uk/news/politics/rss.xml",
            "http://rss.cnn.com/rss/cnn_allpolitics.rss",
            "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
        ],
    },
}

# ─────────────────────────────────────────────
# TITLE CLEANING
# ─────────────────────────────────────────────
TITLE_SUFFIXES = [
    " - Times of India", " | CNN", " - BBC News", " - BBC Sport",
    " - The Hindu", " - NDTV", " | NDTV News", " - Indian Express",
    " - Livemint", " - Moneycontrol", " | Economic Times",
    " - ESPN", " - TechCrunch", " - The Verge",
    " | Hollywood Reporter", " – Variety", " - Variety",
]

def clean_title(title: str) -> str:
    for suffix in TITLE_SUFFIXES:
        title = title.replace(suffix, "")
    return title.strip()


# ─────────────────────────────────────────────
# SAFE FEED FETCHER WITH REAL HTTP TIMEOUT
# ─────────────────────────────────────────────
def _parse_feed_safe(url: str, timeout: int = 8):
    try:
        resp = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)"},
        )
        resp.raise_for_status()
        return feedparser.parse(resp.content)
    except Exception:
        return None


# ─────────────────────────────────────────────
# FETCH NEWS
# limit param added so main.py can request more
# articles for the frontend filter to work with
# ─────────────────────────────────────────────
TIME_THRESHOLD_HOURS = 72

def fetch_news(region: str = "India", category: str = "All", limit: int = 20):

    articles = []
    seen_titles: set = set()

    feeds = RSS_FEEDS.get(region, {}).get(category, [])
    time_threshold = datetime.utcnow() - timedelta(hours=TIME_THRESHOLD_HOURS)

    for url in feeds:
        try:
            feed = _parse_feed_safe(url, timeout=8)
            if feed is None or not feed.entries:
                continue

            # Take enough per feed to fill the limit across all feeds
            per_feed = max(10, limit // max(len(feeds), 1) + 5)
            entries = feed.entries[:per_feed]

            for entry in entries:
                try:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            published = datetime(*entry.published_parsed[:6])
                        except Exception:
                            published = None

                    # Only skip articles that HAVE a date AND it's old
                    if published is not None and published < time_threshold:
                        continue

                    title = entry.get("title", "").strip()
                    if not title:
                        continue

                    title = clean_title(title)

                    title_key = title.lower()
                    if title_key in seen_titles:
                        continue
                    seen_titles.add(title_key)

                    link        = entry.get("link", "")
                    raw_summary = entry.get("summary", "")
                    summary     = BeautifulSoup(raw_summary, "html.parser").get_text().strip()

                    time_label = "Latest"
                    if published:
                        try:
                            time_label = published.strftime("%b %d, %Y")
                        except Exception:
                            time_label = "Latest"

                    raw_source = (
                        feed.feed.title
                        if hasattr(feed, "feed") and hasattr(feed.feed, "title")
                        else "Unknown"
                    )

                    articles.append({
                        "title":       title,
                        "description": summary[:280],
                        "summary":     summary,
                        "link":        link,
                        "source":      raw_source.strip(),
                        "region":      region,
                        "category":    category,
                        "time":        time_label,
                    })

                except Exception:
                    continue

        except Exception:
            continue

    return articles


# ─────────────────────────────────────────────
# ARTICLE EXTRACTION
# ─────────────────────────────────────────────
def extract_full_article(url: str):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return {
            "text":         article.text,
            "authors":      article.authors,
            "publish_date": str(article.publish_date),
            "top_image":    article.top_image,
        }
    except Exception:
        return {
            "text":         "Unable to fetch article.",
            "authors":      [],
            "publish_date": None,
            "top_image":    "",
        }