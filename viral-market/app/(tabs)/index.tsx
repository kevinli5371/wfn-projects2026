import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Linking,
  Modal,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api, PortfolioResponse, ScrapeResponse } from '@/services/api';
import { ActivityIndicator, Alert } from 'react-native';
import PerformanceChart from '@/components/PerformanceChart';
import PortfolioInvestmentCard from '@/components/PortfolioInvestmentCard';
import { Investment } from '@/constants/data';
import { useAuth } from '@/contexts/AuthContext';

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type SortOption = 'performance' | 'recent' | 'value';

export default function PortfolioScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [sortBy, setSortBy] = useState<SortOption>('performance');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'money' | 'likes' | 'views'>('money');
  
  // Sell Modal State
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [sellAmountStr, setSellAmountStr] = useState('1');

  // Invest Modal State
  const [investingVideo, setInvestingVideo] = useState<ScrapeResponse | null>(null);
  const [investAmountStr, setInvestAmountStr] = useState('100');
  const [isAdditionalBuy, setIsAdditionalBuy] = useState(false);

  // Use real authenticated user ID
  const userId = user?.userId ?? 'user1';
  const username = user?.username ?? 'User';
  const displayName = user?.display_name ?? username;
  const profilePictureUrl = user?.profile_picture_url;

  // Auto-refresh logic state
  const isAutoRefreshing = useRef(false);
  const lastScrapeTimeMap = useRef<{ [key: string]: number }>({});
  const investmentsRef = useRef<Investment[]>([]);

  // Update ref whenever investments change so autoRefresh has latest data
  useEffect(() => {
    investmentsRef.current = investments;
  }, [investments]);

  useEffect(() => {
    fetchPortfolio();

    // Polling interval: every 10 seconds
    const interval = setInterval(() => {
      runAutoRefresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const runAutoRefresh = async () => {
    // Prevent overlapping runs
    if (isAutoRefreshing.current) return;
    isAutoRefreshing.current = true;
    setIsBackgroundLoading(true);

    try {
      // 1. Always re-fetch portfolio to update UI with latest decay/growth
      await fetchPortfolio(true);

      // 2. Refresh each video that hasn't been scraped in > 10 seconds
      if (investmentsRef.current.length > 0) {
        const now = Date.now();
        const staleAssetIds = investmentsRef.current
          .filter(inv => {
            const lastTime = lastScrapeTimeMap.current[inv.id] || 0;
            return now - lastTime >= 10000;
          })
          .map(inv => inv.id);

        if (staleAssetIds.length > 0) {
          console.log(`[AutoRefresh] Updating ${staleAssetIds.length} stale videos...`);
          const refreshResult = await api.refreshVideos(staleAssetIds);
          
          if (refreshResult.success) {
            // Update the map for these IDs
            staleAssetIds.forEach(id => {
              lastScrapeTimeMap.current[id] = Date.now();
            });
            // Final fetch to catch the new scraped data
            await fetchPortfolio(true);
          }
        }
      }
    } catch (e) {
      console.error("[AutoRefresh] Error during update:", e);
    } finally {
      isAutoRefreshing.current = false;
      setIsBackgroundLoading(false);
    }
  };

  // Chart data based on portfolio balance (static shape for now)
  const chartData = [
    { x: 0, y: 1000 },
    { x: 1, y: 1000 },
    { x: 2, y: portfolioData ? portfolioData.balance + portfolioData.total_value : 1000 },
  ];

  const fetchPortfolio = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.getPortfolio(userId);
      if (data) {
        setPortfolioData(data);
        if (data.investments) {
          const mappedInvestments: Investment[] = data.investments.map(item => ({
            id: item.asset_id,
            username: item.author || 'Unknown',
            investedAt: 'Recently',
            thumbnail: item.thumbnail || `https://picsum.photos/seed/${item.asset_id}/200/300`,
            videoUrl: item.video_url,
            viewsOnInvestment: item.views_at_purchase || 0,
            likesOnInvestment: item.likes_at_purchase || 0,
            currentViews: item.views || 0,
            currentLikes: item.likes || 0,
            performance: item.profit_loss_percent,
            shares: item.shares || 0,
            currentPrice: item.current_price || 0,
            investedCoins: (item.shares || 0) * (item.buy_price || 0),
            viewHistory: item.view_history || [],
            likeHistory: item.like_history || []
          }));
          setInvestments(mappedInvestments);
        }
      }
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    if (investments.length === 0) {
      await fetchPortfolio();
      return;
    }
    setIsRefreshing(true);
    try {
      const assetIds = investments.map(inv => inv.id);
      console.log('Refreshing', assetIds.length, 'videos...');
      const refreshResult = await api.refreshVideos(assetIds);
      console.log('Refresh result:', refreshResult);
      // Now re-fetch portfolio with updated prices and history arrays
      await fetchPortfolio();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const timePeriods: TimePeriod[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const sortedInvestments = [...investments].sort((a, b) => {
    if (sortBy === 'performance') {
      return b.performance - a.performance;
    } else if (sortBy === 'recent') {
      // Would sort by date in real implementation
      return 0;
    }
    return 0;
  });

  const toggleSort = () => {
    const options: SortOption[] = ['performance', 'recent', 'value'];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  };

  const handleAddInvestment = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // 1. Scrape content
      const scrapeResult = await api.scrapeVideo(searchQuery);

      if (!scrapeResult.success || !scrapeResult.asset_id) {
        Alert.alert("Error", scrapeResult.error || "Failed to scrape video");
        setIsLoading(false);
        return;
      }

      // 2. Show Invest Modal
      setIsAdditionalBuy(false);
      setInvestingVideo(scrapeResult);
      setInvestAmountStr('100');
      setIsLoading(false);

    } catch (e) {
      Alert.alert("Error", "An unexpected network error occurred");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {isBackgroundLoading && (
        <View style={styles.topLoadingBarContainer}>
          <View style={styles.topLoadingBar} />
        </View>
      )}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#4A9D8E"
            title="Refreshing data & histories..."
            titleColor="#4A9D8E"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hello {displayName},</Text>
            <Text style={styles.subGreeting}>
              You have {investments.length} investment{investments.length !== 1 ? 's' : ''} in your portfolio.
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            {profilePictureUrl ? (
              <Image source={{ uri: profilePictureUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Balance */}
        <View style={styles.accountSection}>
          <Text style={styles.accountLabel}>
            {displayMode === 'likes' ? 'Likes Gained' : displayMode === 'views' ? 'Views Gained' : 'Your Account'}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>
              {displayMode === 'likes'
                ? investments.reduce((sum, inv) => sum + (inv.currentLikes - inv.likesOnInvestment), 0).toLocaleString('en-US')
                : displayMode === 'views'
                  ? investments.reduce((sum, inv) => sum + (inv.currentViews - inv.viewsOnInvestment), 0).toLocaleString('en-US')
                  : '$' + ((portfolioData?.balance ?? user?.balance ?? 0) + (portfolioData?.total_value ?? 0)).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                if (displayMode === 'money') setDisplayMode('likes');
                else if (displayMode === 'likes') setDisplayMode('views');
                else setDisplayMode('money');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={displayMode === 'likes' ? 'eye-outline' : displayMode === 'views' ? 'cash-outline' : 'heart-outline'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          {displayMode === 'money' && (
             <Text style={styles.leftoverCoins}>
               Leftover Coins: ${(portfolioData?.balance ?? user?.balance ?? 0).toLocaleString('en-US', {
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
               })}
             </Text>
          )}
        </View>

        {/* Chart and Stats Row */}
        <View style={styles.chartStatsRow}>
          {/* Performance Chart Box */}
          <View style={styles.chartBox}>
            <PerformanceChart data={chartData} />

            {/* Time Period Selector */}
            <View style={styles.timePeriodSelector}>
              {timePeriods.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period && styles.periodTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Side Stats Column */}
          <View style={styles.statsColumn}>
            <View style={styles.statContainer}>
              <Ionicons name="wallet-outline" size={32} color="#4A9D8E" />
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Invested</Text>
                <Text style={styles.statValue}>${(portfolioData?.total_invested ?? 0).toFixed(0)}</Text>
              </View>
            </View>

            <View style={styles.statContainer}>
              <Ionicons name="cube-outline" size={32} color="#4A9D8E" />
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Assets</Text>
                <Text style={styles.statValue}>{investments.length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search/Investment Input Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={handleAddInvestment}
          >
            <Ionicons name="add-circle" size={24} color="#4A9D8E" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="What do you want to invest in?"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleAddInvestment}
          />
        </View>

        {/* Portfolio List */}
        <View style={styles.portfolioSection}>
          <View style={styles.portfolioHeader}>
            <Text style={styles.portfolioTitle}>{username}'s Portfolio</Text>
            <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
              <Text style={styles.sortText}>Sort</Text>
              <Ionicons name="chevron-down" size={16} color="#4A9D8E" />
            </TouchableOpacity>
          </View>

          {sortedInvestments.map((investment, index) => (
            <PortfolioInvestmentCard
              key={`${investment.id}-${index}`}
              investment={investment}
              onPress={() => {
                if (investment.videoUrl) {
                  Linking.openURL(investment.videoUrl).catch(err => {
                    console.error("Failed to open URL:", err);
                    Alert.alert("Error", "Could not open this link.");
                  });
                }
              }}
              onSellPress={() => {
                setSellingInvestment(investment);
                const totalStakeValue = investment.investedCoins * (1 + investment.performance / 100);
                setSellAmountStr(totalStakeValue.toFixed(2));
              }}
              onBuyPress={() => {
                setIsAdditionalBuy(true);
                setInvestingVideo({
                  success: true,
                  asset_id: investment.id,
                  video_url: investment.videoUrl,
                  views: investment.currentViews,
                  likes: investment.currentLikes,
                  author: investment.username,
                  current_price: investment.currentPrice,
                });
                setInvestAmountStr('100');
              }}
            />
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <ActivityIndicator size="large" color="#4A9D8E" />
        </View>
      )}

      {/* Sell Modal */}
      <Modal
        visible={!!sellingInvestment}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSellingInvestment(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sell Investment</Text>
              <TouchableOpacity onPress={() => setSellingInvestment(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {sellingInvestment && (
              <>
                <Text style={styles.modalSubtitle}>
                  {sellingInvestment.username}'s Video
                </Text>

                <View style={styles.tradeInfoBox}>
                  {/* Investment Row */}
                  <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>Invested Coins:</Text>
                    <Text style={[styles.tradeValue, { fontSize: 18, color: '#4A9D8E' }]}>
                      {(sellingInvestment.investedCoins).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Bought At Stats */}
                  <Text style={styles.sectionHeading}>Bought At</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="eye-outline" size={14} color="#666" />
                      <Text style={styles.statChipText}>{(sellingInvestment.viewsOnInvestment / 1000).toFixed(1)}k</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="heart-outline" size={14} color="#666" />
                      <Text style={styles.statChipText}>{(sellingInvestment.likesOnInvestment / 1000).toFixed(1)}k</Text>
                    </View>
                  </View>

                  {/* Current Stats */}
                  <Text style={styles.sectionHeading}>Current</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="eye" size={14} color="#666" />
                      <Text style={styles.statChipText}>{(sellingInvestment.currentViews / 1000).toFixed(1)}k</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="heart" size={14} color="#666" />
                      <Text style={styles.statChipText}>{(sellingInvestment.currentLikes / 1000).toFixed(1)}k</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>Profit / Loss:</Text>
                    <Text style={[styles.tradeValue, { color: sellingInvestment.performance >= 0 ? '#4A9D8E' : '#E74C3C' }]}>
                      {sellingInvestment.performance >= 0 ? '+' : ''}{sellingInvestment.performance.toFixed(2)}%
                    </Text>
                  </View>

                  <View style={styles.tradeRow}>
                    <Text style={[styles.tradeLabel, { fontWeight: '600' }]}>Total Stake Value:</Text>
                    <Text style={[styles.tradeValue, { fontWeight: '600' }]}>
                      🪙 {(sellingInvestment.investedCoins * (1 + sellingInvestment.performance / 100)).toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.inputSection, { marginTop: 12, marginBottom: 4 }]}>
                    <Text style={styles.inputLabel}>Amount to Sell (Coins)</Text>
                    <TextInput
                      style={styles.sharesInput}
                      value={sellAmountStr}
                      onChangeText={setSellAmountStr}
                      keyboardType="numeric"
                      placeholder="e.g. 50"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.tradeRow}>
                    <Text style={[styles.tradeLabel, { color: '#E74C3C' }]}>Transaction Fee (1%):</Text>
                    <Text style={[styles.tradeValue, { color: '#E74C3C' }]}>
                      -{(Number(sellAmountStr) * 0.01 || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.tradeRow}>
                    <Text style={[styles.tradeLabel, { fontWeight: '700' }]}>You'll Receive:</Text>
                    <Text style={[styles.tradeValue, { fontSize: 20, fontWeight: '800', color: '#333' }]}>
                      🪙 {(Number(sellAmountStr) * 0.99 || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmSellButton, (!sellAmountStr || isNaN(Number(sellAmountStr))) && styles.disabledButton]}
                  disabled={!sellAmountStr || isNaN(Number(sellAmountStr))}
                  onPress={async () => {
                    const amount = Number(sellAmountStr);
                    const maxValue = sellingInvestment.investedCoins * (1 + sellingInvestment.performance / 100);
                    
                    if (amount <= 0 || amount > maxValue + 0.01) {
                      Alert.alert("Invalid Amount", "Please enter an amount greater than 0 and up to your total stake value.");
                      return;
                    }

                    setIsLoading(true);
                    setSellingInvestment(null);

                    try {
                      const result = await api.sellInvestment(userId, sellingInvestment.id, amount);
                      if (result.success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("Success", "Position cashed out successfully!");
                        fetchPortfolio(); // Refresh portfolio UI
                      } else {
                        Alert.alert("Error", result.error || "Failed to sell position");
                        setSellingInvestment(sellingInvestment); // Re-open if failed
                      }
                    } catch (error) {
                      Alert.alert("Error", "Network error occurred.");
                      setSellingInvestment(sellingInvestment);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <Text style={styles.confirmSellText}>Confirm Sale</Text>
                </TouchableOpacity>
              </>
            )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Invest Modal */}
      <Modal
        visible={!!investingVideo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInvestingVideo(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Investment</Text>
                <TouchableOpacity onPress={() => setInvestingVideo(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {investingVideo && (
                <>
                  <Text style={styles.modalSubtitle}>
                    {investingVideo.author}'s Video
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="eye" size={14} color="#666" />
                      <Text style={styles.statChipText}>{((investingVideo.views || 0) / 1000).toFixed(1)}k</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="heart" size={14} color="#666" />
                      <Text style={styles.statChipText}>{((investingVideo.likes || 0) / 1000).toFixed(1)}k</Text>
                    </View>
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Investment Amount (Coins)</Text>
                    <TextInput
                      style={styles.sharesInput}
                      value={investAmountStr}
                      onChangeText={setInvestAmountStr}
                      keyboardType="numeric"
                      placeholder="e.g. 100"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmInvestButton, (!investAmountStr || isNaN(Number(investAmountStr))) && styles.disabledButton]}
                    disabled={!investAmountStr || isNaN(Number(investAmountStr))}
                    onPress={async () => {
                      const amount = Number(investAmountStr);
                      if (amount <= 0) {
                        Alert.alert("Invalid Amount", "Please enter a valid coin amount.");
                        return;
                      }
                      if (amount > ((portfolioData?.balance ?? user?.balance ?? 0))) {
                        Alert.alert("Insufficient Balance", "You don't have enough coins for this investment.");
                        return;
                      }

                      setIsLoading(true);
                      setInvestingVideo(null); // Hide modal while loading

                      try {
                        const investResult = await api.investInVideo(userId, investingVideo.asset_id!, amount, isAdditionalBuy);

                        if (investResult.success) {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert("Success", "Investment added to your portfolio!");
                          setSearchQuery('');
                          fetchPortfolio(); // Refresh
                        } else {
                          Alert.alert("Investment Failed", investResult.error || "Unknown error");
                          setInvestingVideo(investingVideo); // Re-open
                        }
                      } catch (e) {
                        Alert.alert("Error", "An unexpected network error occurred.");
                        setInvestingVideo(investingVideo);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <Text style={styles.confirmSellText}>Confirm Investment</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 16,
  },
  headerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
  },
  accountSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A9D8E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  accountLabel: {
    fontSize: 18,
    color: '#3E7B77',
    fontWeight: '600',
    fontFamily: 'Futura',
    marginBottom: 0,
  },
  balance: {
    fontSize: 52,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'CircularStd',
    letterSpacing: -1.5,
  },
  leftoverCoins: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  chartStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 12,
    alignItems: 'stretch',
  },
  chartBox: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  timePeriodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    minWidth: 32,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4A9D8E',
  },
  periodText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
  },
  statsColumn: {
    justifyContent: 'center',
    gap: 24,
    paddingRight: 8,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statTextGroup: {
    alignItems: 'flex-start',
  },
  statIcon: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Futura',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A9D8E',
    fontFamily: 'CircularStd',
    marginTop: -2,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 12,
  },
  searchIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3E7B77',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontStyle: 'italic',
  },
  portfolioSection: {
    paddingHorizontal: 24,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E7B77',
    fontFamily: 'CircularStd',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#4A9D8E',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F9F8F6',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    color: '#333',
    fontFamily: 'CircularStd',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E7B77',
    fontFamily: 'Futura',
    marginBottom: 12,
  },
  tradeInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'Futura',
  },
  tradeValue: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'CircularStd',
  },
  sectionHeading: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginVertical: 12,
  },
  inputSection: {
    marginBottom: 24,
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Futura',
    marginBottom: 8,
    marginLeft: 8,
  },
  sharesInput: {
    backgroundColor: '#EBEBEB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#333',
    fontFamily: 'Futura',
    fontWeight: '600',
  },
  estimatedPayout: {
    fontSize: 14,
    color: '#4A9D8E',
    fontWeight: '500',
  },
  confirmSellButton: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  confirmInvestButton: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#3E7B77',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmSellText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
  topLoadingBarContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(74, 157, 142, 0.1)',
    zIndex: 2000,
  },
  topLoadingBar: {
    height: '100%',
    width: '40%',
    backgroundColor: '#4A9D8E',
    borderRadius: 3,
  },
});