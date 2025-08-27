import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useCart } from '../contexts/CartContext';
import NumberCard from '../components/NumberCard';
import { NumbersStackParamList } from '../navigation/RootNavigator';

type NumbersScreenNavigationProp = StackNavigationProp<NumbersStackParamList, 'NumbersList'>;

interface AvailableNumber {
  id: string;
  number: string;
  country: string;
  areaCode: string;
  city?: string;
  price: number;
  monthlyFee: number;
  setupFee: number;
  features: string[];
  type: 'local' | 'toll-free' | 'mobile';
}

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
}

interface AreaCode {
  id: string;
  code: string;
  city: string;
  state?: string;
}

const NumbersScreen: React.FC = () => {
  const navigation = useNavigation<NumbersScreenNavigationProp>();
  const { addToCart, isInCart, itemCount } = useCart();
  
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('us');
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadAreaCodes(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry) {
      loadNumbers();
    }
  }, [selectedCountry, selectedAreaCode]);

  const loadCountries = async () => {
    try {
      const response = await api.get('/numbers/countries');
      setCountries(response.data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadAreaCodes = async (country: string) => {
    try {
      const response = await api.get('/numbers/area-codes', {
        params: { country },
      });
      setAreaCodes(response.data || []);
    } catch (error) {
      console.error('Error loading area codes:', error);
    }
  };

  const loadNumbers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAvailableNumbers(
        selectedCountry,
        selectedAreaCode || undefined
      );
      setNumbers(response.data || []);
    } catch (error) {
      console.error('Error loading numbers:', error);
      Alert.alert('Error', 'Failed to load available numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNumbers();
    setRefreshing(false);
  };

  const handleAddToCart = (number: AvailableNumber) => {
    addToCart({
      id: number.id,
      number: number.number,
      country: number.country,
      areaCode: number.areaCode,
      price: number.price,
      monthlyFee: number.monthlyFee,
      setupFee: number.setupFee,
      features: number.features,
    });
    Alert.alert('Added to Cart', `${number.number} has been added to your cart`);
  };

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter" size={20} color="#6366f1" />
        <Text style={styles.filterButtonText}>Filters</Text>
        <Ionicons 
          name={showFilters ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6366f1" 
        />
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterContent}>
          <Text style={styles.filterLabel}>Country</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {countries.map((country) => (
              <TouchableOpacity
                key={country.id}
                style={[
                  styles.filterChip,
                  selectedCountry === country.code && styles.filterChipActive
                ]}
                onPress={() => setSelectedCountry(country.code)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCountry === country.code && styles.filterChipTextActive
                ]}>
                  {country.flag} {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {areaCodes.length > 0 && (
            <>
              <Text style={styles.filterLabel}>Area Code</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedAreaCode && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedAreaCode('')}
                >
                  <Text style={[
                    styles.filterChipText,
                    !selectedAreaCode && styles.filterChipTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {areaCodes.map((areaCode) => (
                  <TouchableOpacity
                    key={areaCode.id}
                    style={[
                      styles.filterChip,
                      selectedAreaCode === areaCode.code && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedAreaCode(areaCode.code)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedAreaCode === areaCode.code && styles.filterChipTextActive
                    ]}>
                      {areaCode.code} • {areaCode.city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );

  const renderNumber = ({ item }: { item: AvailableNumber }) => (
    <NumberCard
      number={item.number}
      country={item.country}
      areaCode={item.areaCode}
      price={item.price}
      monthlyFee={item.monthlyFee}
      setupFee={item.setupFee}
      features={item.features}
      isInCart={isInCart(item.id)}
      onPress={() => navigation.navigate('NumberDetail', { number: item.number })}
      onAddToCart={() => handleAddToCart(item)}
    />
  );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Available Numbers</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Ionicons name="cart" size={24} color="#6366f1" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {renderFilterSection()}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {numbers.length} {numbers.length === 1 ? 'number' : 'numbers'} found
        </Text>
      </View>
    </>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading available numbers...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={numbers}
      renderItem={renderNumber}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No numbers available</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your filters or check back later
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  filterContent: {
    paddingTop: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 10,
    marginTop: 10,
  },
  filterScroll: {
    marginBottom: 5,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#4b5563',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NumbersScreen;