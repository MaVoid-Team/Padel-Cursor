const axios = require('axios');

/**
 * Paymob Service
 * Integration with Paymob payment gateway for Egypt
 * 
 * Environment Variables Required:
 * - PAYMOB_API_KEY: Your Paymob API key
 * - PAYMOB_INTEGRATION_ID: Card payment integration ID
 * - PAYMOB_IFRAME_ID: Payment iframe ID
 */

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

class PaymobService {
  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.integrationId = process.env.PAYMOB_INTEGRATION_ID;
    this.iframeId = process.env.PAYMOB_IFRAME_ID;
  }

  /**
   * Step 1: Authenticate and get auth token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
        api_key: this.apiKey
      });
      return response.data.token;
    } catch (error) {
      console.error('Paymob authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  /**
   * Step 2: Create order
   */
  async createOrder(authToken, amountCents, bookingId) {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: bookingId,
        items: []
      });
      return response.data;
    } catch (error) {
      console.error('Paymob order creation error:', error.response?.data || error.message);
      throw new Error('Failed to create Paymob order');
    }
  }

  /**
   * Step 3: Generate payment key
   */
  async generatePaymentKey(authToken, orderId, amountCents, billingData) {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: billingData.apartment || 'NA',
          email: billingData.email,
          floor: billingData.floor || 'NA',
          first_name: billingData.first_name,
          street: billingData.street || 'NA',
          building: billingData.building || 'NA',
          phone_number: billingData.phone_number,
          shipping_method: 'NA',
          postal_code: billingData.postal_code || 'NA',
          city: billingData.city || 'Cairo',
          country: billingData.country || 'EG',
          last_name: billingData.last_name || billingData.first_name,
          state: billingData.state || 'NA'
        },
        currency: 'EGP',
        integration_id: this.integrationId
      });
      return response.data.token;
    } catch (error) {
      console.error('Paymob payment key error:', error.response?.data || error.message);
      throw new Error('Failed to generate payment key');
    }
  }

  /**
   * Complete payment flow - returns iframe URL
   */
  async initiatePayment(booking, billingData) {
    try {
      // Convert amount to cents (Paymob requires amount in cents)
      const amountCents = Math.round(parseFloat(booking.price) * 100);

      // Step 1: Authenticate
      const authToken = await this.authenticate();

      // Step 2: Create order
      const order = await this.createOrder(authToken, amountCents, booking.id);

      // Step 3: Generate payment key
      const paymentKey = await this.generatePaymentKey(
        authToken,
        order.id,
        amountCents,
        billingData
      );

      // Return iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;

      return {
        success: true,
        iframe_url: iframeUrl,
        payment_key: paymentKey,
        order_id: order.id,
        amount_cents: amountCents
      };
    } catch (error) {
      console.error('Paymob payment initiation error:', error);
      throw error;
    }
  }

  /**
   * Verify payment callback from Paymob
   */
  async verifyCallback(callbackData) {
    try {
      // Extract important fields
      const {
        obj,
        type
      } = callbackData;

      if (type !== 'TRANSACTION') {
        return { valid: false, reason: 'Invalid callback type' };
      }

      const transaction = obj;
      
      return {
        valid: true,
        transaction_id: transaction.id,
        order_id: transaction.order.id,
        merchant_order_id: transaction.order.merchant_order_id,
        amount_cents: transaction.amount_cents,
        success: transaction.success,
        pending: transaction.pending,
        currency: transaction.currency,
        payment_method: transaction.source_data?.type || 'card',
        created_at: transaction.created_at
      };
    } catch (error) {
      console.error('Paymob callback verification error:', error);
      return { valid: false, reason: 'Verification failed' };
    }
  }

  /**
   * Calculate HMAC for webhook verification
   */
  calculateHMAC(data) {
    const crypto = require('crypto');
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    
    if (!hmacSecret) {
      throw new Error('PAYMOB_HMAC_SECRET not configured');
    }

    const concatenatedString = [
      data.amount_cents,
      data.created_at,
      data.currency,
      data.error_occured,
      data.has_parent_transaction,
      data.id,
      data.integration_id,
      data.is_3d_secure,
      data.is_auth,
      data.is_capture,
      data.is_refunded,
      data.is_standalone_payment,
      data.is_voided,
      data.order,
      data.owner,
      data.pending,
      data.source_data_pan,
      data.source_data_sub_type,
      data.source_data_type,
      data.success
    ].join('');

    const hmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    return hmac;
  }

  /**
   * Verify webhook HMAC
   */
  verifyWebhookHMAC(receivedHMAC, data) {
    try {
      const calculatedHMAC = this.calculateHMAC(data);
      return calculatedHMAC === receivedHMAC;
    } catch (error) {
      console.error('HMAC verification error:', error);
      return false;
    }
  }

  /**
   * Check if Paymob is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.integrationId && this.iframeId);
  }
}

module.exports = new PaymobService();
