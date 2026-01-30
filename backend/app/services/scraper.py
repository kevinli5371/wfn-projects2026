import requests
from bs4 import BeautifulSoup
import json

def get_tiktok_data(url):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        script = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
        if not script:
            print(f"Standard scraping failed for {url}. Attempting Playwright fallback...")
            return get_tiktok_data_playwright(url)
            
        data = json.loads(script.string)
        # The path to views in the JSON can be deep
        item_info = data.get("__DEFAULT_SCOPE__", {}).get("webapp.video-detail", {}).get("itemInfo", {})
        video_data = item_info.get("itemStruct")
        
        if not video_data:
            return get_tiktok_data_playwright(url)
        
        return {
            "views": video_data.get("stats", {}).get("playCount", 0),
            "likes": video_data.get("stats", {}).get("diggCount", 0),
            "author": video_data.get("author", {}).get("uniqueId", "unknown")
        }
    except Exception as e:
        print(f"Error in standard scraper: {e}. Trying Playwright...")
        return get_tiktok_data_playwright(url)

from playwright_stealth import Stealth

def get_tiktok_data_playwright(url):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            Stealth().apply_stealth_sync(page)
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Look for the rehydration script in the page content
            content = page.content()
            soup = BeautifulSoup(content, "html.parser")
            script = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
            
            if not script:
                browser.close()
                return {"error": "TikTok is heavily blocking this request. Please try again in 1 minute."}

            data = json.loads(script.string)
            item_info = data.get("__DEFAULT_SCOPE__", {}).get("webapp.video-detail", {}).get("itemInfo", {})
            video_data = item_info.get("itemStruct")
            
            if not video_data:
                browser.close()
                return {"error": "Could not extract video data from TikTok even with browser simulation."}
            
            res = {
                "views": video_data.get("stats", {}).get("playCount", 0),
                "likes": video_data.get("stats", {}).get("diggCount", 0),
                "author": video_data.get("author", {}).get("uniqueId", "unknown")
            }
            browser.close()
            return res
    except Exception as e:
        return {"error": f"Scraping error (Playwright): {str(e)}"}

from playwright.sync_api import sync_playwright

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