import feedparser
import html
import random
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from newspaper import Article

# ─────────────────────────────────────────────────────────────────────────────
# PURE REGIONAL FEEDS
# ─────────────────────────────────────────────────────────────────────────────
NEWS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://indianexpress.com/section/india/feed/"
        ],
        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://www.ndtv.com/politics/feed"
        ],
        "Technology": [
            "https://gadgets360.com/rss/feeds",
            "https://tech.hindustantimes.com/rss/tech"
        ],
        "Business": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.livemint.com/rss/markets"
        ],
        "Sports": [
            "https://www.cricbuzz.com/rss-feeds/news",
            "https://indianexpress.com/section/sports/feed/"
        ],
        "Entertainment": [
            "https://www.bollywoodhungama.com/rss/news.xml",
            "https://indianexpress.com/section/entertainment/feed/",
            "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms" 
        ]
    },
    "World": {
        "All": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "http://feeds.bbci.co.uk/news/world/rss.xml"
        ],
        "Politics": [
            "https://www.aljazeera.com/xml/rss/politics.xml",
            "http://feeds.bbci.co.uk/news/politics/rss.xml"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml"
        ],
        "Business": [
            "https://www.cnbc.com/id/100003114/device/rss/rss.html",
            "https://www.ft.com/?format=rss"
        ],
        "Sports": [
            "http://feeds.bbci.co.uk/sport/rss.xml",
            "https://www.espn.com/espn/rss/news"
        ],
        "Entertainment": [
            "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
            "https://variety.com/feed/"
        ]
    }
}

# Map Finance to Business to catch any frontend discrepancies safely
for region in NEWS_FEEDS:
    NEWS_FEEDS[region]["Finance"] = NEWS_FEEDS[region]["Business"]

# ─────────────────────────────────────────────────────────────────────────────
# ANTI-LEAKAGE SHIELD (NEGATIVE FILTERING)
# Actively ejects articles from publishers that cross-post into the wrong feeds
# ─────────────────────────────────────────────────────────────────────────────
POLLUTION_BLOCKLIST = {
    "Entertainment": ["modi", "bjp", "congress", "election", "parliament", "minister", "govt", "government", "sensex", "nifty", "stock", "market", "cm", "pm", "mla", "isro"],
    "Sports": ["modi", "bjp", "congress", "election", "parliament", "minister", "govt", "government", "sensex", "nifty", "movie", "bollywood", "actor", "actress", "cm", "pm", "mla", "isro"],
    "Technology": ["modi", "bjp", "congress", "election", "minister", "bollywood", "movie", "cricket", "ipl", "cm", "pm", "mla"],
    "Business": ["bollywood", "movie", "cricket", "ipl", "actor", "actress", "film"],
    "Politics": ["bollywood", "movie", "actor", "actress", "film", "cricket", "ipl", "smartphone", "gadget"]
}

GLOBAL_BLOCKS = ["murder", "rape", "assault", "arrest", "criminal", "custody", "bail", "accident", "deadly", "robbery", "suicide"]

def clean_text(text):
    return BeautifulSoup(html.unescape(text), "html.parser").get_text().strip()

def fetch_news(region="India", category="All", limit=35):
    all_articles = []
    time_threshold = datetime.utcnow() - timedelta(hours=96)
    seen_titles = set()

    try:
        feeds = NEWS_FEEDS[region][category]
    except KeyError:
        feeds = NEWS_FEEDS[region]["All"]

    for url in feeds:
        try:
            feed = feedparser.parse(url)
            entries = feed.entries[:30]
            random.shuffle(entries)

            for entry in entries:
                raw_title = entry.get("title", "")
                raw_summary = entry.get("summary", "")
                
                title = clean_text(raw_title)
                if not title or len(title.split()) < 4:
                    continue
                    
                title_lower = title.lower()
                if title_lower in seen_titles:
                    continue
                    
                summary = clean_text(raw_summary)
                text_to_check = title_lower + " " + summary.lower()

                # 1. Drop global negative news
                if any(re.search(r'\b' + block + r'\b', text_to_check) for block in GLOBAL_BLOCKS):
                    continue

                # 2. Execute the Anti-Pollution Blocklist for specific categories
                if category != "All" and category in POLLUTION_BLOCKLIST:
                    blocks = POLLUTION_BLOCKLIST[category]
                    # If a competing category's keyword is found, nuke the article
                    if any(re.search(r'\b' + bw + r'\b', text_to_check) for bw in blocks):
                        continue

                pub_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                if pub_parsed:
                    pub_datetime = datetime(*pub_parsed[:6])
                    if pub_datetime < time_threshold:
                        continue 

                seen_titles.add(title_lower)
                source_name = feed.feed.get("title", "News Source").replace(" - Times of India", "").strip()

                all_articles.append({
                    "source": source_name,
                    "title": title,
                    "description": summary[:250],
                    "summary": summary,
                    "link": entry.get("link", ""),
                    "category": category,
                    "region": region,
                    "time": pub_datetime.strftime("%b %d, %Y") if pub_parsed else "Latest"
                })
        except Exception:
            pass
    
    random.shuffle(all_articles)
    return all_articles[:limit]

def extract_full_article(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return {"text": article.text, "title": article.title}
    except Exception:
        return {"text": "", "title": ""}