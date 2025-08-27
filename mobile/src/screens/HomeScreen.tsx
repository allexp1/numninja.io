import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { HomeStackParamList } from '../navigation/RootNavigator';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface UserNumber {
  id: string;
  number: string;
  country: string;
  areaCode: string;
  status: 'active' | 'pending' | 'suspended';
  monthlyFee: number;
  smsEnabled: boolean;
  forwardingEnabled: boolean;
  expiresAt: string;
}

interface Stats {
  totalCalls: number;
  totalSms: number;
  totalMinutes: number;
  todayCalls: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [numbers, setNumbers] = useState<UserNumber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [numbersResponse, statsResponse] = await Promise.all([
        api.getMyNumbers(),
        api.get('/user/stats'),
      ]);
      setNumbers(numbersResponse.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderStatCard = (icon: string, label: string, value: string | number, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderNumberCard = (number: UserNumber) => (
    <TouchableOpacity
      key={number.id}
      style={styles.numberCard}
      onPress={() => navigation.navigate('NumberDetail', { number: number.number })}
    >
      <View style={styles.numberCardHeader}>
        <View>
          <Text style={styles.numberText}>{number.number}</Text>
          <Text style={styles.numberCountry}>
            {number.country.toUpperCase()} • {number.areaCode}
          </Text>
        </View>
        <View style={[styles.statusBadge, 
          number.status === 'active' ? styles.statusActive : 
          number.status === 'pending' ? styles.statusPending : 
          styles.statusSuspended
        ]}>
          <Text style={styles.statusText}>{number.status}</Text>
        </View>
      </View>
      
      <View style={styles.numberCardFooter}>
        <View style={styles.numberFeatures}>
          {number.smsEnabled && (
            <View style={styles.featureBadge}>
              <Ionicons name="chatbubble-outline" size={12} color="#6366f1" />
              <Text style={styles.featureText}>SMS</Text>
            </View>
          )}
          {number.forwardingEnabled && (
            <View style={styles.featureBadge}>
              <Ionicons name="call-outline" size={12} color="#6366f1" />
              <Text style={styles.featureText}>Forwarding</Text>
            </View>
          )}
        </View>
        <Text style={styles.monthlyFee}>${number.monthlyFee}/mo</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'there'}!</Text>
        <Text style={styles.subGreeting}>Here's your NumNinja overview</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard('call', 'Total Calls', stats.totalCalls, '#6366f1')}
            {renderStatCard('chatbubble', 'Total SMS', stats.totalSms, '#10b981')}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard('time', 'Minutes', stats.totalMinutes, '#f59e0b')}
            {renderStatCard('today', 'Today', stats.todayCalls, '#ef4444')}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Numbers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Numbers' as any)}>
            <Text style={styles.sectionAction}>Add New</Text>
          </TouchableOpacity>
        </View>

        {numbers.length > 0 ? (
          <View style={styles.numbersList}>
            {numbers.map(renderNumberCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No numbers yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Numbers' as any)}
            >
              <Text style={styles.addButtonText}>Browse Numbers</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="document-text-outline" size={24} color="#6366f1" />
            <Text style={styles.quickActionText}>View CDRs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="settings-outline" size={24} color="#6366f1" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.quickActionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionAction: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  numbersList: {
    gap: 10,
  },
  numberCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  numberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  numberCountry: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusSuspended: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  numberCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '500',
  },
  monthlyFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default HomeScreen;