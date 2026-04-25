/**
 * Shipping Provider Configuration
 * 
 * Maps all 26 Algerian shipping providers from the CourierDZ library.
 * Each provider is tagged with its API engine type so the shippingService
 * adapter knows which JSON shape and auth headers to use.
 * 
 * Engine types:
 *   - "yalidine"  → requires { id, token }, uses X-API-ID / X-API-TOKEN headers
 *   - "ecotrack"  → requires { token }, uses Bearer token
 *   - "procolis"  → requires { token, key }, uses custom token/key headers
 *   - "maystro"   → requires { token }, uses Token auth header
 */

const SHIPPING_PROVIDERS = {
  // ─── Yalidine Engine ───
  yalidine: {
    key: 'yalidine',
    name: 'Yalidine',
    title: 'Yalidine',
    engine: 'yalidine',
    domain: 'https://api.yalidine.app',
    credentials: ['id', 'token'],
    trackingUrl: 'https://yalidine.com/suivre-un-colis/',
  },
  yalitec: {
    key: 'yalitec',
    name: 'Yalitec',
    title: 'Yalitec',
    engine: 'yalidine',
    domain: 'https://api.yalitec.me',
    credentials: ['id', 'token'],
    trackingUrl: null,
  },

  // ─── Maystro Delivery Engine ───
  maystro: {
    key: 'maystro',
    name: 'MaystroDelivery',
    title: 'Maystro Delivery',
    engine: 'maystro',
    domain: 'https://backend.maystro-delivery.com/api/',
    credentials: ['token'],
    trackingUrl: 'https://maystro-delivery.com/trackingSD.html',
  },

  // ─── Procolis Engine (ZR Express) ───
  zrexpress: {
    key: 'zrexpress',
    name: 'ZRExpress',
    title: 'ZR Express',
    engine: 'procolis',
    domain: 'https://procolis.com',
    credentials: ['token', 'key'],
    trackingUrl: null,
  },

  // ─── Ecotrack Engine (22 providers) ───
  anderson: {
    key: 'anderson',
    name: 'AndersonDelivery',
    title: 'Anderson Delivery',
    engine: 'ecotrack',
    domain: 'https://anderson.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  areex: {
    key: 'areex',
    name: 'Areex',
    title: 'Areex',
    engine: 'ecotrack',
    domain: 'https://areex.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  baconsult: {
    key: 'baconsult',
    name: 'BaConsult',
    title: 'BA Consult',
    engine: 'ecotrack',
    domain: 'https://bacexpress.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  conexlog: {
    key: 'conexlog',
    name: 'Conexlog',
    title: 'Conexlog',
    engine: 'ecotrack',
    domain: 'https://app.conexlog-dz.com/',
    credentials: ['token'],
    trackingUrl: null,
  },
  coyote: {
    key: 'coyote',
    name: 'CoyoteExpress',
    title: 'Coyote Express',
    engine: 'ecotrack',
    domain: 'https://coyoteexpressdz.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  dhd: {
    key: 'dhd',
    name: 'Dhd',
    title: 'DHD',
    engine: 'ecotrack',
    domain: 'https://dhd.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  distazero: {
    key: 'distazero',
    name: 'Distazero',
    title: 'Distazero',
    engine: 'ecotrack',
    domain: 'https://distazero.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  e48hr: {
    key: 'e48hr',
    name: 'E48hrLivraison',
    title: '48Hr Livraison',
    engine: 'ecotrack',
    domain: 'https://48hr.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  fretdirect: {
    key: 'fretdirect',
    name: 'Fretdirect',
    title: 'FRET.Direct',
    engine: 'ecotrack',
    domain: 'https://fret.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  golivri: {
    key: 'golivri',
    name: 'Golivri',
    title: 'GOLIVRI',
    engine: 'ecotrack',
    domain: 'https://golivri.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  monohub: {
    key: 'monohub',
    name: 'MonoHub',
    title: 'Mono Hub',
    engine: 'ecotrack',
    domain: 'https://mono.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  msmgo: {
    key: 'msmgo',
    name: 'MsmGo',
    title: 'MSM Go',
    engine: 'ecotrack',
    domain: 'https://msmgo.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  negmar: {
    key: 'negmar',
    name: 'NegmarExpress',
    title: 'Negmar Express',
    engine: 'ecotrack',
    domain: 'https://negmar.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  packers: {
    key: 'packers',
    name: 'Packers',
    title: 'Packers',
    engine: 'ecotrack',
    domain: 'https://packers.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  prest: {
    key: 'prest',
    name: 'Prest',
    title: 'Prest',
    engine: 'ecotrack',
    domain: 'https://prest.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  rblivraison: {
    key: 'rblivraison',
    name: 'RbLivraison',
    title: 'RB Livraison',
    engine: 'ecotrack',
    domain: 'https://rblivraison.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  rexlivraison: {
    key: 'rexlivraison',
    name: 'RexLivraison',
    title: 'Rex Livraison',
    engine: 'ecotrack',
    domain: 'https://rex.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  rocket: {
    key: 'rocket',
    name: 'RocketDelivery',
    title: 'Rocket Delivery',
    engine: 'ecotrack',
    domain: 'https://rocket.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  salva: {
    key: 'salva',
    name: 'SalvaDelivery',
    title: 'Salva Delivery',
    engine: 'ecotrack',
    domain: 'https://salvadelivery.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  speeddelivery: {
    key: 'speeddelivery',
    name: 'SpeedDelivery',
    title: 'Speed Delivery',
    engine: 'ecotrack',
    domain: 'https://speeddelivery.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  tslexpress: {
    key: 'tslexpress',
    name: 'TslExpress',
    title: 'TSL Express',
    engine: 'ecotrack',
    domain: 'https://tsl.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
  worldexpress: {
    key: 'worldexpress',
    name: 'Worldexpress',
    title: 'WorldExpress',
    engine: 'ecotrack',
    domain: 'https://worldexpress.ecotrack.dz/',
    credentials: ['token'],
    trackingUrl: null,
  },
};

/**
 * Returns an array of all providers grouped by engine type for display purposes.
 */
export function getProvidersByEngine() {
  const groups = {
    yalidine: { label: 'Yalidine Network', providers: [] },
    maystro: { label: 'Maystro Delivery', providers: [] },
    procolis: { label: 'Procolis / ZR Express', providers: [] },
    ecotrack: { label: 'Ecotrack Network', providers: [] },
  };
  Object.values(SHIPPING_PROVIDERS).forEach(p => {
    groups[p.engine].providers.push(p);
  });
  return groups;
}

/**
 * Returns the provider config for a given key.
 */
export function getProvider(key) {
  return SHIPPING_PROVIDERS[key] || null;
}

/**
 * Returns the credential field labels for a given engine type.
 */
export function getCredentialLabels(engine) {
  switch (engine) {
    case 'yalidine':
      return [
        { key: 'id', label: 'API ID', placeholder: 'Your API ID' },
        { key: 'token', label: 'API Token', placeholder: 'Your API Token' },
      ];
    case 'ecotrack':
      return [
        { key: 'token', label: 'API Token', placeholder: 'Bearer token' },
      ];
    case 'procolis':
      return [
        { key: 'token', label: 'Token', placeholder: 'Your Token' },
        { key: 'key', label: 'Key', placeholder: 'Your Key' },
      ];
    case 'maystro':
      return [
        { key: 'token', label: 'API Token', placeholder: 'Your Token' },
      ];
    default:
      return [{ key: 'token', label: 'API Token', placeholder: 'Token' }];
  }
}

export default SHIPPING_PROVIDERS;
