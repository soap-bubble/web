import React from 'react'
import webpageServer from 'react-isomorphic-render/server'
import { head, title, meta } from 'react-isomorphic-render'
import { devtools } from 'universal-webpack'
import path from 'path'

import settings from '../src/react-isomorphic-render'

const FB_APP_ID = process.env.SOAPBUBBLE_FB_APP_ID || '';
const WEB_SERVICE_PORT = 3000;
const PAGE_SERVICE_PORT = 3002;

export default function(parameters) {

  // Starts webpage rendering server
  const server = webpageServer(settings, {
    // HTTP host and port for performing all AJAX requests
    // when rendering pages on server-side.
    // E.g. an AJAX request to `/items/5` will be transformed to
    // `http://${host}:${port}/items/5` during server-side rendering.
    // Specify `secure: true` flag to use `https` protocol instead of `http`.
    application: {
      host: 'localhost',
      port: WEB_SERVICE_PORT,
      secure: false,
    },

    // Http Urls to javascripts and (optionally) CSS styles
    // which will be insterted into the <head/> element of the resulting Html webpage
    // (as <script src="..."/> and <link rel="style" href="..."/> respectively)
    //
    // Also a website "favicon".
    //
    assets(path) {
      // Retrieve asset chunk file names
      // (which are output by client side Webpack build)
      const result = { ...parameters.chunks() }

      // Webpack entry point (can be used for code splitting)
      result.entry = 'main'

      // // Clear Webpack require() cache for hot reload in development mode
      // // (this is not necessary)
      // if (process.env.NODE_ENV !== 'production') {
      //   delete require.cache[require.resolve('../assets/images/icon.png')]
      // }

      // Add "favicon"
      result.icon = require('../assets/img/favicon.png');

      // Return assets
      return result
    },

    html: {
      // Will be inserted into server rendered webpage <head/>
      // (this `head()` function is optional and is not required)
      // (its gonna work with or without this `head()` parameter)
      head(path) {
        const metas = [
          // <meta charset="utf-8"/>
          { charset: 'utf-8' },

          // <meta name="..." content="..."/>
          { name: 'viewport', content: 'width=device-width, initial-scale=1.0, user-scalable=no' },

          // <meta property="..." content="..."/>
          { property: 'og:title',       content: 'Soapbubble Productions' },
          { property: 'og:description', content: 'The main site for the development of Soapbubble Productions title: Morpheus' },
          { property: 'og:locale',      content: 'en_US' },
          { property: 'og:type',        content: 'website' },
          { property: 'og:url',         content: 'http://soapbubble.online/examples' },
          { property: 'og:image',       content: `http://soapbubble.online${require('../assets/img/scene_100000.png')}` },
          { property: 'fb:app_id',      content: FB_APP_ID },
        ];

        // if (process.env.NODE_ENV !== 'production') {
        //   scripts.push({
        //     innerHTML: `${devtools({ ...parameters, entry: 'main' })}`
        //   });
        // }

        return head('Soapbubble Productions', metas);
      },

      // Isomorphic CSS flag
      body_start(path) {
        return `
          <script>
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            ga('create', 'UA-92268324-1', 'auto');
            ga('send', 'pageview');
          </script>
          <script>
            // This line is just for CSS
            document.body.classList.add('javascript-is-enabled');
          </script>
        `;
      }
    }
  });

  // Start webpage rendering server
  server.listen(PAGE_SERVICE_PORT, function(error) {
    if (error) {
      console.error('Webpage rendering server shutdown due to an error')
      throw error
    }

    console.log(`Webpage server is listening at http://localhost:${PAGE_SERVICE_PORT}`)
  })
}
