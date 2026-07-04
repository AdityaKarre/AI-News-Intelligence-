import os
import datetime
import json
import time
import re
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymysql
import feedparser
from groq import Groq
from dotenv import load_dotenv

# Load local environment configuration keys
load_dotenv()

app = FastAPI(title="🧠 AI News Intelligence Platform Backend Engine")

# Configure explicit CORS rules to prevent browser fetch rejections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Whitelists your Next.js frontend port explicitly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client connection
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_db_connection():
    # print("===== DATABASE DEBUG =====")
    # print("HOST:", os.environ.get("MYSQLHOST"))
    # print("PORT:", os.environ.get("MYSQLPORT"))
    # print("USER:", os.environ.get("MYSQLUSER"))
    # print("DATABASE:", os.environ.get("MYSQLDATABASE"))
    # print("PASSWORD EXISTS:", bool(os.environ.get("MYSQL_ROOT_PASSWORD")))
    # print("==========================")
    return pymysql.connect(
        host=os.environ.get("MYSQLHOST", "localhost"),
        user=os.environ.get("MYSQLUSER", "root"),
        password=os.environ.get("MYSQL_ROOT_PASSWORD"),
        database=os.environ.get("MYSQLDATABASE", "ai_news_intelligence"),
        port=int(os.environ.get("MYSQLPORT", 3307)),
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl_mode": "VERIFY_IDENTITY"}
    )
# def get_db_connection():
#     return pymysql.connect(
#         host=os.environ.get("DB_HOST", "127.0.0.1"),
#         user=os.environ.get("DB_USER", "root"),
#         password=os.environ.get("DB_PASSWORD"),
#         database=os.environ.get("DB_NAME", "ai_news_intelligence"),
#         port=3307,
#         cursorclass=pymysql.cursors.DictCursor
#     )

BYPASS_CACHE_FOR_DEV = False

FEED_SOURCES = {
    "india": {
    "all": [
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "https://www.thehindu.com/news/national/feeder/default.rss"
    ],

    "technology": [
        "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
        "https://www.thehindu.com/sci-tech/technology/feeder/default.rss"
    ],

    "business": [
        "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
        "https://www.thehindu.com/business/feeder/default.rss"
    ],

    "sports": [
        "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
        "https://www.thehindu.com/sport/feeder/default.rss"
    ],

    "entertainment": [
        "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
        "https://www.thehindu.com/entertainment/feeder/default.rss"
    ],

    "politics": [
        "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
        "https://www.thehindu.com/news/national/feeder/default.rss"
    ]
},
    "world": {
    "all": [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    ],

    "technology": [
        "http://feeds.bbci.co.uk/news/technology/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
    ],

    "business": [
        "http://feeds.bbci.co.uk/news/business/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"
    ],

    "sports": [
        "http://feeds.bbci.co.uk/sport/rss.xml",
        "https://www.espn.com/espn/rss/news"
    ],

    "entertainment": [
        "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml"
    ],

    "politics": [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"
    ]
}
}

def format_ai_field(val):
    if isinstance(val, list):
        return "\n".join([f"• {item}" for item in val])
    if isinstance(val, dict):
        return json.dumps(val)
    return str(val).strip() if val else ""

@app.get("/")
def root():
    return {
        "status": "AI News Intelligence Platform Backend Running"
    }


