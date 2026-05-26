import streamlit as st
import streamlit.components.v1 as components
import random
import uuid

from services.news_service import (
    fetch_news,
    extract_full_article
)

from services.explanation_service import (
    generate_explanation,
    generate_deep_context
)

from utils.text_cleaner import (
    clean_article_text,
    filter_relevant_content
)

# ─────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────

st.set_page_config(
    page_title="AI News Intelligence",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ─────────────────────────────────────────────
# SESSION STORAGE
# ─────────────────────────────────────────────

if "articles" not in st.session_state:
    st.session_state.articles = []

if "refresh_token" not in st.session_state:
    st.session_state.refresh_token = str(uuid.uuid4())

# ─────────────────────────────────────────────
# HARD REFRESH ENGINE
# ─────────────────────────────────────────────

def perform_hard_refresh():

    # REMOVE OLD STATES

    keys_to_remove = []

    for key in st.session_state.keys():

        if (
            key.startswith("summary_")
            or
            key.startswith("context_")
        ):

            keys_to_remove.append(key)

    for key in keys_to_remove:
        del st.session_state[key]

    # NEW REFRESH TOKEN

    st.session_state.refresh_token = str(uuid.uuid4())

    # FETCH ARTICLES

    fresh_articles = fetch_news(
        region=st.session_state.region_selector,
        category=st.session_state.category_selector
    )

    # REMOVE DUPLICATES

    unique_articles = []

    seen_links = set()

    for article in fresh_articles:

        if article["link"] not in seen_links:

            unique_articles.append(article)

            seen_links.add(article["link"])

    # RANDOMIZE SLIGHTLY

    random.shuffle(unique_articles)

    # LIMIT

    st.session_state.articles = unique_articles[:8]

# ─────────────────────────────────────────────
# INITIAL FETCH
# ─────────────────────────────────────────────

if not st.session_state.articles:

    initial_articles = fetch_news(
        region="India",
        category="All"
    )

    random.shuffle(initial_articles)

    st.session_state.articles = initial_articles[:8]

# ─────────────────────────────────────────────
# THEME
# ─────────────────────────────────────────────

BG = "#181825"

CARD_BG = "rgba(36, 33, 58, 0.68)"

CARD_BORDER = "rgba(180, 167, 255, 0.10)"

TEXT = "#F5F3FF"

TEXT_SOFT = "#B7B2D9"

ACCENT = "#B4A7FF"

ACCENT_LIGHT = "#CFC7FF"

SUMMARY_BG = "rgba(56, 50, 84, 0.45)"

CONTEXT_BG = "rgba(48, 44, 76, 0.52)"

SHADOW = "0 6px 24px rgba(0,0,0,0.18)"

# ─────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────

st.markdown(f"""
<style>

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, .stApp {{
    background: {BG};
    color: {TEXT};
    font-family: 'Inter', sans-serif;
}}

#MainMenu, footer, header {{
    visibility: hidden;
}}

[data-testid="stDecoration"] {{
    display: none;
}}

.block-container {{
    max-width: 1180px;
    padding-top: 2rem;
    padding-bottom: 4rem;
}}

.main-title {{
    text-align: center;
    font-size: clamp(2.2rem, 5vw, 3.3rem);
    font-weight: 800;
    margin-bottom: 0.3rem;

    background: linear-gradient(
        135deg,
        {ACCENT},
        {ACCENT_LIGHT}
    );

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}}

.sub-title {{
    text-align: center;
    color: {TEXT_SOFT};
    font-size: 1rem;
    margin-bottom: 2.5rem;
}}

.filter-panel {{
    background: {CARD_BG};
    border: 1px solid {CARD_BORDER};
    backdrop-filter: blur(18px);
    border-radius: 24px;
    padding: 1.2rem;
    margin-bottom: 2rem;
    box-shadow: {SHADOW};
}}

div[data-testid="stExpander"] {{
    background: {CARD_BG} !important;
    border: 1px solid {CARD_BORDER} !important;
    backdrop-filter: blur(16px) !important;
    border-radius: 20px !important;
    margin-bottom: 1.5rem !important;
}}

div[data-testid="stExpander"] summary p {{
    font-size: 1.15rem !important;
    font-weight: 700 !important;
    color: {TEXT} !important;
    line-height: 1.5 !important;
    white-space: normal !important;
}}

.source-badge {{
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.85rem;
    border-radius: 999px;
    background: rgba(180,167,255,0.08);
    color: {ACCENT_LIGHT};
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 1rem;
}}

.summary-box {{
    background: {SUMMARY_BG};
    border: 1px solid rgba(180,167,255,0.08);
    border-radius: 20px;
    padding: 1rem 1.1rem;
    margin-top: 0.8rem;
    margin-bottom: 1rem;
    line-height: 1.85;
    font-size: 0.96rem;
}}

.context-box {{
    background: {CONTEXT_BG};
    border: 1px solid rgba(180,167,255,0.08);
    border-radius: 20px;
    padding: 1rem 1.1rem;
    margin-top: 1rem;
    line-height: 1.9;
    font-size: 0.95rem;
}}

.box-label {{
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 0.6rem;
    color: {ACCENT};
    text-transform: uppercase;
}}

div[data-testid="stButton"] > button {{
    height: 50px;
    border-radius: 16px;
    border: 1px solid rgba(180,167,255,0.10);
    background: rgba(180,167,255,0.06);
    color: #E8E2FF;
    font-weight: 700;
    transition: 0.2s ease;
}}

div[data-testid="stButton"] > button:hover {{
    background: rgba(180,167,255,0.12);
    border-color: rgba(180,167,255,0.18);
    transform: translateY(-1px);
}}

.read-link {{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    border-radius: 16px;
    background: rgba(180,167,255,0.06);
    border: 1px solid rgba(180,167,255,0.10);
    color: #E8E2FF !important;
    text-decoration: none !important;
    font-weight: 700;
}}

@media (max-width: 768px) {{

    div[data-testid="stButton"] > button {{
        height: 46px;
    }}

    .read-link {{
        height: 46px;
    }}
}}

</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────

st.markdown("""
<div id="top"></div>

<div class="main-title">
🧠 AI News Intelligence
</div>

<div class="sub-title">
Real-time News Explained Clearly with AI
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# FILTER PANEL
# ─────────────────────────────────────────────

st.markdown(
    '<div class="filter-panel">',
    unsafe_allow_html=True
)

c1, c2, c3 = st.columns([1.5, 2.2, 1.2])

with c1:

    region = st.segmented_control(
        "🌍 Region",
        options=["India", "World"],
        default="India",
        key="region_selector",
        on_change=perform_hard_refresh
    )

with c2:

    category = st.selectbox(
        "📂 Category",
        [
            "All",
            "Politics",
            "Technology",
            "Finance",
            "Sports",
            "Entertainment"
        ],
        key="category_selector",
        on_change=perform_hard_refresh
    )

with c3:

    st.markdown(
        "<div style='height:28px'></div>",
        unsafe_allow_html=True
    )

    st.button(
        "🔄 Refresh",
        use_container_width=True,
        on_click=perform_hard_refresh
    )

st.markdown("</div>", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# ARTICLE FEED
# ─────────────────────────────────────────────

articles = st.session_state.articles

if not articles:

    st.warning(
        "No fresh articles available currently."
    )

# ─────────────────────────────────────────────
# ARTICLES
# ─────────────────────────────────────────────

for article in articles:

    article_id = (
        article["title"]
        .replace(" ", "_")
        .replace("/", "")
        .replace(":", "")
        [:80]
    )

    summary_key = (
        f"summary_{article_id}_{st.session_state.refresh_token}"
    )

    context_key = (
        f"context_{article_id}_{st.session_state.refresh_token}"
    )

    with st.expander(
        article["title"],
        expanded=False
    ):

        st.markdown(
            f'''
<div class="source-badge">
{article["source"]}
</div>
''',
            unsafe_allow_html=True
        )

        cleaned_text = clean_article_text(
            article["summary"]
        )

        filtered_text = filter_relevant_content(
            article["title"],
            cleaned_text
        )

        # SUMMARY

        if summary_key not in st.session_state:

            with st.spinner(
                "Generating AI summary..."
            ):

                st.session_state[
                    summary_key
                ] = generate_explanation(
                    article["title"],
                    filtered_text
                )

        st.markdown(
            f'''
<div class="summary-box">

<span class="box-label">
✨ AI Summary
</span>

{st.session_state[summary_key]}

</div>
''',
            unsafe_allow_html=True
        )

        # BUTTONS

        col1, col2 = st.columns([1.2, 1.6])

        with col1:

            if st.button(
                "🔍 More Context",
                key=f"context_button_{article_id}_{st.session_state.refresh_token}",
                use_container_width=True
            ):

                if context_key not in st.session_state:

                    with st.spinner(
                        "Generating deep context..."
                    ):

                        full_text = extract_full_article(
                            article["link"]
                        )

                        context_source = (
                            full_text
                            if full_text
                            else article["summary"]
                        )

                        context_cleaned = filter_relevant_content(
                            article["title"],
                            context_source
                        )

                        st.session_state[
                            context_key
                        ] = generate_deep_context(
                            article["title"],
                            context_cleaned
                        )

                    st.rerun()

        with col2:

            st.markdown(
                f'''
<a class="read-link"
href="{article["link"]}"
target="_blank">
📰 Read Original Article
</a>
''',
                unsafe_allow_html=True
            )

        # CONTEXT

        if context_key in st.session_state:

            st.markdown(
                f'''
<div class="context-box">

<span class="box-label">
🌍 Deep Context
</span>

{st.session_state[context_key]}

</div>
''',
                unsafe_allow_html=True
            )

# ─────────────────────────────────────────────
# BACK TO TOP BUTTON
# ─────────────────────────────────────────────

components.html(
    """
<script>

(function () {

    if (
        window.parent.document.getElementById(
            "premiumScrollTopBtn"
        )
    ) return;

    const btn =
        window.parent.document.createElement(
            "button"
        );

    btn.id = "premiumScrollTopBtn";

    btn.innerHTML = "↑";

    btn.style.position = "fixed";
    btn.style.bottom = "24px";
    btn.style.right = "24px";
    btn.style.width = "52px";
    btn.style.height = "52px";
    btn.style.borderRadius = "50%";
    btn.style.border = "none";
    btn.style.background =
        "rgba(180,167,255,0.18)";
    btn.style.backdropFilter = "blur(14px)";
    btn.style.color = "white";
    btn.style.fontSize = "22px";
    btn.style.cursor = "pointer";
    btn.style.zIndex = "999999";
    btn.style.display = "none";

    window.parent.document.body.appendChild(
        btn
    );

    window.parent.addEventListener(
        "scroll",
        function () {

            if (
                window.parent.scrollY > 250
            ) {

                btn.style.display = "flex";

                btn.style.alignItems = "center";

                btn.style.justifyContent = "center";

            } else {

                btn.style.display = "none";
            }
        }
    );

    btn.addEventListener(
        "click",
        function () {

            window.parent.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );

})();

</script>
""",
    height=0
)