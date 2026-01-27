import requests
from bs4 import BeautifulSoup
import json

def get_tiktok_data(url):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    
    script = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
    if not script:
        return {"error": "Could not find data blob"}
        
    data = json.loads(script.string)
    # The path to views in the JSON can be deep
    video_data = data["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
    
    return {
        "views": video_data["stats"]["playCount"],
        "likes": video_data["stats"]["diggCount"],
        "author": video_data["author"]["uniqueId"]
    }

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