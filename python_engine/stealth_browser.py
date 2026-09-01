"""
AutoJob Python Engine - Stealth Browser Controller & Persistent Vault
"""
import os
import random
import asyncio
from typing import Optional, Tuple
from playwright.async_api import async_playwright, BrowserContext, Page
from .config import BotConfig, DEFAULT_CONFIG

class StealthBrowserManager:
    def __init__(self, config: BotConfig = DEFAULT_CONFIG):
        self.config = config
        os.makedirs(self.config.user_data_dir, exist_ok=True)

    async def create_stealth_context(self, playwright_instance) -> Tuple[BrowserContext, Page]:
        """
        Launches a persistent Chromium instance with real user-data-dir
        and Chrome DevTools Protocol anti-fingerprinting patches.
        """
        # Command line flags to disable blink automation markers
        args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--start-maximized",
            "--lang=en-US,en"
        ]

        context = await playwright_instance.chromium.launch_persistent_context(
            user_data_dir=self.config.user_data_dir,
            headless=self.config.headless,
            channel="chrome", # Use installed local Chrome for genuine TLS fingerprint
            args=args,
            viewport={"width": 1440, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/128.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="America/Los_Angeles"
        )

        # Apply stealth evasions on every new page/tab
        await context.add_init_script("""
            // Patch webdriver detection flag
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            // Patch chrome runtime
            window.chrome = { runtime: {} };
            // Patch permissions query
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        """)

        page = context.pages[0] if context.pages else await context.new_page()
        return context, page

    async def human_type(self, locator, text: str):
        """Simulates natural human typing with randomized key intervals and pauses."""
        for char in str(text):
            await locator.type(char, delay=random.uniform(self.config.typing_delay_min_ms, self.config.typing_delay_max_ms))
            if random.random() < 0.05: # Simulated micro-pause
                await asyncio.sleep(random.uniform(0.15, 0.4))

    async def human_click(self, page: Page, locator):
        """Scrolls element into view and performs humanized click."""
        await locator.scroll_into_view_if_needed()
        await page.wait_for_timeout(random.uniform(400, 900))
        await locator.click()
