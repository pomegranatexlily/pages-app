import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

SITE = "https://pomegranatexlily.github.io/pages-app/"
OUT = Path("live-report")
OUT.mkdir(exist_ok=True)
report = {"site": SITE, "release": os.environ.get("GITHUB_SHA", ""), "started_at": datetime.now(timezone.utc).isoformat(), "engine": "Chromium", "physical_iphone": False, "email_sent": False, "checks": []}

def check(name, ok, detail=""):
    report["checks"].append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})

try:
    from playwright.sync_api import sync_playwright
    expected = hashlib.sha256(Path("studio.js").read_bytes()).hexdigest()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            for label, width, height in [("mobile360", 360, 800), ("mobile390", 390, 844), ("desktop", 1440, 1000)]:
                context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    with page.expect_response(lambda response: urlsplit(response.url).path.endswith("/studio.js"), timeout=30000) as asset_event:
                        response = page.goto(SITE + "?livecheck=" + report["release"] + "-" + label, wait_until="networkidle", timeout=45000)
                    check(label + ": page HTTP", response is not None and response.status == 200, response.status if response else "no response")
                    asset = asset_event.value
                    check(label + ": loaded release script", asset.status == 200 and hashlib.sha256(asset.body()).hexdigest() == expected, "Browser-loaded script compared with checked-out release")
                    page.locator(".pom-spatial-bg").wait_for(state="visible", timeout=10000)
                    check(label + ": spatial scene present", True)
                    check(label + ": no horizontal overflow", page.evaluate("document.documentElement.scrollWidth <= innerWidth"))
                    check(label + ": background does not intercept taps", page.locator(".pom-spatial-bg").evaluate("e => getComputedStyle(e).pointerEvents === 'none'"))
                    check(label + ": original CTA color", page.locator(".intro-actions .btn").first.evaluate("e => getComputedStyle(e).backgroundColor === 'rgb(37, 36, 42)'"))
                    page.screenshot(path=str(OUT / (label + "-home.png")))
                    for view in ["services", "founder", "work"]:
                        page.locator('.navigation label[for="nav-' + view + '"]').click()
                        page.wait_for_function("view => document.querySelector('.pom-spatial-bg').dataset.view === view", arg=view, timeout=5000)
                        check(label + ": " + view + " navigation", page.locator("#" + view).is_visible())
                    page.locator("#contact-cta").click()
                    page.wait_for_function("document.querySelector('.pom-spatial-bg').dataset.view === 'contact'", timeout=5000)
                    check(label + ": contact focus", page.locator("#brief").evaluate("e => document.activeElement === e"))
                    text = "Live validation draft & cafe - not sent."
                    page.locator("#brief").fill(text)
                    page.evaluate("document.querySelector('#email-cta').addEventListener('click', e => e.preventDefault(), {capture: true})")
                    page.locator("#email-cta").click()
                    uri = urlsplit(page.locator("#email-cta").get_attribute("href"))
                    check(label + ": draft recipient", uri.scheme == "mailto" and uri.path == "editor.hw12@gmail.com")
                    check(label + ": draft body", parse_qs(uri.query).get("body") == [text])
                    check(label + ": text retained", page.locator("#brief").input_value() == text)
                    check(label + ": no JavaScript errors", not errors, "; ".join(errors[:3]))
                except Exception as error:
                    check(label + ": browser execution", False, str(error))
                    try:
                        page.screenshot(path=str(OUT / (label + "-failure.png")))
                    except Exception:
                        pass
                finally:
                    context.close()
            context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            page = context.new_page()
            try:
                page.goto(SITE + "?livecheck=" + report["release"] + "-reduced", wait_until="networkidle", timeout=45000)
                page.locator(".pom-spatial-bg").wait_for(state="visible", timeout=10000)
                check("reduced motion is static", page.locator(".pom-world").evaluate("e => getComputedStyle(e).transform === 'none'"))
            except Exception as error:
                check("reduced motion execution", False, str(error))
            finally:
                context.close()
        finally:
            browser.close()
except Exception as error:
    check("browser setup/execution", False, str(error))
finally:
    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    report["status"] = "passed" if report["checks"] and all(item["ok"] for item in report["checks"]) else "failed"
    (OUT / "result.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "checks": len(report["checks"])}))
raise SystemExit(0 if report["status"] == "passed" else 1)
