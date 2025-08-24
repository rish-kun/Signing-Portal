import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the home page
    page.goto("http://localhost:5173/")
    page.screenshot(path="jules-scratch/verification/01_home-page.png")

    # This is a mock login. In a real scenario, you would enter credentials.
    # For this app, we can just navigate to the authenticated routes.
    # We will assume the user is logged in for testing purposes.

    # Navigate to Your Signings
    page.get_by_role("link", name="Your Signings").click()
    expect(page).to_have_url("http://localhost:5173/yoursignings")
    page.screenshot(path="jules-scratch/verification/02_your-signings-page.png")

    # Go back to home and navigate to a prof show
    page.goto("http://localhost:5173/")
    page.get_by_role("button", name="View Details").first.click()
    expect(page).to_have_url(re.compile(r"\/EventDetails\/prof-show\/\d+"))
    page.screenshot(path="jules-scratch/verification/03_prof-show-details-page.png")

    # Go back to home and navigate to an event
    page.goto("http://localhost:5173/")
    page.get_by_role("tab", name="Events").click()
    page.get_by_role("button", name="View Details").first.click()
    expect(page).to_have_url(re.compile(r"\/EventDetails\/non-comp\/\d+"))
    page.screenshot(path="jules-scratch/verification/04_event-details-page.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
