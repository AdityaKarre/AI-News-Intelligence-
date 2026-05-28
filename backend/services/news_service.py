import feedparser
import requests
import random
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
# BACKEND CATEGORY KEYWORD MATCH MASKS
# Strict industry validation filters to stop category bleed
# ─────────────────────────────────────────────
VALIDATION_KEYWORDS = {
    "Technology": [
        "tech", "software", "hardware", "app", "apps", "smartphone", "phone", "laptop", 
        "computer", "chip", "semiconductor", "ai", "artificial intelligence", "machine learning", 
        "cyber", "cybersecurity", "hack", "cloud", "5g", "internet", "wifi", "satellite", 
        "robot", "drone", "ev", "electric vehicle", "coding", "developer", "programming", 
        "api", "google", "apple", "microsoft", "amazon", "meta", "openai", "tesla", 
        "nvidia", "intel", "samsung", "qualcomm", "amd", "gadget", "device", "wearable", 
        "smartwatch", "tablet", "launch", "release", "update", "processor", "iphone", 
        "android", "pixel", "galaxy", "oneplus", "display", "server", "system", "platform"
    ],
    "Business": [
        "market", "stock", "share", "economy", "gdp", "inflation", "budget", "trade", "export", 
        "import", "revenue", "profit", "loss", "earnings", "investment", "investor", "fund", 
        "ipo", "startup", "company", "corporate", "industry", "sector", "bank", "banking", 
        "finance", "financial", "tax", "rupee", "dollar", "sensex", "nifty", "bse", "nse", "rbi", 
        "interest rate", "merger", "acquisition", "deal", "billion", "million", "quarter", 
        "annual", "results", "growth", "recession", "employment", "job", "layoff", "hire", "ceo", 
        "cfo", "business", "commerce", "retail", "ecommerce", "sales", "brands", "retailer", "prices", "firm"
    ],
    "Sports": [
        "cricket", "football", "soccer", "tennis", "basketball", "hockey", "rugby", "golf", 
        "athletics", "olympic", "olympics", "ipl", "bcci", "fifa", "match", "tournament", 
        "championship", "league", "cup", "trophy", "player", "team", "coach", "squad", "innings", 
        "wicket", "run", "goal", "score", "fixture", "series", "stadium", "transfer", "debut", 
        "won", "lost", "win", "defeat", "victory", "clash", "game", "play"
    ],
    "Entertainment": [
        "movie", "film", "cinema", "bollywood", "hollywood", "films", "series", "show", "tv", 
        "ott", "netflix", "amazon prime", "disney", "hotstar", "song", "music", "album", "artist", 
        "singer", "actor", "actress", "celebrity", "star", "award", "oscar", "grammy", "filmfare", 
        "release", "trailer", "review", "box office", "collection", "streaming", "entertainment", 
        "concert", "tour", "fashion", "interview", "debut", "premiere", "television", "theatre", "teaser"
    ],
    "Politics": [
        "government", "parliament", "minister", "prime minister", "president", "election", 
        "vote", "party", "congress", "bjp", "lok sabha", "rajya sabha", "policy", "law", "bill", 
        "act", "constitution", "court", "supreme court", "high court", "diplomat", "foreign policy", 
        "protest", "opposition", "political", "politician", "governance", "administration", 
        "campaign", "rally", "coalition", "modi", "rahul", "shah", "leaders", "state", "centre",
        "assembly", "senate", "white house", "biden", "trump", "cm", "pm"
    ]
}

# General block filter to trap irrelevant noise alerts
GLOBAL_GENERAL_BLOCKS = [
    "murder", "rape", "assault", "arrest", "criminal", "custody", "bail", "accident", "highway", 
    "deadly", "ebola", "virus", "scare", "isolated", "testing", "hospital", "patients", "flight snag",
    "snag", "airspace", "landed safely", "turned back", "stray dog", "weather alert", "robbery", "theft"
]

# ─────────────────────────────────────────────
# CENTRALIZED ACCURATE RSS FEEDS (INDIA & WORLD)
# ─────────────────────────────────────────────
RSS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://indianexpress.com/section/india/feed/",
            "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"
        ],
        "Technology": [
            "https://feeds.feedburner.com/gadgets360-latest",
            "https://indianexpress.com/section/technology/feed/",
            "https://tech.hindustantimes.com/rss/tech",
            "https://cio.economictimes.indiatimes.com/rss"
        ],
        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://theprint.in/feed/",
            "https://feeds.feedburner.com/ndtvindia",
            "https://timesofindia.indiatimes.com/rssfeeds/1081479996.cms"
        ],
        "Business": [
            "https://feeds.feedburner.com/ndtvbusiness",
            "https://indianexpress.com/section/business/feed/",
            "https://www.business-standard.com/rss/home_page_top_stories.rss",
            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        ],
        "Entertainment": [
            "https://feeds.feedburner.com/ndtvmovies",
            "https://indianexpress.com/section/entertainment/feed/",
            "https://www.filmibeat.com/rss/feeds/filmibeat-fb.xml",
            "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms"
        ],
        "Sports": [
            "https://sports.ndtv.com/rss/all",
            "https://feeds.feedburner.com/ndtvcricinfo",
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
            "https://indianexpress.com/section/sports/feed/",
            "https://timesofindia.indiatimes.com/rssfeeds/1221666.cms"
        ]
    },
    "World": {
        "All": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://news.un.org/en/rss/feeds/top-stories",
            "https://globalvoices.org/feed/",
            "https://apnews.com/hub/world-news/rss",
            "https://www.channelnewsasia.com/rss"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://www.aljazeera.com/xml/rss/technology.xml",
            "https://news.un.org/en/rss/feeds/technology",
            "https://globalvoices.org/topic/technology/feed/"
        ],
        "Politics": [
            "https://www.aljazeera.com/xml/rss/politics.xml",
            "https://news.un.org/en/rss/feeds/peace-security",
            "https://globalvoices.org/topic/politics/feed/",
            "https://apnews.com/hub/politics/rss"
        ],
        "Business": [
            "https://www.cnbc.com/id/10001147/device/rss/rss.html",
            "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
            "https://feeds.bbci.co.uk/news/business/rss.xml"
        ],
        "Entertainment": [
            "https://globalvoices.org/topic/culture/feed/",
            "https://news.un.org/en/rss/feeds/culture-education",
            "https://apnews.com/hub/entertainment/rss"
        ],
        "Sports": [
            "https://www.aljazeera.com/xml/rss/sports.xml",
            "https://apnews.com/hub/sports/rss",
            "https://feeds.bbci.co.uk/sport/rss.xml",
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml"
        ]
    }
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
# CORE SELECTION & EXTRACTION PIPELINE
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

            # Backup Strategy Pass 1: Grab full raw list and shuffle immediately
            raw_entries = feed.entries[:30]
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

                    # 1. Global Filter Check
                    if any(block_word in search_text for block_word in GLOBAL_GENERAL_BLOCKS):
                        continue

                    # 2. Server-Side Mandatory Category Validation Check
                    if category != "All" and category in VALIDATION_KEYWORDS:
                        has_marker = any(keyword in search_text for keyword in VALIDATION_KEYWORDS[category])
                        if not has_marker:
                            continue  # Filter out non-thematic news silently

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

    # Backup Strategy Pass 2: Final random layout shake to wake up refresh button
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