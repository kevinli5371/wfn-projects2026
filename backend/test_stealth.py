import asyncio
from playwright.async_api import async_playwright
try:
    from playwright_stealth import Stealth
except ImportError:
    # Fallback or handle difference
    print("Could not import Stealth. Checking structure...")
    import playwright_stealth
    print(dir(playwright_stealth))
    exit(1)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        stealth = Stealth()
        print("Applying stealth...")
        await stealth.apply_stealth_async(page)
        print("Stealth applied.")
        
        await page.goto("https://bot.sannysoft.com/")
        await page.screenshot(path="stealth_check.png")
        print("Screenshot taken.")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
