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
  const [isInvestModalVisible, setIsInvestModalVisible] = useState(false);
  const [scrapedVideoInfo, setScrapedVideoInfo] = useState<any>(null);
  const [investmentAmount, setInvestmentAmount] = useState('100');

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

      // 2. Show Modal
      setScrapedVideoInfo(scrapeResult);
      setInvestmentAmount('100'); // Default
      setIsInvestModalVisible(true);
      setIsLoading(false);

    } catch (e) {
      Alert.alert("Error", "An unexpected network error occurred");
      setIsLoading(false);
    }
  };

  const confirmInvestment = async () => {
    const amount = parseInt(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid investment amount.");
      return;
    }

    setIsLoading(true);
    setIsInvestModalVisible(false);

    try {
      const investResult = await api.investInVideo(USER_ID, scrapedVideoInfo.asset_id, amount);

      if (investResult.success) {
        Alert.alert("Success", "Investment added to your portfolio!");
        setSearchQuery('');
        fetchPortfolio();
      } else {
        Alert.alert("Investment Failed", investResult.error || "Unknown error");
      }
    } catch (e) {
      Alert.alert("Error", "An unexpected network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello Bob,</Text>
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

          {/* Side Stats Column */}
          <View style={styles.statsColumn}>
            <View style={styles.statContainer}>
              <Ionicons name="wallet-outline" size={32} color="#4A9D8E" />
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Invested</Text>
                <Text style={styles.statValue}>{mockPortfolio.totalInvested}</Text>
              </View>
            </View>

            <View style={styles.statContainer}>
              <Ionicons name="people-outline" size={32} color="#4A9D8E" />
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Friends</Text>
                <Text style={styles.statValue}>19</Text>
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
            <Ionicons name="add" size={20} color="#FFFFFF" />
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
              <Ionicons name="arrow-down" size={12} color="#666" />
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

        {/* Invest Modal */}
        <Modal
          visible={isInvestModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsInvestModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Invest in Video</Text>

              {scrapedVideoInfo && (
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalAuthor}>@{scrapedVideoInfo.author}</Text>

                  <View style={styles.modalStatsRow}>
                    <View style={styles.modalStat}>
                      <Ionicons name="eye-outline" size={16} color="#666" />
                      <Text style={styles.modalStatText}>
                        {scrapedVideoInfo.views >= 1000000
                          ? (scrapedVideoInfo.views / 1000000).toFixed(1) + 'M'
                          : scrapedVideoInfo.views >= 1000
                            ? (scrapedVideoInfo.views / 1000).toFixed(1) + 'K'
                            : scrapedVideoInfo.views}
                      </Text>
                    </View>
                    <View style={styles.modalStat}>
                      <Ionicons name="heart-outline" size={16} color="#666" />
                      <Text style={styles.modalStatText}>
                        {scrapedVideoInfo.likes >= 1000000
                          ? (scrapedVideoInfo.likes / 1000000).toFixed(1) + 'M'
                          : scrapedVideoInfo.likes >= 1000
                            ? (scrapedVideoInfo.likes / 1000).toFixed(1) + 'K'
                            : scrapedVideoInfo.likes}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Investment Amount</Text>
              <View style={styles.amountInputContainer}>
                <Ionicons name="wallet-outline" size={20} color="#888" style={styles.amountCurrency} />
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={investmentAmount}
                  onChangeText={setInvestmentAmount}
                  placeholder="100"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsInvestModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalInvestButton}
                  onPress={confirmInvestment}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalInvestText}>Invest Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    backgroundColor: '#F9F8F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 48,
    fontWeight: '700',
    color: '#444',
    marginBottom: -4,
    fontFamily: 'CircularStd',
    letterSpacing: -1,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  accountSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  chartStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 20,
    alignItems: 'center',
  },
  chartBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timePeriodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  periodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4A9D8E',
  },
  periodText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
  periodTextActive: {
    color: '#FFFFFF',
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
    fontSize: 13,
    color: '#666',
    fontFamily: 'Futura',
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  modalTitle: {
    fontSize: 28,
    color: '#333',
    fontFamily: 'CircularStd',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  modalInfoBox: {
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
  modalAuthor: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E7B77',
    fontFamily: 'Futura',
    marginBottom: 12,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  modalPriceLabel: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Futura',
  },
  modalPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#444',
    fontFamily: 'CircularStd',
    letterSpacing: -0.5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Futura',
    marginBottom: 8,
    marginLeft: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 32,
  },
  amountCurrency: {
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    fontFamily: 'Futura',
    fontWeight: '600',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
  modalInvestButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#3E7B77',
    alignItems: 'center',
  },
  modalInvestText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Futura',
  },
});