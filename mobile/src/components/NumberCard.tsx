import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumberCardProps {
  number: string;
  country: string;
  areaCode: string;
  price: number;
  monthlyFee: number;
  setupFee: number;
  features?: string[];
  onPress?: () => void;
  isInCart?: boolean;
  onAddToCart?: () => void;
}

const NumberCard: React.FC<NumberCardProps> = ({
  number,
  country,
  areaCode,
  price,
  monthlyFee,
  setupFee,
  features = [],
  onPress,
  isInCart = false,
  onAddToCart,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.numberInfo}>
          <Text style={styles.number}>{number}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.location}>
              {country.toUpperCase()} • {areaCode}
            </Text>
          </View>
        </View>
        {isInCart && (
          <View style={styles.inCartBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        )}
      </View>

      <View style={styles.featuresRow}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureBadge}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.pricing}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.price}>${price}</Text>
        </View>
        <View style={styles.fees}>
          <Text style={styles.feeText}>${monthlyFee}/mo</Text>
          {setupFee > 0 && (
            <Text style={styles.setupFee}>+${setupFee} setup</Text>
          )}
        </View>
        {onAddToCart && !isInCart && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  numberInfo: {
    flex: 1,
  },
  number: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  inCartBadge: {
    padding: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  featureBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricing: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  fees: {
    flex: 1,
    alignItems: 'center',
  },
  feeText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  setupFee: {
    fontSize: 12,
    color: '#6b7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NumberCard;