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

# ============ IN-MEMORY DATABASE ============
# Temporary storage for the session (resets on restart)
ASSETS_DB = {}  # asset_id -> { asset data }
PORTFOLIO_DB = {}  # user_id -> [ { investment data } ]
USER_BALANCES = {
    "user1": 1000.0,
    "testuser": 5000.0
}

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

from backend.app.services.scraper import get_tiktok_data

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
        
        # GENERATE ASSET ID
        # simplified ID for readability
        asset_id = f"asset_{author}_{views}"
        
        # SAVE TO DB
        ASSETS_DB[asset_id] = {
            "asset_id": asset_id,
            "video_url": video_url,
            "author": author,
            "views": views,
            "likes": likes,
            "current_price": current_price,
            "last_updated": datetime.utcnow().isoformat()
        }
        
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
        # 1. Get User Balance
        user_balance = USER_BALANCES.get(request.user_id, 0.0)
        
        # 2. Get Asset Details
        asset = ASSETS_DB.get(request.asset_id)
        if not asset:
            # If not in DB, maybe it's a cold start or invalid ID
            # In a real app we might try to fetch it from DB, but here we expect it to be in ASSETS_DB (from scrape)
            raise HTTPException(status_code=404, detail="Asset not found. Please Search/Scrape first.")
            
        asset_price = asset["current_price"]
        
        # 3. Validate Funds
        if user_balance < request.amount_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient funds. Balance: ${user_balance:.2f}, Required: ${request.amount_coins:.2f}"
            )
        
        # 4. Execute Trade
        shares = request.amount_coins / asset_price if asset_price > 0 else 0
        new_balance = user_balance - request.amount_coins
        
        # Update Balance
        USER_BALANCES[request.user_id] = new_balance
        
        # Create Investment Record
        investment_id = f"inv_{request.user_id}_{int(datetime.utcnow().timestamp())}"
        
        investment_record = {
            "investment_id": investment_id,
            "asset_id": request.asset_id,
            "video_url": asset["video_url"],
            "author": asset["author"],
            "shares_owned": shares,
            "buy_price": asset_price,
            "cost_basis": request.amount_coins,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add to Portfolio
        if request.user_id not in PORTFOLIO_DB:
            PORTFOLIO_DB[request.user_id] = []
        PORTFOLIO_DB[request.user_id].append(investment_record)
        
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
        # Get User Balance
        balance = USER_BALANCES.get(user_id, 0.0)
        
        # Get User Investments
        user_investments = PORTFOLIO_DB.get(user_id, [])
        
        portfolio_items = []
        total_invested = 0.0
        total_value = 0.0
        
        for inv in user_investments:
            # Get current asset info (price might have changed)
            asset_id = inv["asset_id"]
            asset_info = ASSETS_DB.get(asset_id)
            
            # If asset info missing (shouldn't happen in memory), fallback to buy data
            current_price = asset_info["current_price"] if asset_info else inv["buy_price"]
            
            # Calculate metrics
            shares = inv["shares_owned"]
            buy_price = inv["buy_price"]
            cost_basis = inv["cost_basis"]
            
            curr_val = shares * current_price
            p_l = curr_val - cost_basis
            p_l_percent = (p_l / cost_basis * 100) if cost_basis > 0 else 0
            
            # Add to totals
            total_invested += cost_basis
            total_value += curr_val
            
            # Create Item
            item = PortfolioItem(
                asset_id=asset_id,
                video_url=inv.get("video_url", ""),
                author=inv.get("author", "Unknown"),
                shares=shares,
                buy_price=buy_price,
                current_price=current_price,
                current_value=curr_val,
                profit_loss=p_l,
                profit_loss_percent=p_l_percent
            )
            portfolio_items.append(item)
            
        total_pl = total_value - total_invested
        
        return PortfolioResponse(
            user_id=user_id,
            balance=balance,
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
        return {
            "success": True,
            "message": "Sell endpoint - TODO: Implement"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assets/refresh")
async def refresh_asset_prices():
    """
    CRON JOB: Re-scrape all assets to update prices
    """
    try:
        return {
            "success": True,
            "message": "Price refresh endpoint - TODO: Implement",
            "assets_updated": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
async def get_leaderboard():
    """
    Get top users by portfolio value
    """
    try:
        return {
            "leaderboard": [
                {"rank": 1, "username": "user1", "portfolio_value": 5000},
                {"rank": 2, "username": "user2", "portfolio_value": 3500},
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ RUN SERVER ============
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)