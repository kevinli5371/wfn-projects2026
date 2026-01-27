import sys
import time
import csv
import json
import pandas as pd
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

def scrape_tiktok_video(video_url, output_file="tiktok_data.csv"):
    """
    Scrapes view count and like count from a single TikTok video.
    
    Args:
        video_url (str): The full TikTok video URL.
        output_file (str): The path to save the CSV file.
    """
    
    print(f"Starting scrape for {video_url}...")
    
    data = []
    
    with sync_playwright() as p:
        # Launch Chromium in non-headless mode
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"] # Basic evasion
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
        )
        
        page = context.new_page()
        
        # Apply stealth
        stealth = Stealth()
        stealth.apply_stealth_sync(page)
        
        try:
            print(f"Navigating to {video_url}...")
            page.goto(video_url, timeout=60000)
            
            # Wait for meaningful content
            page.wait_for_timeout(5000)
            
            view_count = "N/A"
            like_count = "N/A"
            
            # Application State Extraction (Most reliable)
            try:
                # content = page.content() # If we needed full HTML
                # Find the hydration script
                script_handle = page.query_selector('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"]')
                if script_handle:
                    json_text = script_handle.inner_text()
                    data_json = json.loads(json_text)
                    
                    # Traverse JSON to find video stats
                    # Structure usually: __DEFAULT_SCOPE__ -> webapp.video-detail -> itemInfo -> itemStruct
                    default_scope = data_json.get("__DEFAULT_SCOPE__", {})
                    video_detail = default_scope.get("webapp.video-detail", {})
                    item_info = video_detail.get("itemInfo", {})
                    item_struct = item_info.get("itemStruct", {})
                    
                    if item_struct:
                        stats = item_struct.get("stats", {})
                        view_count = stats.get("playCount", "N/A")
                        like_count = stats.get("diggCount", "N/A")
                        print(f"Extracted from JSON - Views: {view_count}, Likes: {like_count}")
                    else:
                        print("JSON found but itemStruct is empty or different structure.")
                else:
                    print("Hydration script not found.")
            except Exception as json_e:
                print(f"JSON extraction failed: {json_e}")

            # Fallback to selectors if JSON failed (or if we want to double check)
            if view_count == "N/A" or like_count == "N/A":
                try:
                    # Like Count
                    like_el = page.query_selector('[data-e2e="like-count"]')
                    if like_el:
                        like_count = like_el.inner_text()
                    
                    # View Count - Try generic search if specific selector fails
                    # Sometimes it's in a shared container with Strong tag?
                    # Let's try looking for the number format?
                    pass 
                except Exception as sel_e:
                    print(f"Selector extraction failed: {sel_e}")
            
            data.append({
                "Video URL": video_url,
                "View Count": view_count,
                "Like Count": like_count
            })
                    
        except Exception as e:
            print(f"An error occurred during scraping: {e}")
        finally:
            print("Closing browser...")
            browser.close()
            
    # Export to CSV
    if data:
        df = pd.DataFrame(data)
        print("Extracted Data:")
        print(df.head())
        # Use tab separator for better readability/clickability
        df.to_csv(output_file, index=False, sep='\t', quoting=csv.QUOTE_MINIMAL)
        print(f"Data saved to {output_file}")
    else:
        print("No data extracted.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_url = sys.argv[1]
        scrape_tiktok_video(video_url)
    else:
        print("Usage: python tiktok_profile_scraper.py <video_url>")
