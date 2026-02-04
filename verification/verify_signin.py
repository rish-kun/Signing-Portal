from playwright.sync_api import sync_playwright

def verify_signin_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the signin page
            page.goto("http://localhost:5173/signin")

            # Wait for the page to load
            page.wait_for_selector("text=Welcome Back", timeout=10000)

            # Take a screenshot
            page.screenshot(path="verification/signin_verification.png")
            print("Screenshot taken successfully")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_signin_page()
