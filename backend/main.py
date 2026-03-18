from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import os
import hashlib
import random
import string
import uuid
from datetime import datetime
import math
import pytz
from app.services.supabase_client import supabase
from app.services.scraper import get_tiktok_data

# Initialize FastAPI
app = FastAPI(
    title="Viral Market API",
    description="Social media fantasy stock market backend",
    version="1.0.0"
)

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ DATABASE ============
# Currently synced fully to Supabase


# ============ REQUEST/RESPONSE MODELS ============

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: str

class ScrapeRequest(BaseModel):
    video_url: HttpUrl

class ScrapeResponse(BaseModel):
    success: bool
    asset_id: Optional[str] = None
    video_url: str
    views: Optional[int] = None
    likes: Optional[int] = None
    author: Optional[str] = None
    current_price: Optional[float] = None
    thumbnail: Optional[str] = None
    error: Optional[str] = None

class InvestRequest(BaseModel):
    user_id: str
    asset_id: str
    amount_coins: float
    is_additional_buy: bool = False

class InvestResponse(BaseModel):
    success: bool
    investment_id: Optional[str] = None
    shares_purchased: Optional[float] = None
    entry_price: Optional[float] = None
    total_cost: Optional[float] = None
    new_balance: Optional[float] = None
    error: Optional[str] = None

class PortfolioItem(BaseModel):
    asset_id: str
    video_url: str
    author: str
    shares: float
    buy_price: float
    current_price: float
    current_value: float
    profit_loss: float
    profit_loss_percent: float
    views: int = 0
    likes: int = 0
    views_at_purchase: int = 0
    likes_at_purchase: int = 0
    thumbnail: str = ""
    view_history: Optional[List[dict]] = None
    like_history: Optional[List[dict]] = None

class PortfolioResponse(BaseModel):
    user_id: str
    balance: float
    total_invested: float
    total_value: float
    total_profit_loss: float
    investments: List[PortfolioItem]

# ---- Auth Models ----

class SignupRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    username: Optional[str] = None
    balance: Optional[float] = None
    display_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    error: Optional[str] = None

# ---- Group Models ----

class CreateGroupRequest(BaseModel):
    user_id: str
    group_name: str

class JoinGroupRequest(BaseModel):
    user_id: str
    group_id: str

class GroupInfo(BaseModel):
    group_id: str
    group_name: str
    members: List[str]
    created_by: str

class GroupResponse(BaseModel):
    success: bool
    group: Optional[GroupInfo] = None
    error: Optional[str] = None

class UserGroupsResponse(BaseModel):
    success: bool
    groups: List[GroupInfo] = []
    error: Optional[str] = None

# ---- AddVideo Models ----

class AddVideoRequest(BaseModel):
    user_key: str
    video_url: str
    author: str
    views: int
    likes: int
    current_price: float

class AddVideoResponse(BaseModel):
    success: bool
    user_key: Optional[str] = None
    asset_id: Optional[str] = None
    video_url: Optional[str] = None
    author: Optional[str] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    current_price: Optional[float] = None
    error: Optional[str] = None
    message: Optional[str] = None

# ============ ENDPOINTS ============

@app.get("/", response_model=HealthResponse)
async def root():
    return {
        "status": "online",
        "message": "Viral Market API is running! 🚀",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "message": "All systems operational",
        "timestamp": datetime.utcnow().isoformat()
    }

# ---- Valuation Formula ----
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
        
        # Safety: avoid division by zero or weird values
        if T_entry <= 0:
            T_entry = 1.0 # Default to 1k views if unknown
            
        # log10(T_curr / T_entry + 9)
        # If T_curr == T_entry, log10(1 + 9) = log10(10) = 1.0
        growth_multiplier = math.log10((T_curr / T_entry) + 9)
        
        # Calculate hours elapsed
        try:
            iso_str = start_time_iso.replace('Z', '+00:00')
            start_time = datetime.fromisoformat(iso_str)
        except ValueError:
            start_time = datetime.utcnow().replace(tzinfo=pytz.UTC)

        if start_time.tzinfo is None:
            start_time = pytz.UTC.localize(start_time)
            
        now = datetime.now(pytz.UTC)
        delta = now - start_time
        hours_elapsed = delta.total_seconds() / 3600.0
        
        # (0.99)^h
        decay_multiplier = math.pow((1 - HOURLY_DECAY_RATE), hours_elapsed)
        
        final_multiplier = growth_multiplier * decay_multiplier
        v_curr = cost_basis * final_multiplier
        
        return max(0.01, round(v_curr, 2))
    except Exception as e:
        print(f"Valuation Error: {e}")
        return cost_basis

