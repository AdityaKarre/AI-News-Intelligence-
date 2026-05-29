import feedparser
import requests
import time
import random
import re
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta

# ─────────────────────────────────────────────────────────────────────────────
# HIGH-PRECISION VALIDATION KEYWORDS
# ─────────────────────────────────────────────────────────────────────────────
VALIDATION_KEYWORDS = {
    "Technology": [
        "tech", "technology", "software", "hardware", "app", "apps", "smartphone", "phone", 
        "laptop", "computer", "chip", "semiconductor", "ai", "artificial intelligence", 
        "machine learning", "cyber", "cybersecurity", "hack", "cloud", "5g", "internet", 
        "wifi", "satellite", "robot", "drone", "ev", "electric vehicle", "coding", "developer", 
        "programming", "api", "google", "apple", "microsoft", "amazon", "meta", "openai", 
        "tesla", "nvidia", "intel", "samsung", "qualcomm", "amd", "gadget", "device", 
        "wearable", "smartwatch", "tablet", "launch", "release", "update", "processor", 
        "iphone", "android", "pixel", "galaxy", "oneplus", "display", "server", "system", "platform"
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

GLOBAL_GENERAL_BLOCKS = [
    "murder", "rape", "assault", "arrest", "criminal", "custody", "bail", "accident", "highway", 
    "deadly", "ebola", "virus", "scare", "isolated", "testing", "hospital", "patients", "flight snag",
    "snag", "airspace", "landed safely", "turned back", "stray dog", "weather alert", "robbery", "theft"
]

RSS_FEEDS = {
    "India": {
        "All": [
            "https://indianexpress.com/section/india/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
        ],
        "Technology": [
            "https://feeds.feedburner.com/gadgets360-latest",
            "https://cio.economictimes.indiatimes.com/rss",
            "https://tech.hindustantimes.com/rss/tech",
            "https://www.livemint.com/rss/technology"
        ],
        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://theprint.in/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss"
        ],
        "Business": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.business-standard.com/rss/home_page_top_stories.rss",
            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
            "https://www.livemint.com/rss/markets"
        ],
        "Entertainment": [
            "https://www.bollywoodhungama.com/rss/news.xml",
            "https://www.filmibeat.com/rss/feeds/filmibeat-fb.xml",
            "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms"
        ],
        "Sports": [
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
            "https://feeds.feedburner.com/ndtvcricinfo",
            "https://indianexpress.com/section/sports/feed/",
            "https://timesofindia.indiatimes.com/rssfeeds/1221666.cms"
        ]
    },
    "World": {
        "All": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://apnews.com/hub/world-news/rss",
            "http://feeds.bbci.co.uk/news/rss.xml",
            "https://www.channelnewsasia.com/rss",
            "https://feeds.reuters.com/reuters/topNews"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://feeds.arstechnica.com/arstechnica/index",
            "https://www.aljazeera.com/xml/rss/technology.xml",
            "https://news.un.org/en/rss/feeds/technology"
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
            "https://feeds.bbci.co.uk/sport/rss.xml",
            "http://www.espn.com/espn/rss/news",
            "https://www.aljazeera.com/xml/rss/sports.xml",
            "https://apnews.com/hub/sports/rss"
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
        # Avoid string manipulation that breaks .cms routes. Pass cache control parameters via headers instead.
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        resp = requests.get(url, timeout=timeout, headers=headers)
        resp.raise_for_status()
        return feedparser.parse(resp.content)
    except Exception:
        return None

def fetch_news(region="India", category="All", limit=35):
    high_quality_pool = []
    fallback_pool = []
    seen_titles = set()

    feeds = RSS_FEEDS.get(region, {}).get(category, [])
    time_threshold = datetime.utcnow() - timedelta(hours=96) # Expand slightly to capture full weekend cycles safely

    for url in feeds:
        try:
            feed = _parse_feed_safe(url, timeout=8)
            if feed is None or not feed.entries:
                continue
            
            raw_entries = feed.entries[:40]
            random.shuffle(raw_entries)

            for entry in raw_entries:
                try:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])

                    if published and published < time_threshold:
                        continue

                    title = entry.get("title", "No Title").strip()
                    if not title or title == "No Title":
                        continue

                    title = clean_title(title)
                    title_key = title.lower()

                    if title_key in seen_titles:
                        continue

                    link = entry.get("link", "")
                    summary = entry.get("summary", "")
                    summary = BeautifulSoup(summary, "html.parser").get_text().strip()
                    combined_text = f"{title} {summary}".lower()

                    # 1. Clear Global Blocks completely
                    if any(re.search(r'\b' + re.escape(bw) + r'\b', combined_text) for bw in GLOBAL_GENERAL_BLOCKS):
                        continue

                    seen_titles.add(title_key)
                    raw_source = feed.feed.title if hasattr(feed, "feed") and hasattr(feed.feed, "title") else "Unknown"

                    article_data = {
                        "title": title,
                        "description": summary[:250],
                        "summary": summary,
                        "link": link,
                        "source": raw_source.strip(),
                        "region": region,
                        "category": category,
                    }

                    # 2. Sort by match quality. If it's a sub-category feed, separate high-keyword hits from clean contextual links.
                    if category != "All":
                        keywords = VALIDATION_KEYWORDS.get(category, [])
                        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', combined_text))
                        if score > 0:
                            high_quality_pool.append(article_data)
                        else:
                            fallback_pool.append(article_data)
                    else:
                        high_quality_pool.append(article_data)

                except Exception:
                    continue
        except Exception:
            continue

    # Mix together to prioritize clear thematic hits first, using clean niche entries to ensure a stable fallback count
    random.shuffle(high_quality_pool)
    random.shuffle(fallback_pool)
    
    final_combined_pool = high_quality_pool + fallback_pool
    return final_combined_pool[:limit]

def extract_full_article(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return {
            "text": article.text,
            "authors": article.authors,
            "publish_date": str(article.publish_date),
            "top_image": article.top_image,
        }
    except Exception:
        return {"text": "Unable to fetch article.", "authors": [], "publish_date": None, "top_image": ""}