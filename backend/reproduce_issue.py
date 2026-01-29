
import sys
import os
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.scraper import get_tiktok_data
from app.services.tiktok_profile_scraper import scrape_tiktok_video

# Probable valid URL (Zach King's Harry Potter Illusion)
TEST_URL = "https://www.tiktok.com/@zachking/video/6768504823336217862"

print(f"Testing URL: {TEST_URL}")

print("\n--- Testing scraper.py ---")
try:
    data = get_tiktok_data(TEST_URL)
    print("Result:", json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")

print("\n--- Testing tiktok_profile_scraper.py ---")
try:
    # This function writes to a file, let's use a temp file
    scrape_tiktok_video(TEST_URL, output_file="test_scrape.csv")
except Exception as e:
    print(f"Error: {e}")
