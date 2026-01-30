
import asyncio
from app.services.scraper import get_tiktok_data

# URL that was previously failing
TEST_URL = "https://www.tiktok.com/@bellapoarch/video/6862153058223193350"

async def main():
    print(f"Testing Scraper on: {TEST_URL}")
    data = await get_tiktok_data(TEST_URL)
    print("\n--- Result ---")
    print(data)

if __name__ == "__main__":
    asyncio.run(main())
