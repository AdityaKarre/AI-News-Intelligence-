import feedparser
import requests
import random
import time
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
# PAN-INDIA INCLUSIVE GEO-FILTERING KEYWORDS
# ─────────────────────────────────────────────
# Expanded verification filter to prevent geographic bias and capture all parts of India
INDIA_GEO_KEYWORDS = [
    "india", "indian", "rupee", "crore", "lakh", "rbi", "pmo", "isro", "bjp", "congress", "aadhaar", "sensex", "nifty",
    # South India (Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, Kerala)
    "hyderabad", "telangana", "andhra", "visakhapatnam", "amaravati", "bengaluru", "karnataka", "chennai", "tamil nadu", "kerala", "kochi", "thiruvananthapuram",
    # East & Northeast India (West Bengal, Bihar, Odisha, Jharkhand, Assam, and sister states)
    "kolkata", "west bengal", "bihar", "patna", "odisha", "bhubaneswar", "jharkhand", "ranchi", "assam", "guwahati", "manipur", "meghalaya", "mizoram", "nagaland", "tripura", "sikkim", "arunachal",
    # West & Central India (Maharashtra, Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Goa)
    "mumbai", "maharashtra", "pune", "gujarat", "ahmedabad", "gandhinagar", "rajasthan", "jaipur", "madhya pradesh", "bhopal", "chhattisgarh", "raipur", "goa",
    # North India (Delhi, Punjab, Haryana, Uttar Pradesh, Uttarakhand, Himachal, Jammu & Kashmir)
    "delhi", "new delhi", "punjab", "chandigarh", "haryana", "uttar pradesh", "lucknow", "kanpur", "ayodhya", "noida", "uttarakhand", "dehradun", "himachal", "shimla", "jammu", "kashmir"
]

# ─────────────────────────────────────────────
# RSS FEEDS (GEOGRAPHICALLY DIVERSIFIED)
# ─────────────────────────────────────────────
RSS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://indianexpress.com/section/india/feed/",
            "https://www.thehindu.com/news/national/feeder/default.rss"
        ],
        "Politics": [
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://indianexpress.com/section/political-pulse/feed/"
        ],
        "Technology": [
            "https://feeds.feedburner.com/gadgets360-latest",
            "https://tech.hindustantimes.com/rss/topnews/rssfeed.xml"
        ],
        "Business": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.livemint.com/rss/markets"
        ],
        "Sports": [
            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
            "https://sports.ndtv.com/rss/all"
        ],
        "Entertainment": [
            "https://www.bollywoodhungama.com/rss/news.xml",
            "https://www.ndtv.com/entertainment/feed"
        ]
    },
    "World": {
        "All": [
            "http://rss.cnn.com/rss/edition.rss",
            "http://feeds.bbci.co.uk/news/rss.xml",
            "https://www.france24.com/en/rss",          # Balanced European, African & Global lens
            "https://rss.dw.com/rdf/rss-en-all",        # Global perspective from Deutsche Welle
            "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
        ],
        "Politics": [
            "http://rss.cnn.com/rss/cnn_allpolitics.rss",
            "https://feeds.bbci.co.uk/news/politics/rss.xml",
            "https://www.france24.com/en/europe/rss"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://www.france24.com/en/business-tech/rss"
        ],
        "Business": [
            "https://rss.dw.com/rdf/rss-en-bus",
            "https://www.cnbc.com/id/10001147/device/rss/rss.html"
        ],
        "Sports": [
            "https://www.espn.com/espn/rss/news",
            "https://sports.yahoo.com/top/rss.xml",
            "https://www.france24.com/en/sport/rss"
        ],
        "Entertainment": [
            "https://www.hollywoodreporter.com/feed/",
            "https://variety.com/feed/",
            "https://www.france24.com/en/culture/rss"
        ]
    }
}

