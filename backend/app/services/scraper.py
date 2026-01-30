
import json
import logging
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_tiktok_data(video_url: str):
    """
    Scrapes TikTok data using Playwright with Stealth.
    Returns a dictionary with {views, likes, author, error}.
    """
    logger.info(f"Starting scrape for: {video_url}")
    
    async with async_playwright() as p:
        # Launch browser (headless=True for production)
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        )
        
        try:
            # Mobile Emulation (iPhone 12)
            device = p.devices['iPhone 12']
            context = await browser.new_context(
                **device,
                locale="en-US",
                timezone_id="America/New_York",
                extra_http_headers={
                    "Referer": "https://www.tiktok.com/",
                }
            )
            
            # Apply stealth
            page = await context.new_page()
            stealth = Stealth()
            await stealth.apply_stealth_async(page)
            
            # Navigate
            await page.goto(video_url, timeout=45000, wait_until='networkidle')
            
            # Wait a bit for dynamic content (hydration)
            await page.wait_for_timeout(5000)
            
            # Strategy 1: Universal Data Script (JSON)
            data = await extract_from_script_tag(page)
            if data:
                logger.info("Successfully extracted data from Script Tag")
                return data
                
            # Strategy 2: Open Graph Meta Tags (Fallback)
            data = await extract_from_meta_tags(page)
            if data:
                logger.info("Successfully extracted data from Meta Tags")
                return data
                
            # Strategy 3: Visual Selectors (Last resort)
            # (Note: TikTok class names are obfuscated/dynamic, heavily reliant on data-e2e)
            data = await extract_from_dom(page)
            if data:
                logger.info("Successfully extracted data from DOM")
                return data

            # Debug: Save content
            content = await page.content()
            with open("debug_failed_scrape.html", "w") as f:
                f.write(content)
            logger.info("Saved debug_failed_scrape.html")

            return {"error": "Could not extract video data (all strategies failed)"}

        except Exception as e:
            logger.error(f"Scraping error: {str(e)}")
            return {"error": f"Scraping failed: {str(e)}"}
            
        finally:
            await browser.close()

async def extract_from_script_tag(page):
    try:
        # Locate the hydration script
        element = await page.query_selector('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"]')
        if not element:
            return None
            
        content = await element.inner_text()
        if not content:
            return None
            
        json_data = json.loads(content)
        default_scope = json_data.get("__DEFAULT_SCOPE__", {})
        
        # Check for video detail
        video_detail = default_scope.get("webapp.video-detail", {})
        
        # Check if video is valid
        if video_detail.get("statusCode", 0) != 0:
             # Look for itemStruct in deeper paths if status is weird but data exists
             pass

        item_struct = video_detail.get("itemInfo", {}).get("itemStruct")
        
        # Alternative path seen in some dumps
        if not item_struct and "itemStruct" in video_detail:
            item_struct = video_detail["itemStruct"]
            
        if item_struct:
            stats = item_struct.get("stats", {})
            author = item_struct.get("author", {})
            return {
                "views": int(stats.get("playCount", 0)),
                "likes": int(stats.get("diggCount", 0)),
                "author": author.get("uniqueId", ""),
                "video_url": f"https://www.tiktok.com/@{author.get('uniqueId')}/video/{item_struct.get('id')}"
            }
            
    except Exception as e:
        logger.warning(f"Script tag extraction failed: {e}")
    return None

async def extract_from_meta_tags(page):
    try:
        # Views/Likes aren't usually in OG tags, but Author and Desc are.
        # Sometimes description contains "X Likes, Y Comments"
        desc_handle = await page.query_selector('meta[name="description"]')
        if desc_handle:
            content = await desc_handle.get_attribute("content")
            if content:
                # content format example: "1.2M Likes, 500 Comments. TikTok video from User (@user)..."
                import re
                likes_match = re.search(r"([\d\.]+[KMB]?) Likes", content)
                views_match = re.search(r"([\d\.]+[KMB]?) Views", content) # Rare in meta
                
                # If we can parse likes, it's better than nothing
                return {
                    "likes": parse_count_str(likes_match.group(1)) if likes_match else 0,
                    "views": 0, # Cannot reliably get views from meta
                    "author": "unknown", # Parse from content if needed
                    "note": "Data from Meta Tags (imprecise)"
                }
    except Exception:
        pass
    return None

async def extract_from_dom(page):
    try:
        # Try specific data-e2e attributes often used by TikTok test suites
        like_count = await page.eval_on_selector('[data-e2e="like-count"]', 'el => el.innerText')
        comment_count = await page.eval_on_selector('[data-e2e="comment-count"]', 'el => el.innerText')
        share_count = await page.eval_on_selector('[data-e2e="share-count"]', 'el => el.innerText')
        username = await page.eval_on_selector('[data-e2e="browse-username"]', 'el => el.innerText')
        
        if like_count:
            return {
                "likes": parse_count_str(like_count),
                "views": 0, # Views often not shown on desktop detail page overlay clearly
                "author": username,
                "note": "Data from DOM"
            }
    except Exception as e:
        logger.warning(f"DOM extraction failed: {e}")
    return None

def parse_count_str(s):
    if not s: return 0
    s = s.upper().replace(',', '')
    multiplier = 1
    if 'K' in s:
        multiplier = 1000
        s = s.replace('K', '')
    elif 'M' in s:
        multiplier = 1000000
        s = s.replace('M', '')
    elif 'B' in s:
        multiplier = 1000000000
        s = s.replace('B', '')
        
    try:
        return int(float(s) * multiplier)
    except:
        return 0