import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '../contexts/RevenueCatContext';

interface PurchaseButtonProps {
  package?: PurchasesPackage;
  productId?: string;
  price?: string;
  title?: string;
  description?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  package: purchasePackage,
  productId,
  price,
  title = 'Purchase',
  description,
  variant = 'primary',
  size = 'medium',
  onSuccess,
  onError,
  disabled = false,
}) => {
  const { purchasePackage: makePurchase, isSubscribed } = useRevenueCat();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!purchasePackage && !productId) {
      Alert.alert('Error', 'No product selected');
      return;
    }

    setIsLoading(true);
    try {
      if (purchasePackage) {
        await makePurchase(purchasePackage);
      } else {
        // Handle productId purchase if RevenueCat service supports it
        Alert.alert('Error', 'Product ID purchase not implemented');
        return;
      }

      Alert.alert('Success', 'Purchase completed successfully!');
      onSuccess?.();
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong');
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Variant styles
    if (variant === 'primary') baseStyle.push(styles.primaryButton);
    if (variant === 'secondary') baseStyle.push(styles.secondaryButton);
    if (variant === 'outline') baseStyle.push(styles.outlineButton);
    
    // Size styles
    if (size === 'small') baseStyle.push(styles.smallButton);
    if (size === 'medium') baseStyle.push(styles.mediumButton);
    if (size === 'large') baseStyle.push(styles.largeButton);
    
    // Disabled state
    if (disabled || isLoading) baseStyle.push(styles.disabledButton);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'outline') baseStyle.push(styles.outlineButtonText);
    
    if (size === 'small') baseStyle.push(styles.smallButtonText);
    if (size === 'medium') baseStyle.push(styles.mediumButtonText);
    if (size === 'large') baseStyle.push(styles.largeButtonText);
    
    return baseStyle;
  };

  if (isSubscribed && purchasePackage) {
    return (
      <View style={styles.subscribedContainer}>
        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        <Text style={styles.subscribedText}>Already Subscribed</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePurchase}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#6366f1' : '#fff'} />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.titleRow}>
            <Text style={getTextStyle()}>{title}</Text>
            {price && <Text style={[getTextStyle(), styles.priceText]}>{price}</Text>}
          </View>
          {description && (
            <Text style={[styles.descriptionText, 
              variant === 'outline' && styles.outlineDescriptionText
            ]}>
              {description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#9333ea',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  largeButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  outlineButtonText: {
    color: '#6366f1',
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  priceText: {
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  outlineDescriptionText: {
    color: '#6b7280',
  },
  subscribedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  subscribedText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
  },
});

export default PurchaseButton;