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
        
        return ScrapeResponse(
            success=True,
            asset_id="asset_" + author + "_" + str(views), # meaningful ID
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
        # MOCK DATA
        user_balance = 1000.0
        asset_price = 125.0
        
        # Validate user has enough balance
        if user_balance < request.amount_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient funds. Balance: ${user_balance}, Required: ${request.amount_coins}"
            )
        
        # Calculate shares
        shares = request.amount_coins / asset_price
        new_balance = user_balance - request.amount_coins
        
        return InvestResponse(
            success=True,
            investment_id="inv_123",
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
        # MOCK DATA
        mock_investments = [
            PortfolioItem(
                asset_id="asset_1",
                video_url="https://tiktok.com/@user/video/123",
                author="testuser",
                shares=5.0,
                buy_price=100.0,
                current_price=150.0,
                current_value=750.0,
                profit_loss=250.0,
                profit_loss_percent=50.0
            )
        ]
        
        total_invested = sum(item.shares * item.buy_price for item in mock_investments)
        total_value = sum(item.current_value for item in mock_investments)
        total_pl = total_value - total_invested
        
        return PortfolioResponse(
            user_id=user_id,
            balance=500.0,
            total_invested=total_invested,
            total_value=total_value,
            total_profit_loss=total_pl,
            investments=mock_investments
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
