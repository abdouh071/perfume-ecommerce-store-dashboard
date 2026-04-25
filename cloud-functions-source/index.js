const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * HTTP Webhook endpoint designed to receive status updates 
 * from couriers like Yalidine, Ecotrack, or Maystro.
 *
 * It extracts the tracking number and the new status from the payload,
 * finds the matching order in your Firestore, and updates its status.
 */
exports.shippingWebhook = functions.https.onRequest(async (req, res) => {
  // Webhooks usually send POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const payload = req.body;
  
  try {
    console.log("Received Webhook Payload:", JSON.stringify(payload));

    // Support multiple courier payload structures:
    // Yalidine often sends `tracking` or data array
    // Ecotrack/Maystro might send `tracking_id` or `trackingNumber`
    
    // Attempt to extract the tracking ID 
    const trackingId = payload.tracking || payload.tracking_id || payload.trackingNumber || payload.id;
    
    // Attempt to extract the status string
    let newStatus = payload.status || payload.status_name || payload.state;

    // Normalize specific Yalidine/Ecotrack status codes to our Store's internal statuses
    let mappedStatus = null;
    const statusLower = String(newStatus).toLowerCase();
    
    if (["livré", "delivered", "reçu"].includes(statusLower)) {
      mappedStatus = "Delivered";
    } else if (["retour", "retourné", "returned", "annulé", "canceled"].includes(statusLower)) {
      mappedStatus = "Returned";
    } else if (["en cours", "en route", "dispatched", "expédié"].includes(statusLower)) {
      mappedStatus = "Shipped";
    }

    if (!trackingId || !mappedStatus) {
      console.warn("Could not parse trackingId or mappedStatus from payload.");
      return res.status(200).send("Webhook received but data irrelevant.");
    }

    // 1. Query the 'orders' collection for a document with this tracking number
    const ordersRef = db.collection('orders');
    const q = ordersRef.where('trackingNumber', '==', trackingId);
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.warn(`No order found matching tracking number: ${trackingId}`);
      return res.status(404).send("Order not found");
    }

    // 2. We found the order(s), let's update their status
    // Usually there is just one match.
    const batch = db.batch();
    snapshot.forEach(doc => {
      const orderRef = ordersRef.doc(doc.id);
      batch.update(orderRef, {
        status: mappedStatus,
        lastWebhookUpdate: admin.firestore.FieldValue.serverTimestamp(),
        courierRawStatus: newStatus // Keep a record of the raw status
      });
      console.log(`Updating Order ${doc.id} mapped to status: ${mappedStatus}`);
    });

    await batch.commit();
    return res.status(200).send("Order status updated successfully");

  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).send("Internal Server Error processing webhook");
  }
});

const shippingProxy = require('./shippingProxy');
exports.shippingDispatchOrder = shippingProxy.shippingDispatchOrder;
exports.shippingFetchRates = shippingProxy.shippingFetchRates;
exports.shippingFetchOfficialLabel = shippingProxy.shippingFetchOfficialLabel;
exports.shippingFetchStopDesks = shippingProxy.shippingFetchStopDesks;
exports.shippingTestCredentials = shippingProxy.shippingTestCredentials;
exports.shippingTrackOrder = shippingProxy.shippingTrackOrder;
