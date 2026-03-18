export interface Investment {
    id: string; // This corresponds to asset_id
    investmentId?: string; // Add this if needed for the backend /sell endpoint
    username: string;
    investedAt: string;
    thumbnail: string;
    videoUrl: string;
    viewsOnInvestment: number;
    likesOnInvestment: number;
    currentViews: number;
    currentLikes: number;
    performance: number; // percentage change
    shares: number;
    currentPrice: number;
    investedCoins: number;
}
