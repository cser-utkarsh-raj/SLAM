"""
AutoJob Python Engine - Main Autonomous Runner & Copilot CLI
"""
import os
import sys
import asyncio
import random
from typing import Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from playwright.async_api import async_playwright

from .config import CandidateProfile, BotConfig, DEFAULT_CANDIDATE, DEFAULT_CONFIG
from .ai_tailor import GeminiTailorEngine
from .stealth_browser import StealthBrowserManager
from .form_wizard import FormWizardTraverser

console = Console()

class AutoJobOrchestrator:
    def __init__(self, config: BotConfig = DEFAULT_CONFIG, candidate: CandidateProfile = DEFAULT_CANDIDATE):
        self.config = config
        self.candidate = candidate
        self.ai = GeminiTailorEngine()
        self.browser_manager = StealthBrowserManager(self.config)

    async def execute_search_and_apply(self, search_url: str):
        console.print(Panel.fit(
            "[bold yellow]AUTOJOB PYTHON ENGINE v2.6[/bold yellow]\n"
            f"[dim]Candidate:[/dim] [white]{self.candidate.full_name}[/white] | [dim]Mode:[/dim] [green]{'Copilot (Safe)' if self.config.copilot_mode else 'Autonomous'}[/green]",
            border_style="yellow"
        ))

        async with async_playwright() as p:
            console.print("[cyan]⚙️ Launching persistent stealth browser context...[/cyan]")
            context, page = await self.browser_manager.create_stealth_context(p)

            console.print(f"[cyan]🌐 Navigating to search feed:[/cyan] {search_url}")
            await page.goto(search_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3500)

            # Find Easy Apply jobs
            job_cards = page.locator('.jobs-search-results-list__list-item, .jobsearch-ResultsList > li')
            total_cards = await job_cards.count()
            console.print(f"[green]✓ Found {total_cards} job listings on active search page.[/green]")

            applied_count = 0
            for i in range(min(total_cards, self.config.daily_application_cap)):
                card = job_cards.nth(i)
                await card.scroll_into_view_if_needed()
                await card.click()
                await page.wait_for_timeout(random.uniform(1500, 2500))

                # Extract Job Title & Company
                title_elem = page.locator('.job-details-jobs-unified-top-card__job-title, .jobsearch-JobInfoHeader-title')
                company_elem = page.locator('.job-details-jobs-unified-top-card__company-name, [data-company-name="true"]')
                
                title = await title_elem.text_content() if await title_elem.count() > 0 else "Unknown Title"
                company = await company_elem.text_content() if await company_elem.count() > 0 else "Unknown Company"
                title = title.strip()
                company = company.strip()

                console.print(f"\n[bold white]────────────────────────────────────────────────[/bold white]")
                console.print(f"[yellow]Target [{i+1}/{total_cards}]:[/yellow] [bold]{title}[/bold] @ [cyan]{company}[/cyan]")

                # Check Easy Apply button
                easy_apply_btn = page.locator('button.jobs-apply-button, button:has-text("Easy Apply"), button:has-text("Apply now")')
                if await easy_apply_btn.count() == 0:
                    console.print("[dim]  ↳ Skipped: External company portal redirect (Taleo/Workday).[/dim]")
                    continue

                # Scrape description for Gemini analysis
                desc_elem = page.locator('.jobs-description-content__text, #jobDescriptionText')
                desc_text = await desc_elem.text_content() if await desc_elem.count() > 0 else ""

                console.print("  [cyan]🧠 Passing JD to Gemini for ATS keyword tailoring...[/cyan]")
                analysis = self.ai.analyze_and_tailor(title, desc_text, self.candidate)
                console.print(f"  [green]↳ Role Fit Score: {analysis.match_score}/100[/green] | [dim]Skills: {', '.join(analysis.extracted_tech_stack[:4])}[/dim]")

                if analysis.match_score < self.config.min_match_score:
                    console.print(f"  [dim]↳ Skipped: Fit score below threshold ({self.config.min_match_score}%).[/dim]")
                    continue

                # Launch Modal
                await easy_apply_btn.first.click()
                await page.wait_for_timeout(1500)

                # Traverse form wizard
                wizard = FormWizardTraverser(page, self.ai, self.candidate, self.config)
                result = await wizard.run_wizard()

                if result["status"] == "ready_for_human_review":
                    console.print("  [bold yellow]🔔 COPILOT PAUSE: Form filled automatically. Review in browser window and click Submit![/bold yellow]")
                    if self.config.copilot_mode:
                        # Wait for user input or automatic submit
                        await page.wait_for_timeout(4000)
                    applied_count += 1
                elif result["status"] == "submitted":
                    console.print("  [bold green]✅ Application Successfully Submitted![/bold green]")
                    applied_count += 1

                # Humanized cooldown between applications (15-45s)
                delay = random.uniform(15, 40)
                console.print(f"  [dim]⏳ Humanized cooldown: {delay:.1f}s before next application...[/dim]")
                await asyncio.sleep(delay)

            console.print(f"\n[bold green]🎉 Session Complete: Processed {applied_count} applications safely.[/bold green]")
            await context.close()

if __name__ == "__main__":
    orchestrator = AutoJobOrchestrator()
    # Default target search query
    QUERY = "https://www.linkedin.com/jobs/search/?f_AL=true&f_TPR=r86400&keywords=Python%20Developer&location=Remote"
    asyncio.run(orchestrator.execute_search_and_apply(QUERY))
