export interface Investment {
    id: string;
    username: string;
    investedAt: string;
    thumbnail: string;
    videoUrl: string;
    viewsOnInvestment: number;
    likesOnInvestment: number;
    currentViews: number;
    currentLikes: number;
    performance: number; // percentage change
}
