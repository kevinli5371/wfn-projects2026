import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def main():
    async with async_playwright() as p:
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**device, locale="en-US")
        page = await context.new_page()
        
        stealth = Stealth()
        await stealth.apply_stealth_async(page)

        # Intercept responses
        page.on("response", lambda response: print(f"Response: {response.url} {response.status}"))

        await page.goto("https://www.tiktok.com/@bellapoarch/video/6862153058223193350", timeout=45000, wait_until='networkidle')
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
