import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { ActivityIndicator, Alert } from 'react-native';
import PerformanceChart from '@/components/PerformanceChart';
import PortfolioInvestmentCard from '@/components/PortfolioInvestmentCard';
import TikTokVideoPlayer from '@/components/TikTokVideoPlayer';
import { mockPortfolio, chartData, Investment } from '@/constants/mockData';

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type SortOption = 'performance' | 'recent' | 'value';

export default function PortfolioScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [sortBy, setSortBy] = useState<SortOption>('performance');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  // Initialize with empty array, will fetch from API
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded user ID for demo
  const USER_ID = "user1";

  React.useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPortfolio(USER_ID);
      if (data && data.investments) {
        const mappedInvestments: Investment[] = data.investments.map(item => ({
          id: item.asset_id,
          username: item.author || 'Unknown',
          investedAt: 'Just now', // API doesn't return date
          thumbnail: `https://picsum.photos/seed/${item.asset_id}/200/300`,
          videoUrl: item.video_url,
          viewsOnInvestment: 0, // Not provided
          likesOnInvestment: 0, // Not provided
          currentViews: 0, // Not provided in list
          currentLikes: 0, // Not provided in list
          performance: item.profit_loss_percent
        }));
        setInvestments(mappedInvestments);
      } else {
        // Fallback to mock if API fails or empty? 
        // User requested "switch to real API calls", so let's stick to empty or what API returns.
        // But if API is down, maybe show empty.
      }
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
    } finally {
      setIsLoading(false);
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
              const investResult = await api.investInVideo(USER_ID, scrapeResult.asset_id!, 100);

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello {mockPortfolio.username},</Text>
          <Text style={styles.subGreeting}>
            You invested in {mockPortfolio.weeklyInvestments} videos this week.
          </Text>
        </View>

        {/* Account Balance */}
        <View style={styles.accountSection}>
          <Text style={styles.accountLabel}>Your Account</Text>
          <Text style={styles.balance}>
            ${mockPortfolio.accountBalance.toLocaleString('en-US', {
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
              <Text style={styles.statValue}>{mockPortfolio.totalAssets}</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4A9D8E" />
              </View>
              <Text style={styles.statLabel}>Invested</Text>
              <Text style={styles.statValue}>{mockPortfolio.totalInvested}</Text>
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
            <Text style={styles.portfolioTitle}>{mockPortfolio.username}'s Portfolio</Text>
            <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
              <Text style={styles.sortText}>Sort</Text>
              <Ionicons name="chevron-down" size={16} color="#4A9D8E" />
            </TouchableOpacity>
          </View>

          {sortedInvestments.map((investment) => (
            <PortfolioInvestmentCard
              key={investment.id}
              investment={investment}
              onPress={() => {
                setSelectedInvestment(investment);
                setIsVideoVisible(true);
              }}
            />
          ))}
        </View>

        {/* Video Player Modal */}
        <Modal
          visible={isVideoVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsVideoVisible(false)}
        >
          {selectedInvestment && (
            <TikTokVideoPlayer
              investment={selectedInvestment}
              onClose={() => setIsVideoVisible(false)}
            />
          )}
        </Modal>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <ActivityIndicator size="large" color="#4A9D8E" />
        </View>
      )}
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
});