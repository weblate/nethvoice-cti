window.CONFIG = {
  PRODUCT_NAME: 'NethVoice CTI',
  COMPANY_NAME: 'Nethesis',
  COMPANY_URL: 'https://www.nethesis.it/',
  API_ENDPOINT:
    window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') +
    window.location.pathname +
    'api',
  API_SCHEME: window.location.protocol + '//',
  WS_ENDPOINT:
    'wss://' +
    window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') +
    window.location.pathname +
    'ws',
}
