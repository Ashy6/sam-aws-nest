window.__APP_CONFIG__ = {
  API_BASE_URL:
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? '/api/'
      : 'https://lioxovpmxc.execute-api.ap-southeast-2.amazonaws.com/api/',
};
