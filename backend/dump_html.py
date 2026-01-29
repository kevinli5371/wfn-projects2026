
import sys
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

TEST_URL = "https://www.tiktok.com/@bellapoarch/video/6862153058223193350"

def dump_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
             user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
        )
        page = context.new_page()
        stealth = Stealth()
        stealth.apply_stealth_sync(page)
        
        print(f"Navigating to {TEST_URL}...")
        page.goto(TEST_URL, timeout=60000)
        page.wait_for_timeout(5000)
        
        title = page.title()
        print(f"Page Title: {title}")
        
        content = page.content()
        with open("debug_page.html", "w") as f:
            f.write(content)
        print("Saved debug_page.html")
        
        browser.close()

if __name__ == "__main__":
    dump_html()