CATEGORY_KEYWORDS = {
    "Technology": [
        "ai", "technology", "tech", "software", "google",
        "microsoft", "apple", "startup", "cyber", "robot"
    ],

    "Business": [
        "market", "stock", "business", "economy",
        "finance", "trade", "invest", "crypto"
    ],

    "Sports": [
        "cricket", "football", "match", "sports",
        "ipl", "fifa", "tennis", "olympics"
    ],

    "Entertainment": [
        "movie", "film", "actor", "music",
        "celebrity", "hollywood", "bollywood"
    ],

    "Politics": [
        "government", "minister", "election",
        "parliament", "policy", "politics"
    ]
}

# ─────────────────────────────────────────────
# FETCH NEWS
# ─────────────────────────────────────────────
def fetch_news(region="India", category="All"):
    articles = []
    feeds = RSS_FEEDS.get(region, {}).get(category, [])
    time_threshold = datetime.utcnow() - timedelta(hours=24)

    for url in feeds:
        try:
            # Cache-Busting: Append dynamic Unix timestamp to bypass stale intermediary network caches
            timestamp = int(time.time())
            cache_bust_url = f"{url}&t={timestamp}" if "?" in url else f"{url}?t={timestamp}"
            
            feed = feedparser.parse(cache_bust_url)
            entries = feed.entries[:20]

            # Randomize initial parsing sequence order
            random.shuffle(entries)

            for entry in entries:
                try:
                    published = None
                    if hasattr(entry, "published_parsed"):
                        published = datetime(*entry.published_parsed[:6])

                    # Skip stale documents past our 24-hour retention gate
                    if published and published < time_threshold:
                        continue

                    clean_title = title.lower()

                    title = entry.get("title", "No Title")
                    link = entry.get("link", "")
                    summary = entry.get("summary", "")
                    # Strict Category Filtering
                    if category != "All":

                        keywords = CATEGORY_KEYWORDS.get(category, [])

                        combined_text = f"{title} {summary}".lower()

                    if not any(keyword in combined_text for keyword in keywords):
                        continue
                    

                    # Clean raw HTML syntax from RSS summary payload
                    summary = BeautifulSoup(summary, "html.parser").get_text()

                    # 💡 Programmatic English-Only Guard: Instantly drop any non-ASCII text layers
                    if not title.isascii() or not summary.isascii():
                        continue

                    # Regional Filter (India): Keep things highly inclusive across all major zones
                    if region == "India":
                        combined_text = f"{title} {summary}".lower()
                        if not any(keyword in combined_text for keyword in INDIA_GEO_KEYWORDS):
                            continue

                    # Source metadata extraction and string optimization
                    raw_source = (
                        feed.feed.title
                        if hasattr(feed, "feed") and hasattr(feed.feed, "title")
                        else "Unknown"
                    )

                    if "|" in raw_source:
                        source = raw_source.split("|")[-1].strip()
                    elif " - " in raw_source:
                        source = raw_source.split(" - ")[-1].strip()
                    elif len(raw_source) > 30:
                        source = raw_source[:28].strip() + "…"
                    else:
                        source = raw_source

                    article_data = {
                        "title": title,
                        "link": link,
                        "summary": summary,
                        "source": source,
                        "published": published
                    }
                    articles.append(article_data)

                except Exception:
                    continue
        except Exception:
            continue

    # Remove duplicates matching exactly via document URLs
    unique_articles = []
    seen_links = set()
    for article in articles:
        if article["link"] not in seen_links:
            unique_articles.append(article)
            seen_links.add(article["link"])

    # Sort chronological array directly by chronological freshness
    unique_articles.sort(
        key=lambda x: x["published"] if x["published"] else datetime.min,
        reverse=True
    )

    # Slice the highest quality real-time candidates and introduce dynamic feed shuffling
    latest_pool = unique_articles[:30]
    random.shuffle(latest_pool)

    return latest_pool

# ─────────────────────────────────────────────
# EXTRACT FULL ARTICLE
# ─────────────────────────────────────────────
def extract_full_article(url):
    # Primary parsing pipeline using Newspaper3k
    try:
        article = Article(url)
        article.download()
        article.parse()
        text = article.text

        if text and len(text) > 200:
            return text
    except Exception:
        pass

    # Secondary bulletproof fallback utilizing BeautifulSoup
    try:
        response = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        text = " ".join([p.get_text() for p in paragraphs])

        return text
    except Exception:
        return ""