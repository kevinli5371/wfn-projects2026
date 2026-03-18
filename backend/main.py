"""
Viral Market - FastAPI Backend
Main application file with all API endpoints
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import os
import hashlib
import random
import string
import uuid
from datetime import datetime
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
    thumbnail: str = ""

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

        # ✅ Save to Supabase (Upsert in case it was already scraped)
        supabase.table("videos").upsert({
            "asset_id": asset_id,
            "video_url": video_url,
            "author": author,
            "views": views,
            "likes": likes,
            "current_price": current_price,
            "thumbnail": thumbnail
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
            "timestamp": datetime.utcnow().isoformat()
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
            
            curr_val = shares * current_price
            p_l = curr_val - cost_basis
            p_l_percent = (p_l / cost_basis * 100) if cost_basis > 0 else 0
            
            total_invested += cost_basis
            total_value += curr_val
            
            views = asset_info.get("views", 0) if asset_info else 0
            likes = asset_info.get("likes", 0) if asset_info else 0
            thumbnail = asset_info.get("thumbnail", "") if asset_info else ""
            
            item = PortfolioItem(
                asset_id=asset_id,
                video_url=video_url,
                author=author,
                shares=shares,
                buy_price=buy_price,
                current_price=current_price,
                current_value=curr_val,
                profit_loss=p_l,
                profit_loss_percent=p_l_percent,
                views=views,
                likes=likes,
                thumbnail=thumbnail
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
async def sell_investment(user_id: str, investment_id: str):
    try:
        return {"success": True, "message": "Sell endpoint - TODO: Implement"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        videos_res = supabase.table("videos").select("asset_id, current_price").execute()
        
        videos_price_map = {v["asset_id"]: v["current_price"] for v in videos_res.data}
        
        user_portfolio_values = {}
        for u in users_res.data:
            user_portfolio_values[u["user_id"]] = u["balance"]
            
        for inv in investments_res.data:
            uid = inv["user_id"]
            asset_id = inv["asset_id"]
            shares = inv["shares_owned"]
            curr_price = videos_price_map.get(asset_id, inv["buy_price"])
            val = shares * curr_price
            if uid in user_portfolio_values:
                user_portfolio_values[uid] += val
                
        leaderboard = []
        for uid, total_val in user_portfolio_values.items():
            leaderboard.append({
                "username": uid,
                "portfolio_value": total_val
            })
            
        leaderboard.sort(key=lambda x: x["portfolio_value"], reverse=True)
        
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
        
        supabase.table("users").insert({
            "user_id": user_id,
            "username": request.username,
            "email": request.email,
            "password_hash": hash_password(request.password),
            "balance": 1000.0
        }).execute()
        
        return AuthResponse(success=True, user_id=user_id, username=request.username, balance=1000.0)
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