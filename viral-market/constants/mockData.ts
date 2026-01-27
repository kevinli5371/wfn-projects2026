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

export interface UserPortfolio {
    username: string;
    accountBalance: number;
    weeklyInvestments: number;
    totalAssets: number;
    totalInvested: number;
    friendsCount: number;
    investments: Investment[];
}

export const mockPortfolio: UserPortfolio = {
    username: 'Bob',
    accountBalance: 1956.70,
    weeklyInvestments: 7,
    totalAssets: 13,
    totalInvested: 791,
    friendsCount: 19,
    investments: [
        {
            id: '1',
            username: '@flyingchicken',
            investedAt: 'a week ago',
            thumbnail: 'https://picsum.photos/seed/1/200/300',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-white-dress-dancing-in-nature-42999-large.mp4',
            viewsOnInvestment: 738,
            likesOnInvestment: 125000,
            currentViews: 300000,
            currentLikes: 53000,
            performance: 450,
        },
        {
            id: '2',
            username: '@streetseagull_6767',
            investedAt: 'a month ago',
            thumbnail: 'https://picsum.photos/seed/2/200/300',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-42875-large.mp4',
            viewsOnInvestment: 297000,
            likesOnInvestment: 891,
            currentViews: 11000,
            currentLikes: 121,
            performance: -73.6,
        },
        {
            id: '3',
            username: '@flyingchicken',
            investedAt: '2 days ago',
            thumbnail: 'https://picsum.photos/seed/3/200/300',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-skating-42959-large.mp4',
            viewsOnInvestment: 893,
            likesOnInvestment: 23,
            currentViews: 1067,
            currentLikes: 59,
            performance: 3.5,
        },
        {
            id: '4',
            username: '@flyingchicken',
            investedAt: '3 months ago',
            thumbnail: 'https://picsum.photos/seed/4/200/300',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-on-the-street-42981-large.mp4',
            viewsOnInvestment: 7890,
            likesOnInvestment: 345,
            currentViews: 18000,
            currentLikes: 788,
            performance: 477,
        },
    ],
};

export const chartData = [
    { x: 0, y: 1200 },
    { x: 1, y: 1150 },
    { x: 2, y: 1300 },
    { x: 3, y: 1250 },
    { x: 4, y: 1400 },
    { x: 5, y: 1500 },
    { x: 6, y: 1450 },
    { x: 7, y: 1600 },
    { x: 8, y: 1700 },
    { x: 9, y: 1650 },
    { x: 10, y: 1800 },
    { x: 11, y: 1900 },
    { x: 12, y: 1956.70 },
];