@app.get("/api/news")
def get_news_stream(
    region: str = "India",
    category: str = "all",
    refresh: bool = False
    ):
    normalized_region = region.lower()
    normalized_category = category.lower()

    start_time = time.time()
    
    print(f"\n⚡ Request received -> Region: [{normalized_region}], Category: [{normalized_category}]")
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 1. PURGE EXPIRED CACHE ENTRIES OLDER THAN 24 HOURS
            cursor.execute("DELETE FROM articles WHERE created_at < NOW() - INTERVAL 1 DAY")
            connection.commit()
            
            # 2. CONSTRUCT EXPLICIT QUERIES FOR TARGETED RETRIEVAL
            if normalized_category == "all":
                db_query = "SELECT * FROM articles WHERE LOWER(region) = %s ORDER BY published_at DESC LIMIT 20"
                query_params = (normalized_region,)
            else:
                db_query = "SELECT * FROM articles WHERE LOWER(region) = %s AND LOWER(category) = %s ORDER BY published_at DESC LIMIT 20"
                query_params = (normalized_region, normalized_category)
                
            cursor.execute(db_query, query_params)
            cached_rows = cursor.fetchall()

            # print(f"⏱ Cache lookup: {time.time() - start_time:.2f} seconds")
            
            if len(cached_rows) >= 0 and not BYPASS_CACHE_FOR_DEV and not refresh:
                print(f"📦 Serving {len(cached_rows)} articles from local database cache.")
                for row in cached_rows:
                    if isinstance(row.get('published_at'), datetime.datetime):
                        row['published_at'] = row['published_at'].isoformat()
                    if isinstance(row.get('created_at'), datetime.datetime):
                        row['created_at'] = row['created_at'].isoformat()
                return {"success": True, "mode": "production_database_cache", "data": cached_rows}
            
            feed_urls = []

            if normalized_category == "all":
                feed_urls = FEED_SOURCES[normalized_region]["all"]
            else:
                feed_urls = FEED_SOURCES[normalized_region].get(
                    normalized_category, []
                )
            
            compiled_raw_headlines = []
            # Desktop User-Agent prevents servers from returning 403 Forbidden script rejections
            browser_headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            for url in feed_urls:
                print(f"\n🔗 Feed: {url}")
                try:
                    response = requests.get(url, headers=browser_headers, timeout=5)
                    if response.status_code == 200:
                        feed_data = feedparser.parse(response.content)
                        print(f"📄 Articles Found: {len(feed_data.entries)}")
                        if feed_data and feed_data.entries:
                            compiled_raw_headlines.extend(feed_data.entries[:10])
                except Exception as err:
                    print(f"⚠️ RSS Fetch skipping: {url} -> {err}")
                    continue
            
            print(f"🔌 Total raw headlines collected from RSS outlets: {len(compiled_raw_headlines)}")
            # print(f"⏱ RSS Fetch Complete: {time.time() - start_time:.2f} seconds")
            recent_articles = []

            for article in compiled_raw_headlines:
                try:
                    if 'published_parsed' in article and article.published_parsed:
                        pub_date = datetime.datetime(*article.published_parsed[:6])

                        # Keep only news from last 24 hours
                        if (datetime.datetime.now() - pub_date).total_seconds() <= 86400:
                            recent_articles.append(article)
                except Exception:
                    continue

            compiled_raw_headlines = recent_articles

            for article in compiled_raw_headlines[:10]:
                print("RSS:", article.get("title", "NO TITLE"))

            print(f"Total RSS articles collected: {len(compiled_raw_headlines)}")
            fresh_headlines = compiled_raw_headlines
            processed_count = 0
            
            # 4. DATA-GROUNDED NLP EXTRACTION LOOP
            for story in fresh_headlines:
                if processed_count >= 30: # Optimal grid volume layout balance
                    break
            
                insert_sql = """
                        REPLACE INTO articles 
                        (title, category, region, url, ai_summary, key_drivers, broader_context, potential_outcomes, ai_insight, published_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                story_title = story.get('title', '')
                story_link = story.get('link', '')
                story_snippet = story.get('summary', story.get('description', story.get('contentSnippet', '')))
                
                if not story_title or not story_link:
                    continue
                    
                if "<" in story_snippet and ">" in story_snippet:
                    story_snippet = re.sub('<[^<]+?>', '', story_snippet)
                
                pub_date = datetime.datetime.now()
                if 'published_parsed' in story and story.published_parsed:
                    pub_date = datetime.datetime(*story.published_parsed[:6])
                
                try:
                    # 🚀 HIGH-FIDELITY PROMPT TEMPLATE WITH FILLER PHRASE BANHAMMER
                    strict_prompt = f"""
                    You are an elite Foreign Correspondent and Senior Editorial Director. Analyze this live wire text stream:
                    Headline: "{story_title}"
                    Source Snippet: "{story_snippet}"
                    
                    CRITICAL ASSIGNMENT:
                    Synthesize this information into a flawless, publication-ready geopolitical and industrial briefing. 

                    🚫 ABSOLUTE PROHIBITIONS ON ROBOTIC AI SPEECH:
                        Return ONLY valid JSON.
                        No markdown.
                        No code blocks.
                        No explanations outside JSON.

                    TASK:
                    Determine the true category ("technology", "business", "sports", "entertainment", or "politics") and place it as a lowercase string inside "assigned_category".

                    Return a JSON object with this exact schema layout:
                    {{
                      "assigned_category": "lowercase label here",
                      "ai_summary": "Write a highly sophisticated executive news summary paragraph of exactly 90 to 120 words. Begin immediately with the active event, data change, or core statement. Ensure it reads with extreme structural flow, factual depth, and pristine editorial tone.",
                      "key_drivers": "Detail the tactical, economic, or logistical drivers pushing this development forward. Launch directly into the active operational or commercial mechanism without any introductory filler words.",
                      "broader_context": "Provide a high-density narrative backstory detailing the immediate real-world context of this event. It must be structured as exactly 3 short, continuous narrative paragraphs. Paragraph 1 captures the active background context of the entities involved, Paragraph 2 details its current real-world significance, and Paragraph 3 maps the immediate logical trajectory. Never include any markdown subheadings, bullet lists, or label tags.",
                      "potential_outcomes": "Outline exactly 2 likely short-term or long-term structural outcomes. Start writing the outcomes directly. Do NOT use bullet points or say 'The outcomes are...'. Make them two highly specific, narrative sentences."
                    }}
                    """
                    
                    # Swapped to llama-3.1-8b-instant to eliminate free-tier Token Rate Limiting issues entirely
                    chat_completion = groq_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[{"role": "user", "content": strict_prompt}],
                        # response_format={"type": "json_object"},
                        temperature=0.1
                    )
                    
                    intelligence_json = json.loads(chat_completion.choices[0].message.content)
                    
                    # Safeguard: Keep specific feeds locked onto their chosen category channel
                    ai_category = str(intelligence_json.get("assigned_category", "politics")).lower().strip()
                    true_category = normalized_category if normalized_category != "all" else ai_category
                    
                    if true_category not in ["technology", "business", "sports", "entertainment", "politics"]:
                        true_category = "politics"

                    print(
                        f"RSS Category: {normalized_category} | "
                        f"AI Category: {ai_category} | "
                        f"Saved As: {true_category}"
                    )
                    
                    ai_summary = format_ai_field(intelligence_json.get("ai_summary", ""))
                    key_drivers = format_ai_field(intelligence_json.get("key_drivers", ""))
                    broader_context = format_ai_field(intelligence_json.get("broader_context", ""))
                    potential_outcomes = format_ai_field(intelligence_json.get("potential_outcomes", ""))
                    
                    
                    cursor.execute(insert_sql, (
                        story_title,
                        true_category,
                        normalized_region,
                        story_link,
                        ai_summary,
                        key_drivers,
                        broader_context,
                        potential_outcomes,
                        '',
                        pub_date
                    ))
                    connection.commit()
                    processed_count += 1
                    print(f"Processed Count: {processed_count}")
                    print(f"✅ Saved & Indexed: {story_title[:45]}... -> [{true_category}]")
                    
                except Exception as loop_error:
                    print("\n========== ERROR ==========")
                    print(story_title)
                    print(loop_error)
                    print("===========================\n")
                    # Fallback when Groq fails
                    try:
                        cursor.execute(insert_sql, (
                            story_title,
                            true_category if 'true_category' in locals() else normalized_category,
                            normalized_region,
                            story_link,
                            story_snippet[:500],  # Use original article snippet as summary
                            "AI analysis temporarily unavailable",
                            "AI analysis temporarily unavailable",
                            "AI analysis temporarily unavailable",
                            "",
                            pub_date
                        ))
                        connection.commit()
                        processed_count += 1
                        print(f"⚠️ Saved article using fallback mode: {story_title[:45]}...")
                    except Exception as db_error:
                        print(f"Fallback save failed: {db_error}")
                    continue

            # print(f"⏱ AI Processing Complete: {time.time() - start_time:.2f} seconds")
            
            # 6. RETRIEVE ALL ACCUMULATED ACCURATE ENTRIES FROM THE TABLE FOR THIS VIEWPORT
            cursor.execute(db_query, query_params)
            final_rows = cursor.fetchall()
            print(f"📊 Sending {len(final_rows)} valid rows up to client screen layout.\n")
            
            for row in final_rows:
                if isinstance(row.get('published_at'), datetime.datetime):
                    row['published_at'] = row['published_at'].isoformat()
                if isinstance(row.get('created_at'), datetime.datetime):
                    row['created_at'] = row['created_at'].isoformat()
                    
                # print(f"⏱ TOTAL REQUEST TIME: {time.time() - start_time:.2f} seconds")
            return {"success": True, "mode": "groq_70b_live_fetch", "data": final_rows}
            
    finally:
        connection.close()