@app.post("/api/scrape", response_model=ScrapeResponse)
def scrape_video(request: ScrapeRequest):
    """
    Scrape a TikTok video and save to Supabase
    """
    video_url = str(request.video_url)
    
    try:
        data = get_tiktok_data(video_url)
        
        if not data or "error" in data:
            error_msg = data.get("error", "Unknown scraping error") if data else "Scraper returned None"
            return ScrapeResponse(success=False, video_url=video_url, error=error_msg)
        
        views_raw = data.get("views", 0)
        likes_raw = data.get("likes", 0)
        author = data.get("author", "unknown")
        
        def parse_count(val):
            if isinstance(val, (int, float)):
                return int(val)
            if isinstance(val, str):
                try:
                    return int(val)
                except:
                    return 0
            return 0

        views = parse_count(views_raw)
        likes = parse_count(likes_raw)
        current_price = views / 1000
        asset_id = f"asset_{author}_{views}"

        thumbnail = data.get("thumbnail", "")
        current_time = datetime.utcnow().isoformat()

        # ✅ Save to Supabase (Upsert in case it was already scraped)
        # We fetch existing history first to avoid overwriting it if the video was already scraped
        existing_res = supabase.table("videos").select("view_history, like_history").eq("asset_id", asset_id).execute()
        
        if existing_res.data and existing_res.data[0].get("view_history"):
            # Update existing totals but keep/append history if we wanted to (though scrape is usually for new videos)
            # For scrape_video, if it exists, we might just want to update current stats.
            # But the user said "when the video is scraped, info is added to history".
            # If it already exists, let's append to be safe, or just initialize if empty.
            hist = existing_res.data[0]
            view_hist = (hist.get("view_history") or []) + [{"count": views, "timestamp": current_time}]
            like_hist = (hist.get("like_history") or []) + [{"count": likes, "timestamp": current_time}]
        else:
            view_hist = [{"count": views, "timestamp": current_time}]
            like_hist = [{"count": likes, "timestamp": current_time}]

        supabase.table("videos").upsert({
            "asset_id": asset_id,
            "video_url": video_url,
            "author": author,
            "views": views,
            "likes": likes,
            "current_price": current_price,
            "thumbnail": thumbnail,
            "view_history": view_hist,
            "like_history": like_hist
        }).execute()
        
        return ScrapeResponse(
            success=True,
            asset_id=asset_id,
            video_url=video_url,
            views=views,
            likes=likes,
            author=author,
            current_price=current_price,
            thumbnail=thumbnail
        )
        
    except Exception as e:
        return ScrapeResponse(success=False, video_url=video_url, error=str(e))


