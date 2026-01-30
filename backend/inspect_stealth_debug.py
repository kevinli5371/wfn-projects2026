
import playwright_stealth
print("Dir of playwright_stealth:", dir(playwright_stealth))
try:
    from playwright_stealth import Stealth
    print("Stealth imported successfully")
except ImportError as e:
    print(f"Failed to import Stealth: {e}")
