"""
Viral Market - FastAPI Backend
Main application file with all API endpoints
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import os
from datetime import datetime

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
    error: Optional[str] = None

class InvestRequest(BaseModel):
    user_id: str
    asset_id: str
    amount_coins: float

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

class PortfolioResponse(BaseModel):
    user_id: str
    balance: float
    total_invested: float
    total_value: float
    total_profit_loss: float
    investments: List[PortfolioItem]

# ============ IN-MEMORY DATABASE ============

# Store scraped video data: {asset_id: {video_url, views, likes, author, current_price, timestamp}}
assets = {}

# Store user data: {user_id: {balance, username}}
users = {
    "user_123": {"balance": 1000.0, "username": "player1"},
    "test_user": {"balance": 5000.0, "username": "tester"}
}

# Store investment records: [{user_id, asset_id, shares, entry_price, timestamp}]
investments = []

# ============ ENDPOINTS ============

@app.get("/", response_model=HealthResponse)
async def root():
    """
    Health check endpoint - verify API is running
    """
    return {
        "status": "online",
        "message": "Viral Market API is running! 🚀",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Detailed health check with service status
    """
    return {
        "status": "healthy",
        "message": "All systems operational",
        "timestamp": datetime.utcnow().isoformat()
    }

from app.services.scraper import get_tiktok_data

@app.post("/api/scrape", response_model=ScrapeResponse)
def scrape_video(request: ScrapeRequest):
    """
    Scrape a TikTok video and add to database
    """
    video_url = str(request.video_url)
    
    try:
        # Call the real scraper
        # Using synchronous call in a non-async path (runs in threadpool)
        data = get_tiktok_data(video_url)
        
        # Check for errors from scraper
        if not data or "error" in data:
            error_msg = data.get("error", "Unknown scraping error") if data else "Scraper returned None"
            return ScrapeResponse(
                success=False,
                video_url=video_url,
                error=error_msg
            )
        
        # Extract data
        # Note: Scraper returns views/likes as raw numbers or strings depending on scraper logic
        # You might need to clean them if they are strings like "1.2M"
        # For this integration we assume scraper returns basic numbers or cleanable strings
        
        views_raw = data.get("views", 0)
        likes_raw = data.get("likes", 0)
        author = data.get("author", "unknown")
        
        # Simple helper to parse counts if they are strings (basic)
        def parse_count(val):
            if isinstance(val, (int, float)):
                return int(val)
            if isinstance(val, str):
                # Very basic parsing, might need more robust logic for "1.5M" etc if scraper doesn't handle it
                try:
                    return int(val)
                except:
                    return 0 # Fail safe
            return 0

        views = parse_count(views_raw)
        likes = parse_count(likes_raw)
        
        # Calculate price: views / 1000
        current_price = views / 1000
        
        # Save to our "database"
        asset_id = "asset_" + author + "_" + str(views)
        assets[asset_id] = {
            "video_url": video_url,
            "views": views,
            "likes": likes,
            "author": author,
            "current_price": current_price,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        print("Scrape Result:", data)
        print("Asset ID:", asset_id)
        print("Video URL:", video_url)
        print("Views:", views)
        print("Likes:", likes)
        print("Author:", author)
        print("Current Price:", current_price)

        return ScrapeResponse(
            success=True,
            asset_id=asset_id,
            video_url=video_url,
            views=views,
            likes=likes,
            author=author,
            current_price=current_price
        )
        
    except Exception as e:
        return ScrapeResponse(
            success=False,
            video_url=video_url,
            error=str(e)
        )

@app.post("/api/invest", response_model=InvestResponse)
async def create_investment(request: InvestRequest):
    """
    User buys shares of a video asset
    """
    try:
        user_id = request.user_id
        asset_id = request.asset_id
        
        # Ensure user exists (create if not for demo shortcut)
        if user_id not in users:
            users[user_id] = {"balance": 1000.0, "username": f"user_{user_id[:5]}"}
            
        user_balance = users[user_id]["balance"]
        
        # Validate asset exists
        if asset_id not in assets:
            raise HTTPException(
                status_code=404,
                detail=f"Asset {asset_id} not found. Please scrape it first."
            )
            
        asset_price = assets[asset_id]["current_price"]
        
        # Prevent division by zero if views are 0
        if asset_price <= 0:
            asset_price = 0.01 
        
        # Validate user has enough balance
        if user_balance < request.amount_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient funds. Balance: ${user_balance:.2f}, Required: ${request.amount_coins:.2f}"
            )
        
        # Calculate shares
        shares = request.amount_coins / asset_price
        new_balance = user_balance - request.amount_coins
        
        # Update balance
        users[user_id]["balance"] = new_balance
        
        # Record investment
        investment_id = f"inv_{len(investments) + 1}"
        investments.append({
            "investment_id": investment_id,
            "user_id": user_id,
            "asset_id": asset_id,
            "shares": shares,
            "entry_price": asset_price,
            "timestamp": datetime.utcnow().isoformat()
        })
        
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
        return InvestResponse(
            success=False,
            error=str(e)
        )

