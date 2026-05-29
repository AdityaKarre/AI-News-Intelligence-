import feedparser
import requests
import time
import random
import re
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime, timedelta

# ─────────────────────────────────────────────────────────────────────────────
# HIGH-PRECISION SECTOR MARKS (FLEXIBLE VARIATION MATCHING)
# ─────────────────────────────────────────────────────────────────────────────
VALIDATION_KEYWORDS = {
    "Technology": [
        "tech", "softwar", "hardwar", "app", "smartphon", "phon", "laptop", "comput", "chip", 
        "semiconductor", "ai", "artificial", "cyber", "hack", "cloud", "5g", "internet", "wifi", 
        "satellit", "robot", "drone", "ev", "electr", "cod", "develop", "program", "api", 
        "google", "apple", "microsoft", "amazon", "meta", "openai", "tesla", "nvidia", "intel", 
        "samsung", "qualcomm", "amd", "gadget", "devic", "wearabl", "tablet", "launch", "processor", 
        "iphone", "android", "pixel", "galaxy", "oneplus", "display", "server"
    ],
    "Business": [
        "market", "stock", "share", "econom", "gdp", "inflat", "budget", "trade", "export", 
        "import", "revenu", "profit", "loss", "earn", "invest", "fund", "ipo", "startup", 
        "compani", "corporat", "industri", "sector", "bank", "financ", "tax", "rupee", "dollar", 
        "sensex", "nifty", "bse", "nse", "rbi", "merger", "acquisit", "deal", "billion", "million", 
        "commerc", "retail", "ecommerce", "sale", "brand", "price", "firm"
    ],
    "Sports": [
        "cricket", "footbal", "soccer", "tenni", "basketbal", "hockey", "rugby", "golf", 
        "athlet", "olympic", "ipl", "bcci", "fifa", "match", "tournament", "championship", 
        "leagu", "cup", "trophi", "player", "team", "coach", "squad", "inn", "wicket", "run", 
        "goal", "score", "fixtur", "seri", "stadium", "transfer", "debut", "win", "won", "lost"
    ],
    "Entertainment": [
        "movi", "film", "cinema", "bollywood", "hollywood", "seri", "show", "tv", "ott", 
        "netflix", "prime", "disney", "hotstar", "song", "music", "album", "artist", "singer", 
        "actor", "actress", "celebrity", "star", "award", "oscar", "grammy", "filmfare", "releas", 
        "trailer", "review", "box", "offic", "stream", "entertain", "concert", "tour", "fashion", "theatr"
    ],
    "Politics": [
        "govern", "parliament", "minist", "presid", "elect", "vote", "parti", "congress", 
        "bjp", "lok", "sabha", "rajya", "polici", "law", "bill", "act", "constitut", "court", 
        "suprem", "diplomat", "protest", "opposit", "politici", "governanc", "administrat", 
        "campaign", "ralli", "coalit", "modi", "rahul", "shah", "cm", "pm", "resign"
    ]
}

GLOBAL_GENERAL_BLOCKS = [
    "murder", "rape", "assault", "arrest", "criminal", "custody", "bail", "accident", "highway", 
    "deadly", "weather alert", "robbery", "theft", "stray dog"
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
            "https://feeds.feedburner.com/ndtricinfo",
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
]

def clean_title(title: str) -> str:
    for suffix in TITLE_SUFFIXES:
        title = title.replace(suffix, "")
    return title.strip()

def fetch_news(region="India", category="All", limit=35):
    articles = []
    seen_titles = set()

    # Base targets setup
    category_feeds = RSS_FEEDS.get(region, {}).get(category, [])
    general_feeds = RSS_FEEDS.get(region, {}).get("All", [])

    # Pool strategy: Combine dedicated niche streams with general news tickers
    feed_registry = []
    for url in category_feeds:
        feed_registry.append((url, True)) # True = Pure Dedicated Feed
    
    if category != "All":
        for url in general_feeds:
            if url not in category_feeds:
                feed_registry.append((url, False)) # False = Mainstream Wire Feed

    time_threshold = datetime.utcnow() - timedelta(hours=96)

    for url, is_dedicated in feed_registry:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
            resp = requests.get(url, timeout=8, headers=headers)
            if resp.status_code != 200:
                continue
            
            feed = feedparser.parse(resp.content)
            if not feed.entries:
                continue

            raw_entries = feed.entries[:35]
            random.shuffle(raw_entries)

            for entry in raw_entries:
                try:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])

                    if published and published < time_threshold:
                        continue

                    title = entry.get("title", "").strip()
                    if not title or title.lower() == "no title":
                        continue

                    title = clean_title(title)
                    title_key = title.lower()

                    if title_key in seen_titles:
                        continue

                    link = entry.get("link", "")
                    summary = entry.get("summary", "")
                    summary = BeautifulSoup(summary, "html.parser").get_text().strip()
                    combined_text = f"{title} {summary}".lower()

                    # 1. Global Noise Safety Block Check
                    if any(bw in combined_text for bw in GLOBAL_GENERAL_BLOCKS):
                        continue

                    # 2. Feed-Type Intelligent Categorization Logic
                    if category != "All":
                        keywords = VALIDATION_KEYWORDS.get(category, [])
                        has_keyword = any(kw in combined_text for kw in keywords)
                        
                        if is_dedicated:
                            # Niche feeds are auto-approved. Only drop if explicitly hijacked by a different sector
                            opposite_sectors = [k for k in VALIDATION_KEYWORDS.keys() if k != category]
                            hijacked = False
                            if not has_keyword:
                                for sector in opposite_sectors:
                                    sector_score = sum(1 for skw in VALIDATION_KEYWORDS[sector] if skw in combined_text)
                                    if sector_score >= 2: # Heavy leak signature found
                                        hijacked = True
                                        break
                            if hijacked:
                                continue
                        else:
                            # General wire items MUST hit thematic keywords to be included
                            if not has_keyword:
                                continue

                    seen_titles.add(title_key)
                    raw_source = feed.feed.title if hasattr(feed, "feed") and hasattr(feed.feed, "title") else "Unknown"

                    articles.append({
                        "title": title,
                        "description": summary[:250],
                        "summary": summary,
                        "link": link,
                        "source": raw_source.strip(),
                        "region": region,
                        "category": category,
                        "time": published.strftime("%b %d, %Y") if published else "Latest"
                    })
                except Exception:
                    continue
        except Exception:
            continue

    random.shuffle(articles)
    return articles[:limit]

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