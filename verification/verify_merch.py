from playwright.sync_api import sync_playwright
import datetime

def verify_merch_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set mock tokens
        expiry = (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat()

        page.goto("http://localhost:5173/signin")

        page.evaluate(f"""() => {{
            localStorage.setItem("accessToken", "fake-token");
            localStorage.setItem("refreshToken", "fake-refresh-token");
            localStorage.setItem("accessTokenExpiry", "{expiry}");
            localStorage.setItem("refreshTokenExpiry", "{expiry}");
            localStorage.setItem("username", "Test User");
        }}""")

        # Navigate to home
        page.goto("http://localhost:5173/")

        # Wait a bit for things to render (even if error)
        page.wait_for_timeout(2000)

        # Take screenshot
        page.screenshot(path="verification/merch_verification.png")
        print("Screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_merch_page()
