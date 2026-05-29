import feedparser
import html
import random
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from newspaper import Article

# ─────────────────────────────────────────────────────────────────────────────
# PERFECT SOURCE ISOLATION
# Exclusively using dedicated feeds to guarantee 100% accurate segregation
# ─────────────────────────────────────────────────────────────────────────────
NEWS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://feeds.feedburner.com/ndtvnews-top-stories",
            "https://indianexpress.com/section/india/feed/"
        ],
        "Politics": [
            "https://indianexpress.com/section/political-pulse/feed/",
            "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", 
            "https://www.ndtv.com/politics/feed"
        ],
        "Technology": [
            "https://gadgets360.com/rss/feeds",
            "https://tech.hindustantimes.com/rss/tech",
            "https://www.livemint.com/rss/technology"
        ],
        "Business": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.livemint.com/rss/markets",
            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        ],
        "Sports": [
            "https://www.cricbuzz.com/rss-feeds/news",
            "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
            "https://indianexpress.com/section/sports/feed/"
        ],
        "Entertainment": [
            "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
            "https://indianexpress.com/section/entertainment/feed/",
            "https://www.bollywoodhungama.com/rss/news.xml"
        ]
    },
    "World": {
        "All": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "http://feeds.bbci.co.uk/news/world/rss.xml",
            "https://rss.cnn.com/rss/edition.rss"
        ],
        "Politics": [
            "https://www.aljazeera.com/xml/rss/politics.xml",
            "http://feeds.bbci.co.uk/news/politics/rss.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://www.wired.com/feed/category/science/latest/rss"
        ],
        "Business": [
            "https://www.cnbc.com/id/100003114/device/rss/rss.html",
            "https://www.ft.com/?format=rss",
            "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"
        ],
        "Sports": [
            "http://feeds.bbci.co.uk/sport/rss.xml",
            "https://www.espn.com/espn/rss/news",
            "https://www.aljazeera.com/xml/rss/sports.xml"
        ],
        "Entertainment": [
            "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
            "https://www.hollywoodreporter.com/feed/",
            "https://variety.com/feed/"
        ]
    }
}

# Alias mapping to ensure requests for "Finance" catch the "Business" feeds perfectly
NEWS_FEEDS["India"]["Finance"] = NEWS_FEEDS["India"]["Business"]
NEWS_FEEDS["World"]["Finance"] = NEWS_FEEDS["World"]["Business"]

GLOBAL_BLOCKS = ["murder", "rape", "assault", "arrest", "criminal", "custody", "bail", "accident", "deadly", "robbery"]

def clean_text(text):
    return BeautifulSoup(html.unescape(text), "html.parser").get_text().strip()

def fetch_news(region="India", category="All", limit=35):
    all_articles = []
    time_threshold = datetime.utcnow() - timedelta(hours=72)
    seen_titles = set()

    try:
        feeds = NEWS_FEEDS[region][category]
    except KeyError:
        feeds = NEWS_FEEDS[region]["All"]

    for url in feeds:
        try:
            feed = feedparser.parse(url)
            # Shuffle raw feed entries instantly so the layout changes on every refresh
            entries = feed.entries[:25]
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

                # Drop severe negative news blocks
                if any(block in text_to_check for block in GLOBAL_BLOCKS):
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