@app.post("/api/invest", response_model=InvestResponse)
async def create_investment(request: InvestRequest):
    """
    User buys shares of a video asset
    """
    try:
        # Get user balance
        user_res = supabase.table("users").select("balance").eq("user_id", request.user_id).execute()
        if not user_res.data:
            # Auto-create user with default balance for testing
            user_balance = 1000.0
            supabase.table("users").insert({"user_id": request.user_id, "balance": user_balance}).execute()
        else:
            user_balance = user_res.data[0]["balance"]
            
        # Get asset
        asset_res = supabase.table("videos").select("*").eq("asset_id", request.asset_id).execute()
        if not asset_res.data:
            raise HTTPException(status_code=404, detail="Asset not found. Please Search/Scrape first.")
            
        # Before creating a new investment, check if the user already owns this asset (if not buying more intentionally)
        if not request.is_additional_buy:
            existing_res = supabase.table("investments").select("*").eq("user_id", request.user_id).eq("asset_id", request.asset_id).execute()
            if existing_res.data:
                return InvestResponse(
                    success=False, 
                    error="You already own this video. You need to invest more coins in the video instead of buying the same video twice."
                )
            
        asset = asset_res.data[0]
        asset_price = asset["current_price"]
        
        if user_balance < request.amount_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient funds. Balance: ${user_balance:.2f}, Required: ${request.amount_coins:.2f}"
            )
        
        shares = request.amount_coins / asset_price if asset_price > 0 else 0
        new_balance = user_balance - request.amount_coins
        
        # Update user balance
        supabase.table("users").update({"balance": new_balance}).eq("user_id", request.user_id).execute()
        
        investment_id = f"inv_{request.user_id}_{int(datetime.utcnow().timestamp())}"
        
        supabase.table("investments").insert({
            "investment_id": investment_id,
            "user_id": request.user_id,
            "asset_id": request.asset_id,
            "shares_owned": shares,
            "buy_price": asset_price,
            "cost_basis": request.amount_coins,
            "timestamp": datetime.utcnow().isoformat(),
            "views_at_purchase": asset.get("views", 0),
            "likes_at_purchase": asset.get("likes", 0)
        }).execute()
        
        return InvestResponse(
            success=True,
            investment_id=investment_id,
            shares_purchased=shares,
            entry_price=asset_price,
            total_cost=request.amount_coins,
            new_balance=new_balance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return InvestResponse(success=False, error=str(e))


@app.get("/api/portfolio/{user_id}", response_model=PortfolioResponse)
async def get_portfolio(user_id: str):
    """
    Get user's portfolio with all investments and P/L
    """
    print(f"\n--- Fetching portfolio for user: {user_id} ---")
    try:
        # Get user balance
        print("1. Fetching user balance from Supabase 'users' table...")
        user_res = supabase.table("users").select("balance").eq("user_id", user_id).execute()
        balance = user_res.data[0]["balance"] if user_res.data else 0.0
        print(f"   -> User balance retrieved: {balance}")
        
        # Get investments
        print("2. Fetching user investments from Supabase 'investments' table...")
        inv_res = supabase.table("investments").select("*").eq("user_id", user_id).execute()
        user_investments = inv_res.data
        print(f"   -> Found {len(user_investments)} investments")
        
        portfolio_items = []
        total_invested = 0.0
        total_value = 0.0
        
        # Get all related assets for current prices
        asset_ids = [inv["asset_id"] for inv in user_investments]
        print(f"3. Fetching current prices for {len(asset_ids)} assets from 'videos' table...")
        videos_map = {}
        if asset_ids:
            vid_res = supabase.table("videos").select("*").in_("asset_id", asset_ids).execute()
            for v in vid_res.data:
                videos_map[v["asset_id"]] = v
            print(f"   -> Successfully retrieved data for {len(vid_res.data)} assets")
        else:
            print("   -> No assets to fetch")
        
        aggregated_items = {}
        
        print("4. Calculating portfolio totals and P/L for each investment...")
        for inv in user_investments:
            asset_id = inv["asset_id"]
            asset_info = videos_map.get(asset_id)
            
            current_price = asset_info["current_price"] if asset_info else inv["buy_price"]
            video_url = asset_info["video_url"] if asset_info else ""
            author = asset_info["author"] if asset_info else "Unknown"
            
            shares = inv["shares_owned"]
            buy_price = inv["buy_price"]
            cost_basis = inv["cost_basis"]
            
            views = asset_info.get("views", 0) if asset_info else 0
            likes = asset_info.get("likes", 0) if asset_info else 0
            thumbnail = asset_info.get("thumbnail", "") if asset_info else ""
            view_history = asset_info.get("view_history", []) if asset_info else []
            like_history = asset_info.get("like_history", []) if asset_info else []

            # Use High-Frequency Formula
            curr_val = calculate_valuation(
                cost_basis=cost_basis,
                buy_tier=buy_price,
                current_views=views,
                start_time_iso=inv["timestamp"]
            )
            
            p_l = curr_val - cost_basis
            
            total_invested += cost_basis
            total_value += curr_val
            
            if asset_id not in aggregated_items:
                aggregated_items[asset_id] = {
                    "asset_id": asset_id,
                    "video_url": video_url,
                    "author": author,
                    "shares": 0.0,
                    "buy_price": 0.0,
                    "current_price": current_price,
                    "current_value": 0.0,
                    "profit_loss": 0.0,
                    "profit_loss_percent": 0.0,
                    "views": views,
                    "likes": likes,
                    "views_at_purchase": inv.get("views_at_purchase", 0),
                    "likes_at_purchase": inv.get("likes_at_purchase", 0),
                    "thumbnail": thumbnail,
                    "view_history": view_history,
                    "like_history": like_history,
                    "_total_cost_basis": 0.0
                }
            
            agg = aggregated_items[asset_id]
            agg["shares"] += shares
            agg["current_value"] += curr_val
            agg["profit_loss"] += p_l
            agg["_total_cost_basis"] += cost_basis
            # Keep the oldest purchase views/likes (assuming sorted by time or just first encountered)
        
        # Convert aggregated dict into PortfolioItem list
        for agg in aggregated_items.values():
            cost_basis = agg["_total_cost_basis"]
            if cost_basis > 0:
                agg["profit_loss_percent"] = (agg["profit_loss"] / cost_basis) * 100
                agg["buy_price"] = cost_basis / agg["shares"] if agg["shares"] > 0 else 0.0
            
            item = PortfolioItem(
                asset_id=agg["asset_id"],
                video_url=agg["video_url"],
                author=agg["author"],
                shares=agg["shares"],
                buy_price=agg["buy_price"],
                current_price=agg["current_price"],
                current_value=agg["current_value"],
                profit_loss=agg["profit_loss"],
                profit_loss_percent=agg["profit_loss_percent"],
                views=agg["views"],
                likes=agg["likes"],
                views_at_purchase=agg["views_at_purchase"],
                likes_at_purchase=agg["likes_at_purchase"],
                thumbnail=agg["thumbnail"],
                view_history=agg["view_history"],
                like_history=agg["like_history"]
            )
            portfolio_items.append(item)
            
        print(f"5. Done! Total value: {total_value}, Total invested: {total_invested}")
        print("--------------------------------------------------\n")
            
        return PortfolioResponse(
            user_id=user_id,
            balance=balance,
            total_invested=total_invested,
            total_value=total_value,
            total_profit_loss=total_value - total_invested,
            investments=portfolio_items
        )
        
    except Exception as e:
        print(f"ERROR getting portfolio for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sell")
async def sell_investment(user_id: str, investment_id: str, amount_coins: float = None):
    """
    User sells all or part of a specific investment.
    Expects investment_id to be the asset_id (from the frontend's mapping)
    """
    try:
        investments_res = supabase.table("investments").select("*").eq("user_id", user_id).eq("asset_id", investment_id).execute()
        
        if not investments_res.data:
            raise HTTPException(status_code=404, detail="Investment not found in your portfolio.")
        
        asset_res = supabase.table("videos").select("current_price, views").eq("asset_id", investment_id).execute()
        if not asset_res.data:
            raise HTTPException(status_code=404, detail="Asset data not found.")
        asset_data = asset_res.data[0]
        current_views = asset_data.get("views", 0)

        # First pass to calculate total value of this asset position
        calculated_tranches = []
        total_current_value = 0.0
        
        for inv in investments_res.data:
            shares = inv["shares_owned"]
            cost_basis = inv["cost_basis"]
            buy_price = inv["buy_price"]
            timestamp = inv["timestamp"]
            
            payout = calculate_valuation(
                cost_basis=cost_basis,
                buy_tier=buy_price,
                current_views=current_views,
                start_time_iso=timestamp
            )
            total_current_value += payout
            calculated_tranches.append({"inv": inv, "payout": payout})

        # Determine sell ratio
        sell_ratio = 1.0
        if amount_coins is not None and amount_coins > 0:
            if total_current_value > 0:
                sell_ratio = min(amount_coins / total_current_value, 1.0)
            else:
                sell_ratio = 1.0
                
        total_payout = 0.0
        total_shares_sold = 0.0

        for item in calculated_tranches:
            inv = item["inv"]
            original_payout = item["payout"]
            
            realized_payout = original_payout * sell_ratio
            shares_sold = inv["shares_owned"] * sell_ratio
            
            total_payout += realized_payout
            total_shares_sold += shares_sold
            
            if sell_ratio >= 0.999:
                supabase.table("investments").delete().eq("investment_id", inv["investment_id"]).execute()
            else:
                new_shares = inv["shares_owned"] - shares_sold
                new_cost_basis = inv["cost_basis"] * (1 - sell_ratio)
                supabase.table("investments").update({
                    "shares_owned": new_shares,
                    "cost_basis": new_cost_basis
                }).eq("investment_id", inv["investment_id"]).execute()

        # Apply 1% transaction fee
        transaction_fee = total_payout * 0.01
        net_payout = total_payout - transaction_fee

        # Update User Balance
        user_res = supabase.table("users").select("balance").eq("user_id", user_id).execute()
        if user_res.data:
            current_balance = user_res.data[0]["balance"]
            new_balance = current_balance + net_payout
            supabase.table("users").update({"balance": new_balance}).eq("user_id", user_id).execute()

        return {
            "success": True, 
            "message": f"Successfully sold {total_shares_sold:.2f} shares for ${net_payout:.2f} (fee: ${transaction_fee:.2f})", 
            "payout": net_payout,
            "fee": transaction_fee,
            "gross_payout": total_payout
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Sell error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class RefreshRequest(BaseModel):
    asset_ids: List[str]

@app.post("/api/videos/refresh")
def refresh_videos(request: RefreshRequest):
    """
    Re-scrape each video and update views/likes/price in Supabase.
    Maintains historical JSON logs for charts.
    Runs scrapes in parallel to minimize total wait time.
    """
    if not request.asset_ids:
        return {"success": True, "updated": [], "errors": []}

    vid_res = supabase.table("videos").select(
        "asset_id, video_url, view_history, like_history"
    ).in_("asset_id", request.asset_ids).execute()
    
    asset_url_map = {v["asset_id"]: v["video_url"] for v in vid_res.data}
    asset_history_map = {
        v["asset_id"]: {
            "view_history": v.get("view_history") or [],
            "like_history": v.get("like_history") or []
        } for v in vid_res.data
    }

    def scrape_and_update(asset_id: str):
        video_url = asset_url_map.get(asset_id)
        if not video_url:
            return {"asset_id": asset_id, "success": False, "error": "Asset not found"}
        try:
            data = get_tiktok_data(video_url)
            if not data or "error" in data:
                return {"asset_id": asset_id, "success": False, "error": data.get("error", "Scrape failed")}

            views = int(data.get("views", 0))
            likes = int(data.get("likes", 0))
            current_price = views / 1000

            current_time = datetime.utcnow().isoformat()

            history = asset_history_map.get(asset_id, {"view_history": [], "like_history": []})
            new_view_record = {"count": views, "timestamp": current_time}
            new_like_record = {"count": likes, "timestamp": current_time}
            
            updated_view_history = history["view_history"] + [new_view_record]
            updated_like_history = history["like_history"] + [new_like_record]

            supabase.table("videos").update({
                "views": views,
                "likes": likes,
                "current_price": current_price,
                "view_history": updated_view_history,
                "like_history": updated_like_history,
            }).eq("asset_id", asset_id).execute()

            return {"asset_id": asset_id, "success": True}
        except Exception as e:
            return {"asset_id": asset_id, "success": False, "error": str(e)}

    updated = []
    errors = []

    from concurrent.futures import ThreadPoolExecutor, as_completed
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(scrape_and_update, aid): aid for aid in request.asset_ids}
        for future in as_completed(futures):
            result = future.result()
            if result["success"]:
                updated.append(result)
            else:
                errors.append(result)

    return {"success": True, "updated": updated, "errors": errors}

@app.post("/api/assets/refresh")
async def refresh_asset_prices():
    try:
        return {"success": True, "message": "Price refresh endpoint - TODO: Implement", "assets_updated": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leaderboard")
async def get_leaderboard():
    try:
        # We need balances of all users and their investment values
        users_res = supabase.table("users").select("*").execute()
        investments_res = supabase.table("investments").select("*").execute()
        videos_res = supabase.table("videos").select("asset_id, current_price, views").execute()
        
        videos_info_map = {v["asset_id"]: v for v in videos_res.data}
        users_map = {u["user_id"]: u for u in users_res.data}
        
        user_portfolio_values = {}
        for u in users_res.data:
            user_portfolio_values[u["user_id"]] = u["balance"]
            
        for inv in investments_res.data:
            uid = inv["user_id"]
            cost_basis = inv["cost_basis"]
            buy_price = inv["buy_price"]
            timestamp = inv["timestamp"]
            asset_id = inv["asset_id"]
            
            # Use High-Frequency Formula for leaderboard accuracy
            current_views = videos_info_map.get(asset_id, {}).get("views", 0)
            cost_basis = inv.get("cost_basis", 0)
            buy_price = inv.get("buy_price", 1.0)
            timestamp = inv.get("timestamp", datetime.utcnow().isoformat())
            views = videos_views_map.get(asset_id, 0)
            
            val = calculate_valuation(
                cost_basis=cost_basis,
                buy_tier=buy_price,
                current_views=current_views,
                start_time_iso=timestamp
            )
            
            if uid in user_portfolio_values:
                user_portfolio_values[uid] += val
                
        leaderboard = []
        for uid, total_val in user_portfolio_values.items():
            user_info = users_map.get(uid, {})
            leaderboard.append({
                "user_id": uid,
                "username": user_info.get("username", uid),
                "display_name": user_info.get("display_name") or user_info.get("username", uid),
                "profile_picture_url": user_info.get("profile_picture_url"),
                "portfolio_value": total_val
            })
            
        leaderboard.sort(key=lambda x: x["portfolio_value"], reverse=True)
        # Add rank
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
            
        return {
            "leaderboard": leaderboard[:100]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ AUTH ENDPOINTS ============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class ProfileResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    balance: Optional[float] = None
    email: Optional[str] = None
    error: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    display_name: str
    profile_picture_url: Optional[str] = None

@app.get("/api/user/{user_id}/profile", response_model=ProfileResponse)
async def get_user_profile(user_id: str):
    try:
        user_res = supabase.table("users").select("user_id, username, display_name, profile_picture_url, balance, email").eq("user_id", user_id).execute()
        if not user_res.data:
            return ProfileResponse(success=False, error="User not found")
            
        user_data = user_res.data[0]
        return ProfileResponse(
            success=True,
            user_id=user_data["user_id"],
            username=user_data["username"],
            display_name=user_data.get("display_name") or user_data["username"],
            profile_picture_url=user_data.get("profile_picture_url"),
            balance=user_data["balance"],
            email=user_data["email"]
        )
    except Exception as e:
        print(f"Get profile error: {e}")
        return ProfileResponse(success=False, error=str(e))

@app.put("/api/user/{user_id}/profile", response_model=ProfileResponse)
async def update_user_profile(user_id: str, request: UpdateProfileRequest):
    try:
        update_data = {"display_name": request.display_name}
        if request.profile_picture_url is not None:
            update_data["profile_picture_url"] = request.profile_picture_url

        user_res = supabase.table("users").update(update_data).eq("user_id", user_id).execute()
        if not user_res.data:
            return ProfileResponse(success=False, error="User not found or update failed")
            
        user_data = user_res.data[0]
        return ProfileResponse(
            success=True,
            user_id=user_data["user_id"],
            username=user_data["username"],
            display_name=user_data.get("display_name") or user_data["username"],
            profile_picture_url=user_data.get("profile_picture_url"),
            balance=user_data["balance"],
            email=user_data["email"]
        )
    except Exception as e:
        print(f"Update profile error: {e}")
        return ProfileResponse(success=False, error=str(e))

from fastapi import UploadFile, File

@app.post("/api/user/{user_id}/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    try:
        # Check if user exists
        user_res = supabase.table("users").select("user_id").eq("user_id", user_id).execute()
        if not user_res.data:
            return {"success": False, "error": "User not found"}

        # Read file contents
        file_bytes = await file.read()
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        
        # Create a unique filename for the avatar
        file_name = f"{user_id}_{int(datetime.utcnow().timestamp())}.{file_ext}"

        # Upload to Supabase Storage 'avatars' bucket
        supabase.storage.from_("avatars").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )

        # Get the public URL
        public_url = supabase.storage.from_("avatars").get_public_url(file_name)

        # Update the user's profile with the new URL
        supabase.table("users").update({"profile_picture_url": public_url}).eq("user_id", user_id).execute()

        return {"success": True, "profile_picture_url": public_url}
        
    except Exception as e:
        print(f"Upload avatar error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    try:
        # Check if email already exists
        existing = supabase.table("users").select("user_id").eq("email", request.email).execute()
        if existing.data:
            return AuthResponse(success=False, error="Email already registered")
        
        # Check if username already exists
        existing_user = supabase.table("users").select("user_id").eq("username", request.username).execute()
        if existing_user.data:
            return AuthResponse(success=False, error="Username already taken")
        
        user_id = f"user_{request.username}_{int(datetime.utcnow().timestamp())}"
        
        # UI Avatars default URL
        encoded_username = request.username.replace(" ", "+")
        default_avatar_url = f"https://ui-avatars.com/api/?name={encoded_username}&background=random&color=fff&size=200"
        
        supabase.table("users").insert({
            "user_id": user_id,
            "username": request.username,
            "display_name": request.username,
            "profile_picture_url": default_avatar_url,
            "email": request.email,
            "password_hash": hash_password(request.password),
            "balance": 1000.0
        }).execute()
        
        return AuthResponse(
            success=True, 
            user_id=user_id, 
            username=request.username, 
            balance=1000.0,
            display_name=request.username,
            profile_picture_url=default_avatar_url
        )
    except Exception as e:
        print(f"Signup error: {e}")
        return AuthResponse(success=False, error=str(e))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        user_res = supabase.table("users").select("*").eq("email", request.email).execute()
        if not user_res.data:
            return AuthResponse(success=False, error="No account found with that email")
        
        user = user_res.data[0]
        if user.get("password_hash") != hash_password(request.password):
            return AuthResponse(success=False, error="Incorrect password")
        
        return AuthResponse(
            success=True,
            user_id=user["user_id"],
            username=user.get("username", user["user_id"]),
            balance=user["balance"]
        )
    except Exception as e:
        print(f"Login error: {e}")
        return AuthResponse(success=False, error=str(e))


# ============ GROUP ENDPOINTS ============

def generate_group_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.post("/api/groups/create", response_model=GroupResponse)
async def create_group(request: CreateGroupRequest):
    try:
        group_id = generate_group_code()
        
        supabase.table("groups").insert({
            "group_id": group_id,
            "group_name": request.group_name,
            "members": [request.user_id],
            "created_by": request.user_id
        }).execute()
        
        return GroupResponse(
            success=True,
            group=GroupInfo(
                group_id=group_id,
                group_name=request.group_name,
                members=[request.user_id],
                created_by=request.user_id
            )
        )
    except Exception as e:
        print(f"Create group error: {e}")
        return GroupResponse(success=False, error=str(e))


@app.post("/api/groups/join", response_model=GroupResponse)
async def join_group(request: JoinGroupRequest):
    try:
        # Find the group
        group_res = supabase.table("groups").select("*").eq("group_id", request.group_id).execute()
        if not group_res.data:
            return GroupResponse(success=False, error="Group not found. Check the code and try again.")
        
        group = group_res.data[0]
        members = group.get("members", [])
        
        if request.user_id in members:
            return GroupResponse(success=False, error="You are already in this group")
        
        # Add user to members array
        members.append(request.user_id)
        supabase.table("groups").update({"members": members}).eq("group_id", request.group_id).execute()
        
        return GroupResponse(
            success=True,
            group=GroupInfo(
                group_id=group["group_id"],
                group_name=group["group_name"],
                members=members,
                created_by=group["created_by"]
            )
        )
    except Exception as e:
        print(f"Join group error: {e}")
        return GroupResponse(success=False, error=str(e))

class LeaveGroupRequest(BaseModel):
    user_id: str
    group_id: str

@app.post("/api/groups/leave", response_model=GroupResponse)
async def leave_group(request: LeaveGroupRequest):
    try:
        group_res = supabase.table("groups").select("*").eq("group_id", request.group_id).execute()
        if not group_res.data:
            return GroupResponse(success=False, error="Group not found")
        
        group = group_res.data[0]
        members = group.get("members", [])
        
        if request.user_id in members:
            members.remove(request.user_id)
            
            if not members:
                # Group is empty, delete it
                supabase.table("groups").delete().eq("group_id", request.group_id).execute()
            else:
                # Update members list
                supabase.table("groups").update({"members": members}).eq("group_id", request.group_id).execute()
                
        return GroupResponse(success=True)
    except Exception as e:
        print(f"Leave group error: {e}")
        return GroupResponse(success=False, error=str(e))


@app.get("/api/groups/{user_id}", response_model=UserGroupsResponse)
async def get_user_groups(user_id: str):
    try:
        # Get all groups where user_id is in the members array
        all_groups_res = supabase.table("groups").select("*").contains("members", [user_id]).execute()
        
        groups = [
            GroupInfo(
                group_id=g["group_id"],
                group_name=g["group_name"],
                members=g.get("members", []),
                created_by=g["created_by"]
            )
            for g in all_groups_res.data
        ]
        
        return UserGroupsResponse(success=True, groups=groups)
    except Exception as e:
        print(f"Get groups error: {e}")
        return UserGroupsResponse(success=False, error=str(e))

@app.get("/api/groups/{group_id}/leaderboard")
async def get_group_leaderboard(group_id: str):
    try:
        # 1. Fetch the group to get members list
        group_res = supabase.table("groups").select("members").eq("group_id", group_id).execute()
        
        if not group_res.data:
            raise HTTPException(status_code=404, detail="Group not found.")
            
        members = group_res.data[0].get("members", [])
        if not members:
            return {"leaderboard": []}
            
        # 2. We need balances of all members and their investment values
        users_res = supabase.table("users").select("*").in_("user_id", members).execute()
        investments_res = supabase.table("investments").select("*").in_("user_id", members).execute()
        videos_res = supabase.table("videos").select("asset_id, views").execute()
        
        videos_views_map = {v["asset_id"]: v.get("views", 0) for v in videos_res.data}
        
        user_portfolio_values = {}
        for u in users_res.data:
            user_portfolio_values[u["user_id"]] = {
                "username": u.get("username", u["user_id"]),
                "display_name": u.get("display_name") or u.get("username", u["user_id"]),
                "profile_picture_url": u.get("profile_picture_url"),
                "balance": u["balance"],
                "total_invested": 0,
                "total_value": 0
            }
            
        for inv in investments_res.data:
            uid = inv["user_id"]
            if uid not in user_portfolio_values:
                continue # Edge case, shouldn't happen based on foreign keys
                
            asset_id = inv["asset_id"]
            cost_basis = inv.get("cost_basis", 0)
            buy_price = inv.get("buy_price", 1.0)
            timestamp = inv.get("timestamp", datetime.utcnow().isoformat())
            views = videos_views_map.get(asset_id, 0)
            
            val = calculate_valuation(
                cost_basis=cost_basis,
                buy_tier=buy_price,
                current_views=views,
                start_time_iso=timestamp
            )
            
            user_portfolio_values[uid]["total_invested"] += cost_basis
            user_portfolio_values[uid]["total_value"] += val
                
        leaderboard = []
        for uid, data in user_portfolio_values.items():
            total_portfolio_value = data["balance"] + data["total_value"]
            
            p_l_percent = 0
            if data["total_invested"] > 0:
                p_l_percent = ((data["total_value"] - data["total_invested"]) / data["total_invested"]) * 100

            leaderboard.append({
                "user_id": uid,
                "username": data["username"],
                "display_name": data["display_name"],
                "profile_picture_url": data["profile_picture_url"],
                "portfolio_value": total_portfolio_value,
                "profit_loss_percent": p_l_percent
            })
            
        leaderboard.sort(key=lambda x: x["portfolio_value"], reverse=True)
        
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
            
        return {
            "leaderboard": leaderboard
        }
    except Exception as e:
        print(f"Group leaderboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADD VIDEO ENDPOINT ============

@app.post("/api/videos/add", response_model=AddVideoResponse, status_code=201)
async def add_video(request: AddVideoRequest):
    """
    Manually add a video to the Supabase database
    """
    try:
        asset_id = str(uuid.uuid4())
        
        # Insert into Supabase
        supabase.table("videos").insert({
            "asset_id": asset_id,
            "user_key": request.user_key,
            "video_url": request.video_url,
            "author": request.author,
            "views": request.views,
            "likes": request.likes,
            "current_price": request.current_price,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return AddVideoResponse(
            success=True,
            user_key=request.user_key,
            asset_id=asset_id,
            video_url=request.video_url,
            author=request.author,
            views=request.views,
            likes=request.likes,
            current_price=request.current_price,
            message="Video added successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ RUN SERVER ============
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)