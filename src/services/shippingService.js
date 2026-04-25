/**
 * Shipping Service — Unified JavaScript Bridge (Firebase Functions Proxy)
 * 
 * Proxies all shipping API requests through Firebase Cloud Functions
 * to avoid CORS errors and securely manage API keys.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export async function fetchRates(providerKey, credentials, originWilayaCode = '16') {
  const shippingFetchRates = httpsCallable(functions, 'shippingFetchRates');
  try {
    const result = await shippingFetchRates({ providerKey, credentials, originWilayaCode });
    return result.data;
  } catch (error) {
    console.error('Error fetching rates via proxy:', error);
    throw new Error(error.message || 'Failed to fetch rates');
  }
}

export async function fetchOfficialLabel(trackingId, providerKey, credentials) {
  const shippingFetchOfficialLabel = httpsCallable(functions, 'shippingFetchOfficialLabel');
  try {
    const result = await shippingFetchOfficialLabel({ trackingId, providerKey, credentials });
    return result.data;
  } catch (error) {
    console.error('Error fetching official label via proxy:', error);
    throw new Error(error.message || 'Failed to fetch label');
  }
}

export async function fetchStopDesks(providerKey, credentials, wilayaName, wilayaId) {
  const shippingFetchStopDesks = httpsCallable(functions, 'shippingFetchStopDesks');
  try {
    const result = await shippingFetchStopDesks({ providerKey, credentials, wilayaName, wilayaId });
    return result.data;
  } catch (error) {
    console.error('Error fetching stop desks via proxy:', error);
    return [];
  }
}

export async function dispatchOrder(order, providerKey, credentials, originWilaya) {
  const shippingDispatchOrder = httpsCallable(functions, 'shippingDispatchOrder');
  try {
    const result = await shippingDispatchOrder({ order, providerKey, credentials, originWilaya });
    return result.data;
  } catch (error) {
    console.error('Error dispatching order via proxy:', error);
    throw new Error(error.message || 'Failed to dispatch order');
  }
}

export async function testCredentials(providerKey, credentials) {
  const shippingTestCredentials = httpsCallable(functions, 'shippingTestCredentials');
  try {
    const result = await shippingTestCredentials({ providerKey, credentials });
    return result.data;
  } catch (error) {
    console.error('Error testing credentials via proxy:', error);
    return false;
  }
}

export async function trackOrder(trackingId, providerKey, credentials) {
  const shippingTrackOrder = httpsCallable(functions, 'shippingTrackOrder');
  try {
    const result = await shippingTrackOrder({ trackingId, providerKey, credentials });
    return result.data;
  } catch (error) {
    console.error('Error tracking order via proxy:', error);
    throw new Error(error.message || 'Failed to track order');
  }
}
