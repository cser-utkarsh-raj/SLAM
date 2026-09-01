"""
AutoJob Python Engine - Dynamic Multi-Step Form Traverser & Wizard Engine
"""
import random
import asyncio
from typing import Dict, Any, List
from playwright.async_api import Page, Locator
from .ai_tailor import GeminiTailorEngine
from .config import CandidateProfile, BotConfig

class FormWizardTraverser:
    def __init__(self, page: Page, ai_engine: GeminiTailorEngine, candidate: CandidateProfile, config: BotConfig):
        self.page = page
        self.ai = ai_engine
        self.candidate = candidate
        self.config = config

    async def fill_current_step_fields(self, modal: Locator) -> List[Dict[str, Any]]:
        """Scans current modal view, identifies all interactive form fields, and fills them."""
        logs = []
        
        # 1. Handle Standard Text & Numeric Inputs
        text_inputs = modal.locator('input[type="text"], input[type="number"], input[type="tel"]')
        input_count = await text_inputs.count()
        
        for i in range(input_count):
            inp = text_inputs.nth(i)
            # Find associated label text
            label = await self._get_associated_label(inp)
            current_val = await inp.input_value()
            
            # If already pre-filled with candidate data, skip
            if current_val and len(current_val.strip()) > 0:
                continue
                
            input_type = await inp.get_attribute("type") or "text"
            answer_res = self.ai.resolve_form_question(label, input_type, self.candidate)
            
            await inp.click()
            await inp.fill("") # Clear
            for char in answer_res.inferred_value:
                await inp.type(char, delay=random.uniform(30, 90))
                
            logs.append({
                "field": label,
                "value": answer_res.inferred_value,
                "knockout": answer_res.is_knockout_risk
            })

        # 2. Handle Radio Buttons & Checkboxes (e.g. Sponsorship, Legal)
        radio_groups = modal.locator('fieldset, .jobs-easy-apply-form-section__grouping')
        group_count = await radio_groups.count()
        for i in range(group_count):
            group = radio_groups.nth(i)
            legend = await group.locator('legend, .artdeco-dropdown__label').text_content() or "Options"
            answer_res = self.ai.resolve_form_question(legend, "radio", self.candidate)
            
            # Target matching radio button
            target_radio = group.locator(f'label:has-text("{answer_res.inferred_value}")')
            if await target_radio.count() > 0:
                await target_radio.first.click()
                logs.append({"field": legend, "value": answer_res.inferred_value, "type": "radio"})

        return logs

    async def _get_associated_label(self, input_element: Locator) -> str:
        """Heuristic to extract field label from DOM hierarchy or ARIA attributes."""
        aria_label = await input_element.get_attribute("aria-label")
        if aria_label:
            return aria_label
            
        inp_id = await input_element.get_attribute("id")
        if inp_id:
            label = self.page.locator(f'label[for="{inp_id}"]')
            if await label.count() > 0:
                return (await label.first.text_content() or "").strip()
                
        # Fallback to parent container text
        parent_text = await input_element.locator('xpath=..').text_content()
        return (parent_text or "Input Field").strip()[:80]

    async def run_wizard(self) -> Dict[str, Any]:
        """Loops through modal wizard pages until final submit screen is reached."""
        modal = self.page.locator('.jobs-easy-apply-modal, [role="dialog"]')
        step_number = 1
        all_logs = []
        
        while step_number <= 7:
            await self.page.wait_for_timeout(random.uniform(1000, 2000))
            
            # Fill inputs on current page
            step_logs = await self.fill_current_step_fields(modal)
            all_logs.extend(step_logs)
            
            # Detect Buttons
            submit_btn = modal.locator('button:has-text("Submit application")')
            review_btn = modal.locator('button:has-text("Review")')
            next_btn = modal.locator('button:has-text("Next")')
            
            if await submit_btn.is_visible():
                if self.config.copilot_mode:
                    return {
                        "status": "ready_for_human_review",
                        "step": step_number,
                        "logs": all_logs,
                        "message": "Modal ready on final submit screen. Human 1-click confirmation required."
                    }
                else:
                    await submit_btn.click()
                    return {"status": "submitted", "step": step_number, "logs": all_logs}
                    
            elif await review_btn.is_visible():
                await review_btn.click()
            elif await next_btn.is_visible():
                await next_btn.click()
            else:
                break
                
            step_number += 1
            
        return {"status": "completed", "steps": step_number, "logs": all_logs}
