import math
from datetime import datetime, timedelta
import pytz

HOURLY_DECAY_RATE = 0.01

def calculate_valuation(cost_basis: float, buy_tier: float, current_views: int, start_time_iso: str) -> float:
    """
    Multiplier = log10(T_curr / T_entry + 9) * (0.99)^h
    V_curr = cost_basis * Multiplier
    h = hours elapsed (float)
    """
    try:
        T_curr = current_views / 1000.0
        T_entry = buy_tier
        
        if T_entry <= 0:
            T_entry = 1.0
            
        growth_multiplier = math.log10((T_curr / T_entry) + 9)
        
        # Fixed "now" for test: 2026-03-18T12:00:00Z
        now = datetime.fromisoformat("2026-03-18T12:00:00+00:00")
        
        iso_str = start_time_iso.replace('Z', '+00:00')
        start_time = datetime.fromisoformat(iso_str)
        if start_time.tzinfo is None:
            start_time = pytz.UTC.localize(start_time)
            
        delta = now - start_time
        hours_elapsed = delta.total_seconds() / 3600.0
        
        decay_multiplier = math.pow((1 - HOURLY_DECAY_RATE), hours_elapsed)
        
        final_multiplier = growth_multiplier * decay_multiplier
        v_curr = cost_basis * final_multiplier
        
        return max(0.01, round(v_curr, 2))
    except Exception as e:
        print(f"Valuation Error: {e}")
        return cost_basis

def test():
    cost = 1000.0
    entry_tier = 10.0 # 10k views
    start_time = "2026-03-18T12:00:00+00:00" # 0 hours elapsed
    
    print("--- High-Frequency Valuation Test ---")
    
    # 1. Initial State
    v1 = calculate_valuation(cost, entry_tier, 10000, start_time)
    print(f"Test 1 (Initial): Expected 1000, Got {v1}")
    
    # 2. 1 Hour Decay (no growth)
    start_time_1h = "2026-03-18T11:00:00+00:00"
    v2 = calculate_valuation(cost, entry_tier, 10000, start_time_1h)
    print(f"Test 2 (1h Decay): Expected 990, Got {v2}")
    
    # 3. 24 Hour Decay (no growth)
    start_time_24h = "2026-03-17T12:00:00+00:00"
    v3 = calculate_valuation(cost, entry_tier, 10000, start_time_24h)
    # 0.99^24 = 0.7856
    print(f"Test 3 (24h Decay): Expected ~785.6, Got {v3}")
    
    # 4. 10x Growth (10k -> 100k views), 0 hours elapsed
    v4 = calculate_valuation(cost, entry_tier, 100000, start_time)
    # T_curr = 100, T_entry = 10. 100/10 + 9 = 19. log10(19) = 1.278
    print(f"Test 4 (10x Growth): Expected ~1278.7, Got {v4}")
    
    # 5. 10x Growth + 24 Hour Decay
    v5 = calculate_valuation(cost, entry_tier, 100000, start_time_24h)
    # 1278.7 * 0.7856 = 1004.5
    print(f"Test 5 (Growth + Decay): Expected ~1004.5, Got {v5}")

if __name__ == "__main__":
    test()
