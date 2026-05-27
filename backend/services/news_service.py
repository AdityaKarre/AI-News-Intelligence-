import feedparser
import requests
import random
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
# BACKEND CATEGORY KEYWORD MATCH MASKS
# Used to arrest content bleed from mixed feeds
# ─────────────────────────────────────────────
VALIDATION_KEYWORDS = {
    "Technology": ["tech", "software", "hardware", "app", "phone", "chip", "ai", "cyber", "gadget", "device", "launch", "crypto", "digital", "system"],
    "Business": ["market", "stock", "share", "economy", "gdp", "revenue", "profit", "investment", "bank", "finance", "financial", "tax", "rupee", "dollar", "company", "ceo"],
    "Sports": ["cricket", "football", "soccer", "tennis", "match", "tournament", "championship", "league", "cup", "player", "team", "score", "win", "victory"],
    "Entertainment": ["movie", "film", "cinema", "bollywood", "hollywood", "films", "series", "show", "tv", "ott", "song", "music", "album", "artist", "singer", "actor", "actress", "celebrity", "star", "premiere"],
    "Politics": ["government", "parliament", "minister", "prime minister", "president", "election", "vote", "party", "congress", "bjp", "policy", "law", "court", "political", "modi", "leaders"]
}

GLOBAL_CRIME_BLOCKS = ["murder", "rape", "assault", "arrest", "criminal", "custody", "accident", "highway", "deadly"]

# ─────────────────────────────────────────────
# RSS FEEDS
# ─────────────────────────────────────────────
RSS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://indianexpress.com/section/india/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss",
        ],
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
            "https://sports.ndtv.com/rss/all"
        ],
        "Entertainment": [
            "https://www.bollywoodhungama.com/rss/news.xml",
            "https://www.ndtv.com/entertainment/feed"
        ],
        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss"
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
# ─────────────────────────────────────────────
TIME_THRESHOLD_HOURS = 72

def fetch_news(region: str = "India", category: str = "All", limit: int = 35):
    articles = []
    seen_titles = set()

    feeds = RSS_FEEDS.get(region, {}).get(category, [])
    time_threshold = datetime.utcnow() - timedelta(hours=TIME_THRESHOLD_HOURS)

    for url in feeds:
        try:
            feed = _parse_feed_safe(url, timeout=8)
            if feed is None or not feed.entries:
                continue

            # BACKUP FIX: Grab a larger raw pool and randomize immediately
            raw_entries = feed.entries[:25]
            random.shuffle(raw_entries)

            for entry in raw_entries:
                try:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            published = datetime(*entry.published_parsed[:6])
                        except Exception:
                            published = None

                    if published is not None and published < time_threshold:
                        continue

                    title = entry.get("title", "").strip()
                    if not title:
                        continue

                    title = clean_title(title)
                    title_key = title.lower()

                    if title_key in seen_titles:
                        continue

                    raw_summary = entry.get("summary", "")
                    summary = BeautifulSoup(raw_summary, "html.parser").get_text().strip()
                    search_text = (title + " " + summary).lower()

                    # ── BACKEND QUALITY CHECK ──
                    if any(block_word in search_text for block_word in GLOBAL_CRIME_BLOCKS):
                        continue

                    if category != "All" and category in VALIDATION_KEYWORDS:
                        has_marker = any(keyword in search_text for keyword in VALIDATION_KEYWORDS[category])
                        if not has_marker:
                            continue  

                    seen_titles.add(title_key)

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

                    # FIX: Safely assign the link dictionary key without inline syntax issues
                    article_link = entry.get("link", "")

                    articles.append({
                        "title":       title,
                        "description": summary[:280],
                        "summary":     summary,
                        "link":        article_link,
                        "source":      raw_source.strip(),
                        "region":      region,
                        "category":    category,
                        "time":        time_label,
                    })

                except Exception:
                    continue
        except Exception:
            continue

    # BACKUP FIX: Randomize slightly across the latest pool before sending to frontend
    random.shuffle(articles)
    return articles[:limit]

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