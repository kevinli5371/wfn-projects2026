import requests
import time

BASE_URL = "http://localhost:8000"

def test_flow():
    # 1. Scrape a video
    print("--- Testing Scrape ---")
    scrape_resp = requests.post(f"{BASE_URL}/api/scrape", json={
        "video_url": "https://www.tiktok.com/@khaby.lame/video/7104618365440707845"
    })
    print(scrape_resp.json())
    asset_id = scrape_resp.json().get("asset_id")
    
    if not asset_id:
        print("Scrape failed, skipping investment")
        return

    # 2. Invest in the video
    print("\n--- Testing Invest ---")
    invest_resp = requests.post(f"{BASE_URL}/api/invest", json={
        "user_id": "test_user_unique",
        "asset_id": asset_id,
        "amount_coins": 50.0
    })
    print(invest_resp.json())

    # 3. Check Portfolio
    print("\n--- Testing Portfolio ---")
    port_resp = requests.get(f"{BASE_URL}/api/portfolio/test_user_unique")
    print(port_resp.json())

    # 4. Check Leaderboard
    print("\n--- Testing Leaderboard ---")
    lead_resp = requests.get(f"{BASE_URL}/api/leaderboard")
    print(lead_resp.json())

if __name__ == "__main__":
    test_flow()
