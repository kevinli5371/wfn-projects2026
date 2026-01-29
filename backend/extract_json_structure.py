
import sys
import json
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

TEST_URL = "https://www.tiktok.com/@bellapoarch/video/6862153058223193350"

def dump_json_structure():
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
        
        # Try finding __UNIVERSAL_DATA_FOR_REHYDRATION__
        script = page.query_selector('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"]')
        if script:
            print("Found __UNIVERSAL_DATA_FOR_REHYDRATION__")
            content = script.inner_text()
            with open("debug_universal_data.json", "w") as f:
                f.write(content)
            print("Saved to debug_universal_data.json")
        else:
            print("__UNIVERSAL_DATA_FOR_REHYDRATION__ not found")

        # Try finding __SIGI_STATE__ (another common one)
        script_sigi = page.query_selector('script[id="__SIGI_STATE__"]')
        if script_sigi:
            print("Found __SIGI_STATE__")
            content = script_sigi.inner_text()
            with open("debug_sigi_state.json", "w") as f:
                f.write(content)
            print("Saved to debug_sigi_state.json")
        else:
            print("__SIGI_STATE__ not found")
            
        browser.close()

if __name__ == "__main__":
    dump_json_structure()
