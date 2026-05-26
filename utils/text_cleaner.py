import re
from bs4 import BeautifulSoup
from html import unescape


def clean_article_text(raw_html):
    """
    Cleans extracted article text before sending to AI models.
    Preserves your original logic while improving readability.
    """

    if not raw_html:
        return ""

    try:
        # Remove HTML tags
        soup = BeautifulSoup(raw_html, "html.parser")
        text = soup.get_text(separator=" ")

        # Decode HTML entities (&amp;, &quot;, etc.)
        text = unescape(text)

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text)

        # Remove unnecessary repeated newlines/spaces
        text = text.strip()

        return text

    except Exception as e:
        print(f"[Text Cleaner Error] {e}")
        return raw_html