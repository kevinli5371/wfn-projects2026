
import { Alert } from 'react-native';

const BASE_URL = 'http://localhost:8000';
// const BASE_URL = 'https://wfn-projects2026-production.up.railway.app';


export interface ScrapeResponse {
    success: boolean;
    asset_id?: string;
    video_url: string;
    views?: number;
    likes?: number;
    author?: string;
    current_price?: number;
    error?: string;
}

export interface InvestResponse {
    success: boolean;
    investment_id?: string;
    shares_purchased?: number;
    entry_price?: number;
    total_cost?: number;
    new_balance?: number;
    error?: string;
}

export interface PortfolioItem {
    asset_id: string;
    video_url: string;
    author: string;
    shares: number;
    buy_price: number;
    current_price: number;
    current_value: number;
    profit_loss: number;
    profit_loss_percent: number;
}

export interface PortfolioResponse {
    user_id: string;
    balance: number;
    total_invested: number;
    total_value: number;
    total_profit_loss: number;
    investments: PortfolioItem[];
}

export interface LeaderboardItem {
    rank: number;
    username: string;
    portfolio_value: number;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardItem[];
}

export const api = {
    scrapeVideo: async (videoUrl: string): Promise<ScrapeResponse> => {
        try {
            const response = await fetch(`${BASE_URL}/api/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_url: videoUrl }),
            });
            return await response.json();
        } catch (error) {
            console.error('Scrape error:', error);
            return { success: false, video_url: videoUrl, error: 'Network error during scrape' };
        }
    },

    investInVideo: async (userId: string, assetId: string, amountCoins: number): Promise<InvestResponse> => {
        try {
            const response = await fetch(`${BASE_URL}/api/invest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    asset_id: assetId,
                    amount_coins: amountCoins,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Invest error:', error);
            return { success: false, error: 'Network error during investment' };
        }
    },

    getPortfolio: async (userId: string): Promise<PortfolioResponse | null> => {
        try {
            const response = await fetch(`${BASE_URL}/api/portfolio/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch portfolio');
            return await response.json();
        } catch (error) {
            console.error('Get portfolio error:', error);
            return null;
        }
    },

    getLeaderboard: async (): Promise<LeaderboardResponse | null> => {
        try {
            const response = await fetch(`${BASE_URL}/api/leaderboard`);
            if (!response.ok) throw new Error("Failed to fetch leaderboard");
            return await response.json();
        } catch (error) {
            console.error("Get leaderboard error:", error);
            return null;
        }
    }
};
