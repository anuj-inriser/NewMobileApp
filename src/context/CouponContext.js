import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { Alert } from 'react-native';

const CouponContext = createContext();

export const CouponProvider = ({ children }) => {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const applyCoupon = useCallback(async (couponCode, orderAmount, userId) => {
    if (!couponCode) {
      setAppliedCoupon(null);
      return { success: false, message: 'Coupon code is required' };
    }

    setIsValidating(true);
    try {
      const response = await axiosInstance.post('/offer/validate', {
        offer_code: couponCode,
        order_amount: orderAmount,
        user_id: userId,
      });

      if (response.data.status && response.data.result.isValid) {
        setAppliedCoupon(response.data.result.offerDetails);
        return { success: true, details: response.data.result.offerDetails };
      } else {
        setAppliedCoupon(null);
        return { success: false, message: response.data.message || 'Invalid coupon' };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to validate coupon';
      setAppliedCoupon(null);
      return { success: false, message: msg };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Helper to calculate discount for any given amount
  const calculateDiscount = useCallback((amount) => {
    if (!appliedCoupon) return 0;
    
    const { 
      calculation_type, 
      offer_percentage, 
      offer_value, 
      max_value, 
      consumed_value,
      minimum_order_amount 
    } = appliedCoupon;

    const minOrder = Number(minimum_order_amount || 0);
    if (minOrder > 0 && amount < minOrder) return 0;

    let discount = 0;
    if (calculation_type === 'percentage') {
      const percentage = Number(offer_percentage || 0);
      discount = (percentage / 100) * amount;
    } else {
      discount = Number(offer_value || 0);
    }

    // Apply Total Budget Cap (Budget = max_value)
    const maxBudget = Number(max_value || 0);
    const currentlyConsumed = Number(consumed_value || 0);
    if (maxBudget > 0) {
      const remainingBudget = Math.max(0, maxBudget - currentlyConsumed);
      if (discount > remainingBudget) {
        discount = remainingBudget;
      }
    }

    return Math.round(Math.min(discount, amount));
  }, [appliedCoupon]);

  return (
    <CouponContext.Provider value={{ 
      appliedCoupon, 
      isValidating, 
      applyCoupon, 
      clearCoupon,
      calculateDiscount 
    }}>
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupon = () => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupon must be used within a CouponProvider');
  }
  return context;
};
