import feedparser
import html
from datetime import datetime, timedelta
from newspaper import Article

# ---------------- STRATIFIED REGIONAL RSS ENGINE ---------------- #
NEWS_FEEDS = {
    "India": {
        "All": [
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", 
            "https://feeds.feedburner.com/ndtvnews-india-news",             
            "https://www.thehindu.com/news/national/feeder/default.rss",    
            "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
            "https://www.moneycontrol.com/rss/business.xml",
            "https://economictimes.indiatimes.com/rssfeedsdefault.cms"
        ],
        "Politics": [
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://indianexpress.com/section/political-pulse/feed/"
        ],
        "Technology": [
            "https://yourstory.com/feed",
            "https://analyticsindiamag.com/feed/",
            "https://gadgets360.com/rss/feeds"
        ],
        "Finance": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
            "https://www.livemint.com/rss/markets"
        ],
        "Sports": [
            "https://www.cricbuzz.com/rss-feeds/news",
            "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
            "https://indianexpress.com/section/sports/feed/"
        ],
        "Entertainment": [
            "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
            "https://indianexpress.com/section/entertainment/feed/"
        ]
    },
    "World": {
        "All": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://www.channelnewsasia.com/rssfeed/cna_international_3856.xml",
            "http://feeds.bbci.co.uk/news/world/rss.xml",
            "https://rss.cnn.com/rss/edition.rss",
            "https://www.theguardian.com/world/rss"
        ],
        "Politics": [
            "https://www.aljazeera.com/xml/rss/all.xml",
            "http://feeds.bbci.co.uk/news/politics/rss.xml",
            "https://www.france24.com/en/europe/rss"
        ],
        "Technology": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
            "https://www.channelnewsasia.com/rssfeed/cna_technology_4016.xml"
        ],
        "Finance": [
            "https://www.cnbc.com/id/100003114/device/rss/rss.html",
            "https://www.channelnewsasia.com/rssfeed/cna_business_3911.xml",
            "https://www.ft.com/?format=rss"
        ],
        "Sports": [
            "http://feeds.bbci.co.uk/sport/rss.xml",
            "https://www.espn.com/espn/rss/news",
            "https://www.aljazeera.com/xml/rss/sport.xml"
        ],
        "Entertainment": [
            "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
            "https://www.reutersagency.com/feed/?best-topics=entertainment"
        ]
    }
}

CATEGORY_KEYWORDS = {
    "Politics": ["election", "government", "minister", "parliament", "policy", "politics", "modi", "biden", "trump", "bjp", "congress", "court", "summit", "pm ", "president", "cabinet", "mla ", "mp "],
    "Technology": ["technology", "AI", "startup", "software", "OpenAI", "Google", "Microsoft", "Apple", "robot", "cyber", "phone", "meta", "nvidia", "chip", "gadget", "semiconductor"],
    "Finance": ["market", "stock", "finance", "economy", "business", "investment", "bank", "RBI", "crypto", "shares", "Sensex", "Nifty", "profit", "revenue", "gdp", "inflation", "funding"],
    "Sports": ["cricket", "ipl", "football", "match", "player", "team", "tournament", "goal", "sports", "bcci", "stadium", "score", "run", "wicket", "trophy", "t20", "fifa", "premier league"],
    "Entertainment": ["movie", "actor", "film", "bollywood", "hollywood", "celebrity", "music", "show", "series", "netflix", "cinema", "director", "oscar", "box office", "starring"]
}

AGGREGATOR_BANNED_WORDS = ["roundup", "round-up", "briefing", "news wrap", "top headlines", "things to know", "live updates", "daily digest", "top stories"]

# 🔥 RESUME ENGINEERING FEATURE: Explicit geo-tagging validation array to stop feed bleed-through
GEO_INDIAN_KEYWORDS = [
    "india", "delhi", "mumbai", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata", "modi", "isro", 
    "rbi", "supreme court", "bjp", "congress", "sensex", "nifty", "gandhi", "bcci", "amit shah", "mla", "mp"
]

def fetch_news(region="India", category="All"):
    all_articles = []
    time_threshold = datetime.utcnow() - timedelta(hours=48)

    try:
        feeds = NEWS_FEEDS[region][category]
    except KeyError:
        feeds = NEWS_FEEDS[region]["All"]

    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                raw_title = entry.get("title", "")
                summary = entry.get("summary", "")
                
                title = html.unescape(raw_title).strip()
                if not title or len(title.split()) < 4:
                    continue
                
                title_lower = title.lower()
                if any(banned in title_lower for banned in AGGREGATOR_BANNED_WORDS):
                    continue

                pub_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
                if pub_parsed:
                    pub_datetime = datetime(*pub_parsed[:6])
                    if pub_datetime < time_threshold:
                        continue 
                
                text_to_check = (title_lower + " " + summary.lower())
                
                # 🔥 STRICT LEAK FIX: If region is India, validate that it belongs to an domestic topic map
                if region == "India":
                    if not any(geo_word in text_to_check for geo_word in GEO_INDIAN_KEYWORDS):
                        continue  # Silently skip international syndicate leaks

                if category != "All":
                    keywords = CATEGORY_KEYWORDS.get(category, [])
                    if not any(keyword.lower() in text_to_check for keyword in keywords):
                        continue 

                article = {
                    "source": feed.feed.get("title", "Breaking News Engine"),
                    "title": title,
                    "summary": html.unescape(summary),
                    "link": entry.get("link", "")
                }
                
                if not any(a["link"] == article["link"] for a in all_articles):
                    all_articles.append(article)
        except Exception:
            pass
            
    return all_articles

def extract_full_article(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except Exception:
        return ""