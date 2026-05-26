import re

# ---------------- CLEAN RAW ARTICLE TEXT ---------------- #
def clean_article_text(text: str) -> str:
    """
    Strips boilerplate noise from scraped article text:
    - Removes HTML tags
    - Collapses excess whitespace
    - Removes common scraper artefacts (cookie banners, share prompts, etc.)
    """
    if not text:
        return ""

    # Remove HTML entities and tags (newspaper3k usually handles this but be safe)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-zA-Z]+;", " ", text)

    # Remove common scraper noise phrases
    noise_patterns = [
        r"(?i)subscribe(d)? (to|for).*",
        r"(?i)sign(ing)? up.*newsletter.*",
        r"(?i)cookie(s)? policy.*",
        r"(?i)accept (all )?cookies.*",
        r"(?i)follow us on (twitter|instagram|facebook|youtube|linkedin).*",
        r"(?i)share this (article|story|post).*",
        r"(?i)click here to.*",
        r"(?i)read (more|also)[:\-].*",
        r"(?i)advertisement\s*",
        r"(?i)sponsored content\s*",
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, " ", text)

    # Collapse multiple spaces / newlines
    text = re.sub(r"\s{2,}", " ", text)
    text = text.strip()

    return text


# ---------------- FILTER CONTENT RELEVANT TO TITLE ---------------- #
def filter_relevant_content(title: str, text: str, max_chars: int = 3000) -> str:
    """
    Keeps the portion of the article most relevant to the headline.
    Simple heuristic: score each sentence by keyword overlap with the title,
    return the top-scoring sentences up to max_chars.
    Falls back to plain truncation if scoring yields nothing useful.
    """
    if not text:
        return ""

    # Extract meaningful keywords from the title (len > 3)
    title_words = set(
        w.lower() for w in re.findall(r"\b\w+\b", title) if len(w) > 3
    )

    # Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)

    if not sentences:
        return text[:max_chars]

    # Score each sentence
    scored = []
    for sent in sentences:
        sent_words = set(w.lower() for w in re.findall(r"\b\w+\b", sent))
        overlap = len(title_words & sent_words)
        scored.append((overlap, sent))

    # Sort by score descending, preserve enough content
    scored.sort(key=lambda x: x[0], reverse=True)

    selected = []
    total = 0
    for _, sent in scored:
        if total + len(sent) > max_chars:
            break
        selected.append(sent)
        total += len(sent) + 1

    # If scoring picked nothing, fall back to raw truncation
    if not selected:
        return text[:max_chars]

    # Re-join in original order for coherent reading
    selected_set = set(selected)
    ordered = [s for s in sentences if s in selected_set]
    result = " ".join(ordered)

    return result[:max_chars]