const functions = require("firebase-functions");

const SHIPPING_PROVIDERS = {
  yalidine: { engine: 'yalidine', domain: 'https://api.yalidine.app' },
  yalitec: { engine: 'yalidine', domain: 'https://api.yalitec.me' },
  maystro: { engine: 'maystro', domain: 'https://backend.maystro-delivery.com/api/' },
  zrexpress: { engine: 'procolis', domain: 'https://procolis.com' },
  anderson: { engine: 'ecotrack', domain: 'https://anderson.ecotrack.dz/' },
  areex: { engine: 'ecotrack', domain: 'https://areex.ecotrack.dz/' },
  baconsult: { engine: 'ecotrack', domain: 'https://bacexpress.ecotrack.dz/' },
  conexlog: { engine: 'ecotrack', domain: 'https://app.conexlog-dz.com/' },
  coyote: { engine: 'ecotrack', domain: 'https://coyoteexpressdz.ecotrack.dz/' },
  dhd: { engine: 'ecotrack', domain: 'https://dhd.ecotrack.dz/' },
  distazero: { engine: 'ecotrack', domain: 'https://distazero.ecotrack.dz/' },
  e48hr: { engine: 'ecotrack', domain: 'https://48hr.ecotrack.dz/' },
  fretdirect: { engine: 'ecotrack', domain: 'https://fret.ecotrack.dz/' },
  golivri: { engine: 'ecotrack', domain: 'https://golivri.ecotrack.dz/' },
  monohub: { engine: 'ecotrack', domain: 'https://mono.ecotrack.dz/' },
  msmgo: { engine: 'ecotrack', domain: 'https://msmgo.ecotrack.dz/' },
  negmar: { engine: 'ecotrack', domain: 'https://negmar.ecotrack.dz/' },
  packers: { engine: 'ecotrack', domain: 'https://packers.ecotrack.dz/' },
  prest: { engine: 'ecotrack', domain: 'https://prest.ecotrack.dz/' },
  rblivraison: { engine: 'ecotrack', domain: 'https://rblivraison.ecotrack.dz/' },
  rexlivraison: { engine: 'ecotrack', domain: 'https://rex.ecotrack.dz/' },
  rocket: { engine: 'ecotrack', domain: 'https://rocket.ecotrack.dz/' },
  salva: { engine: 'ecotrack', domain: 'https://salvadelivery.ecotrack.dz/' },
  speeddelivery: { engine: 'ecotrack', domain: 'https://speeddelivery.ecotrack.dz/' },
  tslexpress: { engine: 'ecotrack', domain: 'https://tsl.ecotrack.dz/' },
  worldexpress: { engine: 'ecotrack', domain: 'https://worldexpress.ecotrack.dz/' },
};

function getProvider(key) {
  return SHIPPING_PROVIDERS[key] || null;
}

function parsePrice(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
}

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function buildProductList(items) {
  if (!items || !Array.isArray(items)) return 'Order';
  return items.map(i => `${i.title || 'Product'} x${i.quantity || 1}`).join(', ');
}