@app.get("/api/portfolio/{user_id}", response_model=PortfolioResponse)
async def get_portfolio(user_id: str):
    """
    Get user's portfolio with all investments and P/L
    """
    try:
        if user_id not in users:
            # For new users, initialize with default balance
            users[user_id] = {"balance": 1000.0, "username": f"user_{user_id[:5]}"}
            
        user_balance = users[user_id]["balance"]
        
        # Get user's investments and aggregate by asset
        user_investments = [inv for inv in investments if inv["user_id"] == user_id]
        
        portfolio_items = []
        for inv in user_investments:
            asset_id = inv["asset_id"]
            asset_data = assets.get(asset_id)
            
            if not asset_data:
                continue # Safeguard
                
            current_price = asset_data["current_price"]
            buy_price = inv["entry_price"]
            shares = inv["shares"]
            
            current_value = shares * current_price
            profit_loss = current_value - (shares * buy_price)
            pl_percent = (profit_loss / (shares * buy_price) * 100) if buy_price > 0 else 0
            
            portfolio_items.append(PortfolioItem(
                asset_id=asset_id,
                video_url=asset_data["video_url"],
                author=asset_data["author"],
                shares=shares,
                buy_price=buy_price,
                current_price=current_price,
                current_value=current_value,
                profit_loss=profit_loss,
                profit_loss_percent=pl_percent
            ))
            
        total_invested = sum(item.shares * item.buy_price for item in portfolio_items)
        total_value = sum(item.current_value for item in portfolio_items)
        total_pl = total_value - total_invested
        
        return PortfolioResponse(
            user_id=user_id,
            balance=user_balance,
            total_invested=total_invested,
            total_value=total_value,
            total_profit_loss=total_pl,
            investments=portfolio_items
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sell")
async def sell_investment(user_id: str, investment_id: str):
    """
    Sell an investment and add coins back to balance
    """
    try:
        # Simple implementation for selling 100% of an investment
        found_idx = -1
        for i, inv in enumerate(investments):
            if inv["investment_id"] == investment_id and inv["user_id"] == user_id:
                found_idx = i
                break
                
        if found_idx == -1:
            raise HTTPException(status_code=404, detail="Investment not found")
            
        inv = investments[found_idx]
        asset_id = inv["asset_id"]
        
        if asset_id not in assets:
            raise HTTPException(status_code=404, detail="Asset data lost")
            
        current_price = assets[asset_id]["current_price"]
        sale_value = inv["shares"] * current_price
        
        # Add to balance and remove investment
        users[user_id]["balance"] += sale_value
        investments.pop(found_idx)
        
        return {
            "success": True,
            "message": f"Sold asset for ${sale_value:.2f}",
            "sale_value": sale_value,
            "new_balance": users[user_id]["balance"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assets/refresh")
async def refresh_asset_prices():
    """
    CRON JOB: Re-scrape all assets to update prices
    """
    try:
        updated_count = 0
        for asset_id, data in assets.items():
            try:
                # Basic refresh logic (re-scrape)
                new_data = get_tiktok_data(data["video_url"])
                if new_data and "views" in new_data:
                    views = int(new_data["views"])
                    assets[asset_id]["views"] = views
                    assets[asset_id]["current_price"] = views / 1000
                    updated_count += 1
            except:
                continue
                
        return {
            "success": True,
            "message": f"Updated {updated_count} asset prices",
            "assets_updated": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
async def get_leaderboard():
    """
    Get top users by total net worth (balance + investment value)
    """
    try:
        leaderboard_data = []
        
        for user_id, user_info in users.items():
            balance = user_info["balance"]
            
            # Calculate value of all investments
            inv_value = 0
            for inv in investments:
                if inv["user_id"] == user_id:
                    asset_id = inv["asset_id"]
                    if asset_id in assets:
                        inv_value += inv["shares"] * assets[asset_id]["current_price"]
            
            total_net_worth = balance + inv_value
            leaderboard_data.append({
                "username": user_info["username"],
                "portfolio_value": round(total_net_worth, 2)
            })
            
        # Sort by value descending
        leaderboard_data.sort(key=lambda x: x["portfolio_value"], reverse=True)
        
        # Add ranks
        ranked_leaderboard = []
        for i, entry in enumerate(leaderboard_data[:10]): # Top 10
            entry["rank"] = i + 1
            ranked_leaderboard.append(entry)
            
        return {"leaderboard": ranked_leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ RUN SERVER ============
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
