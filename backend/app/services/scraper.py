import json
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync


def get_tiktok_data(url):
    """
    Scrape TikTok video data using Playwright (headless browser).
    Returns dict with views, likes, author, thumbnail — or an error dict.
    """
    print(f"Scraper: Fetching TikTok data for: {url}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                )
            )
            page = context.new_page()

            # Apply stealth to avoid bot detection
            stealth_sync(page)

            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            # Give TikTok time to hydrate client-side data
            page.wait_for_timeout(5000)

            final_url = page.url
            print(f"Scraper: Final URL after navigation: {final_url}")

            # --- Strategy 1: Extract from hydration JSON blob ---
            result = _extract_from_json(page)
            if result:
                browser.close()
                return result

            # --- Strategy 2: CSS selector fallback ---
            result = _extract_from_selectors(page)
            if result:
                browser.close()
                return result

            print("Scraper: All extraction strategies failed.")
            browser.close()
            return {
                "error": "Could not find data blob. TikTok may be blocking the request. "
                         "Try a full tiktok.com URL (not a shortened link)."
            }

    except Exception as e:
        print(f"Scraper error: {e}")
        return {"error": f"Scraper error: {str(e)}"}


def _extract_from_json(page):
    """Try to extract video data from TikTok's hydration script tags."""
    for script_id in ["__UNIVERSAL_DATA_FOR_REHYDRATION__", "SIGI_STATE"]:
        try:
            handle = page.query_selector(f'script[id="{script_id}"]')
            if not handle:
                continue

            json_text = handle.inner_text()
            data = json.loads(json_text)

            # Path 1: __DEFAULT_SCOPE__ structure
            try:
                video_data = data["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
                return _format_video_data(video_data)
            except (KeyError, TypeError):
                pass

            # Path 2: ItemModule structure
            item_module = data.get("ItemModule", {})
            if item_module:
                video_id = list(item_module.keys())[0]
                return _format_video_data(item_module[video_id])

        except Exception as e:
            print(f"Scraper: JSON extraction from {script_id} failed: {e}")
            continue

    return None


def _extract_from_selectors(page):
    """Fallback: extract data from visible DOM elements."""
    try:
        views = 0
        likes = 0
        author = "unknown"

        # Like count
        like_el = page.query_selector('[data-e2e="like-count"]')
        if like_el:
            likes = _parse_abbreviated_count(like_el.inner_text())

        # View count (browse-count or play count in video detail)
        for selector in ['[data-e2e="video-play-count"]', '[data-e2e="browse-video-count"]']:
            view_el = page.query_selector(selector)
            if view_el:
                views = _parse_abbreviated_count(view_el.inner_text())
                break

        # Author from the URL
        current_url = page.url
        if "/@" in current_url:
            author = current_url.split("/@")[1].split("/")[0]

        if views or likes:
            print(f"Scraper: Extracted from selectors - Views: {views}, Likes: {likes}, Author: {author}")
            return {
                "views": views,
                "likes": likes,
                "author": author,
                "thumbnail": "",
            }
    except Exception as e:
        print(f"Scraper: Selector extraction failed: {e}")

    return None


def _format_video_data(video_data):
    """Format the extracted video data into the standard return dict."""
    author_field = video_data.get("author", {})
    if isinstance(author_field, dict):
        author = author_field.get("uniqueId", "unknown")
    else:
        author = author_field or "unknown"

    result = {
        "views": video_data.get("stats", {}).get("playCount", 0),
        "likes": video_data.get("stats", {}).get("diggCount", 0),
        "author": author,
        "thumbnail": video_data.get("video", {}).get("cover", ""),
    }
    print(f"Scraper: Extracted from JSON - Views: {result['views']}, Likes: {result['likes']}, Author: {result['author']}")
    return result


def _parse_abbreviated_count(text):
    """Parse abbreviated counts like '1.2M', '500K', '3.4B' into integers."""
    text = text.strip().upper()
    try:
        if text.endswith("B"):
            return int(float(text[:-1]) * 1_000_000_000)
        elif text.endswith("M"):
            return int(float(text[:-1]) * 1_000_000)
        elif text.endswith("K"):
            return int(float(text[:-1]) * 1_000)
        else:
            return int(text.replace(",", ""))
    except (ValueError, IndexError):
        return 0

def get_insta_data(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        # Give IG a moment to load
        page.wait_for_timeout(3000) 
        
        # This is a common selector for IG view counts, but IG changes these often
        view_text = page.inner_text("span:has-text('views')") 
        
        browser.close()
        return {"views": view_text}