import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, PortfolioResponse } from '@/services/api';
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
  
  // Sell Modal State
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [sellAmountStr, setSellAmountStr] = useState('1');

  // Use real authenticated user ID
  const userId = user?.userId ?? 'user1';
  const username = user?.username ?? 'User';

  // Chart data based on portfolio balance (static shape for now)
  const chartData = [
    { x: 0, y: 1000 },
    { x: 1, y: 1000 },
    { x: 2, y: portfolioData ? portfolioData.balance + portfolioData.total_value : 1000 },
  ];

  React.useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  const fetchPortfolio = async () => {
    setIsLoading(true);
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
            viewsOnInvestment: item.views || 0,
            likesOnInvestment: item.likes || 0,
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
      setIsLoading(false);
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

      // 2. Show confirmation
      Alert.alert(
        "Video Found!",
        `Author: ${scrapeResult.author}\nViews: ${scrapeResult.views}\nLikes: ${scrapeResult.likes}\nPrice: $${scrapeResult.current_price?.toFixed(2)}`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
          {
            text: "Invest (100 coins)",
            onPress: async () => {
              // 3. Invest
              // Note: Using hardcoded 100 coins as per demo flow
              const investResult = await api.investInVideo(userId, scrapeResult.asset_id!, 100);

              if (investResult.success) {
                Alert.alert("Success", "Investment added to your portfolio!");
                setSearchQuery('');
                // Refresh portfolio
                fetchPortfolio();
              } else {
                Alert.alert("Investment Failed", investResult.error || "Unknown error");
              }
              setIsLoading(false);
            }
          }
        ]
      );

    } catch (e) {
      Alert.alert("Error", "An unexpected network error occurred");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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
          <Text style={styles.greeting}>Hello {username},</Text>
          <Text style={styles.subGreeting}>
            You have {investments.length} investment{investments.length !== 1 ? 's' : ''} in your portfolio.
          </Text>
        </View>

        {/* Account Balance */}
        <View style={styles.accountSection}>
          <Text style={styles.accountLabel}>Net Worth</Text>
          <Text style={styles.balance}>
            ${((portfolioData?.balance ?? user?.balance ?? 0) + (portfolioData?.total_value ?? 0)).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.leftoverCoins}>
            Leftover Coins: ${(portfolioData?.balance ?? user?.balance ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
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


          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="wallet-outline" size={20} color="#4A9D8E" />
              </View>
              <Text style={styles.statLabel}>Assets</Text>
              <Text style={styles.statValue}>{investments.length}</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4A9D8E" />
              </View>
              <Text style={styles.statLabel}>Invested</Text>
              <Text style={styles.statValue}>${(portfolioData?.total_invested ?? 0).toFixed(0)}</Text>
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
                setSellAmountStr(investment.shares.toString());
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
        <View style={styles.modalOverlay}>
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
                    <Text style={[styles.tradeValue, { color: '#666' }]}>0.00%</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.confirmSellButton}
                  onPress={async () => {
                    setIsLoading(true);
                    setSellingInvestment(null);
                    
                    try {
                      // Call backend API (sells entire position internally)
                      const result = await api.sellInvestment(userId, sellingInvestment.id);
                      if (result.success) {
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
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  accountLabel: {
    fontSize: 14,
    color: '#4A9D8E',
    fontWeight: '600',
    marginBottom: 4,
  },
  balance: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
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
  statsGrid: {
    gap: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'flex-start',
    gap: 2,
  },
  statIcon: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 12,
  },
  searchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  portfolioSection: {
    paddingHorizontal: 20,
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
    color: '#4A9D8E',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  tradeInfoBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeLabel: {
    fontSize: 14,
    color: '#666',
  },
  tradeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sharesInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  estimatedPayout: {
    fontSize: 14,
    color: '#4A9D8E',
    fontWeight: '500',
  },
  confirmSellButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#FFCDD2',
  },
  confirmSellText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});