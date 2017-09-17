// from https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example
import path from 'path';
import webservice from 'web-service';

const WEB_SERVICE_PORT = 8060;
const PAGE_SERVICE_PORT = 3002;
const API_SERVICE_PORT = 4000;

const web = webservice({});

// Serve static files
web.files('/assets', path.join(__dirname, '../client/build/assets'));

// if it's not a static file url:

// Proxy /api requests to API server
web.proxy('/api', `http://localhost:${API_SERVICE_PORT}`, { name: 'API service' });

// Proxy all the rest requests to Webpage rendering server
web.proxy(`http://localhost:${PAGE_SERVICE_PORT}`, { name: 'Page rendering service' });

// Start web server
web.listen(WEB_SERVICE_PORT).then(() => {
  console.log('Web server is listening');
  console.log(`Now go to http://localhost:${WEB_SERVICE_PORT}`);
},
(error) => {
  console.error(error);
});
