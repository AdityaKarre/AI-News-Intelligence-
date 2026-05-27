import feedparser
import requests
import time

from bs4 import BeautifulSoup
from newspaper import Article

from datetime import datetime, timedelta


# ─────────────────────────────────────────────
# RSS FEEDS
# ─────────────────────────────────────────────

RSS_FEEDS = {

    "India": {

        "All": [

            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",

            "https://feeds.feedburner.com/ndtvnews-top-stories",

            "https://indianexpress.com/section/india/feed/",

            "https://www.thehindu.com/news/national/feeder/default.rss"
        ],


        "Technology": [

            "https://feeds.feedburner.com/gadgets360-latest",

            "https://www.livemint.com/rss/technology",

            "https://tech.hindustantimes.com/rss/topnews/rssfeed.xml"
        ],


        "Business": [

            "https://www.moneycontrol.com/rss/business.xml",

            "https://www.livemint.com/rss/markets",

            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        ],


        "Sports": [

            "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",

            "https://sports.yahoo.com/top/rss.xml",

            "https://feeds.bbci.co.uk/sport/rss.xml"
        ],


        "Entertainment": [

            "https://www.bollywoodhungama.com/rss/news.xml",

            "https://www.ndtv.com/entertainment/feed",

            "https://www.billboard.com/feed/"
        ],


        "Politics": [

            "https://indianexpress.com/section/political-pulse/feed/",

            "https://feeds.bbci.co.uk/news/politics/rss.xml",

            "http://rss.cnn.com/rss/cnn_allpolitics.rss"
        ]
    },



    "World": {

        "All": [

            "http://rss.cnn.com/rss/edition.rss",

            "http://feeds.bbci.co.uk/news/rss.xml",

            "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
        ],


        "Technology": [

            "https://techcrunch.com/feed/",

            "https://www.theverge.com/rss/index.xml",

            "https://feeds.arstechnica.com/arstechnica/index"
        ],


        "Business": [

            "https://www.cnbc.com/id/10001147/device/rss/rss.html",

            "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",

            "https://feeds.bbci.co.uk/news/business/rss.xml"
        ],


        "Sports": [

            "https://www.espn.com/espn/rss/news",

            "https://sports.yahoo.com/top/rss.xml",

            "https://feeds.bbci.co.uk/sport/rss.xml"
        ],


        "Entertainment": [

            "https://www.hollywoodreporter.com/feed/",

            "https://www.billboard.com/feed/",

            "https://variety.com/feed/"
        ],


        "Politics": [

            "https://feeds.bbci.co.uk/news/politics/rss.xml",

            "http://rss.cnn.com/rss/cnn_allpolitics.rss",

            "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"
        ]
    }
}

# ─────────────────────────────────────────────
# FETCH NEWS
# ─────────────────────────────────────────────

def fetch_news(region="India", category="All"):

    articles = []

    seen_titles = set()

    feeds = RSS_FEEDS.get(region, {}).get(category, [])

    time_threshold = datetime.utcnow() - timedelta(hours=24)

    for url in feeds:

        try:

            timestamp = int(time.time())

            cache_bust_url = (

                f"{url}&t={timestamp}"

                if "?" in url

                else f"{url}?t={timestamp}"
            )

            feed = feedparser.parse(cache_bust_url)

            entries = feed.entries[:35]

            for entry in entries:

                try:

                    published = None

                    if hasattr(entry, "published_parsed"):

                        published = datetime(
                            *entry.published_parsed[:6]
                        )

                    # Skip old news
                    if published and published < time_threshold:
                        continue

                    title = entry.get("title", "No Title")

                    # Clean title
                    title = title.replace(
                        " - Times of India",
                        ""
                    )

                    title = title.replace(
                        " | CNN",
                        ""
                    )

                    title = title.replace(
                        " - BBC News",
                        ""
                    )

                    title = title.strip()

                    # Duplicate removal
                    title_key = title.lower()

                    if title_key in seen_titles:
                        continue

                    seen_titles.add(title_key)

                    link = entry.get("link", "")

                    summary = entry.get("summary", "")

                    summary = BeautifulSoup(
                        summary,
                        "html.parser"
                    ).get_text()

                    raw_source = (

                        feed.feed.title

                        if hasattr(feed, "feed")
                        and hasattr(feed.feed, "title")

                        else "Unknown"
                    )

                    source = raw_source.strip()

                    article_data = {

                        "title": title,

                        "description": summary[:250],

                        "summary": summary,

                        "link": link,

                        "source": source,

                        "region": region,

                        "category": category,
                    }

                    articles.append(article_data)

                except Exception:
                    continue

        except Exception:
            continue
        
    return articles


# ─────────────────────────────────────────────
# ARTICLE EXTRACTION
# ─────────────────────────────────────────────

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

        return {

            "text": "Unable to fetch article.",

            "authors": [],

            "publish_date": None,

            "top_image": "",
        }