async function sendYalidine(order, provider, credentials, originWilaya) {
  const { first, last } = splitName(order.customer);
  const price = parsePrice(order.total);

  const parcelData = {
    order_id: order.id,
    from_wilaya_name: originWilaya || 'Alger',
    firstname: first,
    familyname: last || first,
    contact_phone: order.shipping?.phone || '',
    address: order.shipping?.address1 || '',
    to_commune_name: order.shipping?.commune || order.shipping?.city || '',
    to_wilaya_name: order.shipping?.state || '',
    product_list: buildProductList(order.items),
    price: price,
    do_insurance: false,
    declared_value: price,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    freeshipping: true,
    is_stopdesk: order.shipping?.isStopDesk || false,
    stopdesk_id: order.shipping?.isStopDesk ? order.shipping?.stopDeskId : '',
    has_exchange: false,
    product_to_collect: null,
  };

  const response = await fetch(`${provider.domain}/v1/parcels/`, {
    method: 'POST',
    headers: {
      'X-API-ID': credentials.id,
      'X-API-TOKEN': credentials.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([parcelData]),
  });

  const data = await response.json();
  const result = data[order.id];
  if (!result || result.success !== 'true') {
    const msg = result?.message || JSON.stringify(data);
    throw new functions.https.HttpsError('internal', `Yalidine rejected order ${order.id}: ${msg}`);
  }

  return { tracking: result.tracking || null, providerResponse: result };
}

async function sendEcotrack(order, provider, credentials, originWilaya) {
  const price = parsePrice(order.total);
  const wilayaCode = order.shipping?.wilayaCode || '16';

  const orderData = {
    nom_client: order.customer || '',
    telephone: order.shipping?.phone || '',
    telephone_2: '',
    adresse: order.shipping?.address1 || '',
    commune: order.shipping?.commune || order.shipping?.city || '',
    code_wilaya: parseInt(wilayaCode, 10),
    montant: price,
    remarque: '',
    produit: buildProductList(order.items),
    type: order.shipping?.isStopDesk ? 3 : 1,
    stop_desk: order.shipping?.isStopDesk ? 1 : 0,
    stopdesk_id: order.shipping?.isStopDesk ? order.shipping?.stopDeskId : '',
    reference: order.id,
  };

  const domain = provider.domain.endsWith('/') ? provider.domain : provider.domain + '/';

  const response = await fetch(`${domain}api/v1/create/order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (data.success === false) {
    throw new functions.https.HttpsError('internal', `${provider.engine} rejected order ${order.id}: ${data.message || JSON.stringify(data)}`);
  }

  return { tracking: data.tracking || data.order_tracking || null, providerResponse: data };
}

async function sendProcolis(order, provider, credentials) {
  const price = parsePrice(order.total);
  const wilayaCode = order.shipping?.wilayaCode || '16';

  const colisData = {
    Tracking: '',
    TypeLivraison: order.shipping?.isStopDesk ? 1 : 0,
    StopDesk: order.shipping?.isStopDesk ? order.shipping?.stopDeskId : '',
    TypeColis: 0,
    Confrimee: 1,
    Client: order.customer || '',
    MobileA: order.shipping?.phone || '',
    MobileB: '',
    Adresse: order.shipping?.address1 || '',
    IDWilaya: parseInt(wilayaCode, 10),
    Commune: order.shipping?.commune || order.shipping?.city || '',
    Total: price,
    Note: '',
    TProduit: buildProductList(order.items),
    id_Externe: order.id,
    Source: 'API',
  };

  const response = await fetch('https://procolis.com/api_v1/add_colis', {
    method: 'POST',
    headers: {
      'token': credentials.token,
      'key': credentials.key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Colis: [colisData] }),
  });

  const data = await response.json();
  const result = data?.Colis?.[0];

  if (!result || result.MessageRetour === 'Double Tracking') {
    throw new functions.https.HttpsError('internal', `ZR Express: Duplicate tracking for order ${order.id}`);
  }
  if (result.MessageRetour !== 'Good') {
    throw new functions.https.HttpsError('internal', `ZR Express rejected order ${order.id}: ${result.MessageRetour || JSON.stringify(data)}`);
  }

  return { tracking: result.Tracking || null, providerResponse: result };
}

async function sendMaystro(order, provider, credentials) {
  const price = parsePrice(order.total);
  const wilayaCode = order.shipping?.wilayaCode || '16';
  const communeCode = order.shipping?.communeId || '1';

  const orderData = {
    wilaya: parseInt(wilayaCode, 10),
    commune: parseInt(communeCode, 10),
    destination_text: order.shipping?.address1 || '',
    customer_phone: order.shipping?.phone || '',
    customer_name: order.customer || '',
    product_price: Math.round(price),
    delivery_type: order.shipping?.isStopDesk ? 1 : 0,
    desk_center_id: order.shipping?.isStopDesk ? order.shipping?.stopDeskId : null,
    express: false,
    note_to_driver: '',
    products: (order.items || []).map(item => ({
      logistical_description: `${item.title || 'Product'} x${item.quantity || 1}`,
    })),
    source: 4,
    external_order_id: order.id,
  };

  const response = await fetch(`${provider.domain}stores/orders/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${credentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new functions.https.HttpsError('internal', `Maystro rejected order ${order.id}: ${errorText}`);
  }

  const data = await response.json();
  return { tracking: data.tracking || data.id?.toString() || null, providerResponse: data };
}

exports.shippingDispatchOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  let { order, providerKey, credentials, originWilaya } = data;

  if (!credentials || !credentials.token) {
    const admin = require('firebase-admin');
    const snap = await admin.firestore().collection('settings').doc('shipping').get();
    if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Shipping settings not configured in db');
    const dbData = snap.data();
    providerKey = dbData.provider;
    credentials = { id: dbData.apiId || '', token: dbData.apiToken || '', key: dbData.apiKey || '' };
    originWilaya = originWilaya || dbData.originWilaya;
  }

  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown shipping provider: ${providerKey}`);

  try {
    switch (provider.engine) {
      case 'yalidine': return await sendYalidine(order, provider, credentials, originWilaya);
      case 'ecotrack': return await sendEcotrack(order, provider, credentials, originWilaya);
      case 'procolis': return await sendProcolis(order, provider, credentials);
      case 'maystro': return await sendMaystro(order, provider, credentials);
      default: throw new functions.https.HttpsError('invalid-argument', `Unsupported engine type: ${provider.engine}`);
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.shippingFetchRates = functions.https.onCall(async (data, context) => {
  let { providerKey, credentials, originWilayaCode = '16' } = data;
  
  if (!credentials || !credentials.token) {
    const admin = require('firebase-admin');
    const snap = await admin.firestore().collection('settings').doc('shipping').get();
    if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Shipping settings not configured in db');
    const dbData = snap.data();
    providerKey = dbData.provider;
    credentials = { id: dbData.apiId || '', token: dbData.apiToken || '', key: dbData.apiKey || '' };
  }

  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown provider: ${providerKey}`);

  const domain = provider.domain.endsWith('/') ? provider.domain : provider.domain + '/';

  try {
    switch (provider.engine) {
      case 'yalidine': {
        const fromId = parseInt(originWilayaCode, 10) || 16;
        const response = await fetch(`${provider.domain}/v1/fees/?from_wilaya_id=${fromId}`, {
          headers: { 'X-API-ID': credentials.id, 'X-API-TOKEN': credentials.token },
        });
        if (!response.ok) throw new Error(`Yalidine rates fetch failed: ${response.status}`);
        const data = await response.json();
        const rates = [];
        if (Array.isArray(data)) {
          data.forEach(entry => rates.push({
            code: String(entry.wilaya_id),
            name: entry.wilaya_name || `Wilaya ${entry.wilaya_id}`,
            home: entry.home_fee || entry.tarif_domicile || 0,
            desk: entry.desk_fee || entry.tarif_stopdesk || 0,
          }));
        }
        return rates;
      }
      case 'ecotrack': {
        const response = await fetch(`${domain}api/v1/get/fees`, {
          headers: { 'Authorization': `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Ecotrack rates fetch failed: ${response.status}`);
        const data = await response.json();
        const rates = [];
        if (data.livraison && Array.isArray(data.livraison)) {
          data.livraison.forEach(entry => rates.push({
            code: String(entry.wilaya_id),
            name: entry.wilaya_name || `Wilaya ${entry.wilaya_id}`,
            home: entry.tarif || entry.tarif_domicile || 0,
            desk: entry.tarif_stopdesk || Math.round((entry.tarif || 0) * 0.7),
          }));
        }
        return rates;
      }
      case 'procolis': {
        const response = await fetch('https://procolis.com/api_v1/tarification', {
          method: 'POST',
          headers: { 'token': credentials.token, 'key': credentials.key, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Procolis rates fetch failed: ${response.status}`);
        const data = await response.json();
        const rates = [];
        if (Array.isArray(data)) {
          data.forEach(entry => rates.push({
            code: String(entry.IDWilaya),
            name: entry.Wilaya || `Wilaya ${entry.IDWilaya}`,
            home: entry.TarifDomicile || entry.Tarif || 0,
            desk: entry.TarifStopDesk || entry.TarifBureau || 0,
          }));
        }
        return rates;
      }
      case 'maystro': throw new Error('Maystro Delivery does not expose a public rates API.');
      default: throw new Error(`Rates fetching not supported for engine: ${provider.engine}`);
    }
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.shippingFetchOfficialLabel = functions.https.onCall(async (data, context) => {
  let { trackingId, providerKey, credentials } = data;
  
  if (!credentials || !credentials.token) {
    const admin = require('firebase-admin');
    const snap = await admin.firestore().collection('settings').doc('shipping').get();
    if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Shipping settings not configured in db');
    const dbData = snap.data();
    providerKey = dbData.provider;
    credentials = { id: dbData.apiId || '', token: dbData.apiToken || '', key: dbData.apiKey || '' };
  }

  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown provider: ${providerKey}`);
  const domain = provider.domain.endsWith('/') ? provider.domain : provider.domain + '/';

  try {
    switch (provider.engine) {
      case 'yalidine': {
        const response = await fetch(`${provider.domain}/v1/parcels/${trackingId}`, {
          headers: { 'X-API-ID': credentials.id, 'X-API-TOKEN': credentials.token },
        });
        if (!response.ok) throw new Error(`Yalidine label fetch failed: ${response.status}`);
        const data = await response.json();
        const parcel = data.data?.[0] || data;
        if (!parcel.label) throw new Error(`Yalidine: No label URL found for ${trackingId}`);
        return { type: 'url', data: parcel.label };
      }
      case 'ecotrack': {
        const response = await fetch(`${domain}api/v1/get/order/label?tracking=${trackingId}`, {
          headers: { 'Authorization': `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Ecotrack label fetch failed: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return { type: 'base64', data: base64 };
      }
      case 'maystro': {
        const response = await fetch(`${provider.domain}stores/orders/${trackingId}/bordereau/`, {
          headers: { 'Authorization': `Token ${credentials.token}` },
        });
        if (!response.ok) throw new Error(`Maystro label fetch failed: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return { type: 'base64', data: base64 };
      }
      case 'procolis': throw new Error('Procolis (ZR Express) does not support official label downloads via API.');
      default: throw new Error(`Label fetching not supported for engine: ${provider.engine}`);
    }
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.shippingFetchStopDesks = functions.https.onCall(async (data, context) => {
  let { providerKey, credentials, wilayaName, wilayaId } = data;
  
  if (!credentials || (!credentials.token && !credentials.key)) {
    const admin = require('firebase-admin');
    const snap = await admin.firestore().collection('settings').doc('shipping').get();
    if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Shipping settings not configured in db');
    const dbData = snap.data();
    providerKey = dbData.provider;
    credentials = { id: dbData.apiId || '', token: dbData.apiToken || '', key: dbData.apiKey || '' };
  }

  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown provider: ${providerKey}`);

  try {
    let response;
    switch (provider.engine) {
      case 'yalidine':
        response = await fetch(`${provider.domain}/v1/stopdesks/?wilaya_name=${encodeURIComponent(wilayaName)}`, {
          headers: { 'X-API-ID': credentials.id, 'X-API-TOKEN': credentials.token },
        });
        if (!response.ok) return [];
        const yData = await response.json();
        return (yData.data || []).map(sd => ({ id: sd.id, name: sd.name, address: sd.address, wilayaName: sd.wilaya_name }));
      case 'procolis':
        response = await fetch('https://procolis.com/api_v1/liste_bureaux', {
          method: 'POST',
          headers: { 'token': credentials.token, 'key': credentials.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ IDWilaya: parseInt(wilayaId, 10) })
        });
        if (!response.ok) return [];
        const pData = await response.json();
        return (pData.Bureaux || []).map(b => ({ id: b.ID, name: b.Nom, address: b.Adresse, wilayaName: wilayaName }));
      default: return [];
    }
  } catch (err) {
    console.error('Error fetching stopdesks:', err);
    return [];
  }
});

exports.shippingTestCredentials = functions.https.onCall(async (data, context) => {
  const { providerKey, credentials } = data;
  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown provider: ${providerKey}`);

  try {
    let response;
    const domain = provider.domain.endsWith('/') ? provider.domain : provider.domain + '/';

    switch (provider.engine) {
      case 'yalidine':
        response = await fetch(`${provider.domain}/v1/wilayas/`, {
          headers: { 'X-API-ID': credentials.id, 'X-API-TOKEN': credentials.token },
        });
        return response.status === 200;
      case 'ecotrack':
        response = await fetch(`${domain}api/v1/get/wilayas`, {
          headers: { 'Authorization': `Bearer ${credentials.token}` },
        });
        return response.status === 200;
      case 'procolis':
        response = await fetch('https://procolis.com/api_v1/token', {
          headers: { 'token': credentials.token, 'key': credentials.key },
        });
        if (response.status === 200) {
          const data = await response.json();
          return data.Statut === 'Accès activé';
        }
        return false;
      case 'maystro':
        response = await fetch(`${provider.domain}base/wilayas/?country=1`, {
          headers: { 'Authorization': `Token ${credentials.token}` },
        });
        return response.status === 200 || response.status === 201;
      default: return false;
    }
  } catch {
    return false;
  }
});

exports.shippingTrackOrder = functions.https.onCall(async (data, context) => {
  let { trackingId, providerKey, credentials } = data;
  
  if (!credentials || !credentials.token) {
    const admin = require('firebase-admin');
    const snap = await admin.firestore().collection('settings').doc('shipping').get();
    if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Shipping settings not configured in db');
    const dbData = snap.data();
    providerKey = dbData.provider;
    credentials = { id: dbData.apiId || '', token: dbData.apiToken || '', key: dbData.apiKey || '' };
  }

  const provider = getProvider(providerKey);
  if (!provider) throw new functions.https.HttpsError('invalid-argument', `Unknown provider: ${providerKey}`);

  let response, responseData;
  const domain = provider.domain.endsWith('/') ? provider.domain : provider.domain + '/';

  try {
    switch (provider.engine) {
      case 'yalidine':
        response = await fetch(`${provider.domain}/v1/parcels/${trackingId}`, {
          headers: { 'X-API-ID': credentials.id, 'X-API-TOKEN': credentials.token },
        });
        responseData = await response.json();
        if (!response.ok || responseData.total_data === 0) throw new Error(`Yalidine: Tracking ID not found (${trackingId})`);
        const yData = responseData.data && responseData.data[0] ? responseData.data[0] : responseData;
        return { status: yData.status || 'Unknown', details: yData };
      case 'procolis':
        response = await fetch('https://procolis.com/api_v1/lire', {
          method: 'POST',
          headers: { 'token': credentials.token, 'key': credentials.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ Colis: [{ Tracking: trackingId }] })
        });
        responseData = await response.json();
        if (!responseData || !responseData.Colis || responseData.Colis.length === 0) throw new Error(`Procolis: Tracking ID not found (${trackingId})`);
        return { status: responseData.Colis[0].Statut || 'Unknown', details: responseData.Colis[0] };
      case 'maystro':
        response = await fetch(`${provider.domain}stores/orders/${trackingId}/`, {
          headers: { 'Authorization': `Token ${credentials.token}` },
        });
        if (!response.ok) throw new Error(`Maystro: Tracking ID not found (${trackingId})`);
        responseData = await response.json();
        return { status: responseData.status || 'Unknown', details: responseData };
      case 'ecotrack':
        throw new Error(`Ecotrack engine providers do not support real-time status fetching via API. Use official website links.`);
      default:
        throw new Error(`Tracking not supported for engine type: ${provider.engine}`);
    }
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
