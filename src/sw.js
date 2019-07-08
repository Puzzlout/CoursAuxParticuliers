let isDebuggingActive = location.hostname === "localhost" ? true : false;
isDebuggingActive = false;
/**
 * Credits: https://developers.google.com/web/tools/workbox/guides/get-started
 */

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js"
);

if (workbox) {
  if (isDebuggingActive) console.log(`Yay! Workbox is loaded!`);
} else {
  if (isDebuggingActive) console.log(`Boo! Workbox didn't load!`);
}

/**
 * Enables the workbox debugging logs in the console
 */
workbox.setConfig({ debug: isDebuggingActive });

// Custom Cache Names
// https://developers.google.com/web/tools/workbox/guides/configure-workbox
workbox.core.setCacheNameDetails({
  prefix: "rr",
  suffix: "v4"
});
/**
 * See: https://developers.google.com/web/tools/workbox/modules/workbox-sw#skip_waiting_and_clients_claim
 */
workbox.skipWaiting();
workbox.clientsClaim();

// Credits: https://github.com/GoogleChrome/workbox/issues/1407
// clean up old SW caches
let currentCacheNames = Object.assign(
  { precacheTemp: workbox.core.cacheNames.precache + "-temp" },
  workbox.core.cacheNames
);

// clean up old SW caches
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      let validCacheSet = new Set(Object.values(currentCacheNames));
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return !validCacheSet.has(cacheName);
          })
          .map(function(cacheName) {
            //console.log("deleting cache", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});
// The precacheAndRoute method of the precaching module takes a precache
// "manifest" (a list of file URLs with "revision hashes") to cache on service
// worker installation. It also sets up a cache-first strategy for the
// specified resources, serving them from the cache by default.
// In addition to precaching, the precacheAndRoute method sets up an implicit
// cache-first handler.
workbox.precaching.precacheAndRoute(["./", "./restaurant.html"]);

/**
 * Precache the static assets matching the regex
 */
workbox.routing.registerRoute(
  /.*\.(?:js|html|css|json)/,
  workbox.strategies.cacheFirst({ cacheName: "precache" })
);

/**
 * Whatever is not cached in the JS and CSS, fetch the files and cache them while making sure they are updated in the background for the next use.
 */
workbox.routing.registerRoute(
  /\.(?:js|css)$/,
  workbox.strategies.staleWhileRevalidate({ cacheName: "static-assets" })
);

/**
 * Cache the images
 */
/**
 * Images are cached and used until it’s a week old, after which it’ll need updating
 */
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
const MAX_ENTRIES =
  5 * 10 + //restaurant images
  4 + //placeholder svg
  10; //icons

workbox.routing.registerRoute(
  /.*\.(?:png|jpe?g|svg|gif|webp|svg)/,
  workbox.strategies.cacheFirst({
    cacheName: "img-cache",
    plugins: [
      new workbox.expiration.Plugin({
        // Cache only 20 images
        maxEntries: MAX_ENTRIES,
        // Cache for a maximum of a week
        maxAgeSeconds: WEEK_IN_SECONDS
      })
    ]
  })
);

/**
 * Cache the Google Static API images (to show them while offline)
 */
workbox.routing.registerRoute(
  /.*googleapis.com\/maps\/api\/staticmap.*$/,
  workbox.strategies.staleWhileRevalidate({ cacheName: "staticmaps-cache" })
);

// Make sure to register the restaurant detail URL with the GET parmeters using the "cacheFirst" strategy.
// http://localhost:8887/restaurant.html?id=1
workbox.routing.registerRoute(
  new RegExp("restaurant.html(.*)"),
  workbox.strategies.cacheFirst({
    cacheName: "pages",
    // Status 0 is the response you would get if you request a cross-origin
    // resource and the server that you're requesting it from is not
    // configured to serve cross-origin resources.
    cacheableResponse: { statuses: [0, 200] }
  })
);
workbox.routing.registerRoute(
  new RegExp("index.html"),
  workbox.strategies.cacheFirst({
    cacheName: "pages",
    // Status 0 is the response you would get if you request a cross-origin
    // resource and the server that you're requesting it from is not
    // configured to serve cross-origin resources.
    cacheableResponse: { statuses: [0, 200] }
  })
);

importScripts("./js/bgSync.min.js");
self.addEventListener("sync", event => {
  console.log("Sync is working... Just do stuff now!");
  if (event.tag.startsWith("review")) {
    console.log("Sync is working... Process event!");
    event.waitUntil(ProcessUnsavedReview(event.tag));
  } else {
  }
});

function ProcessUnsavedReview(reviewKey) {
  getOfflineReview(reviewKey)
    .then(offlineReview => {
      if (offlineReview == null || offlineReview == undefined) {
        throw new Error("No review found!");
      }
      return ResendReview(offlineReview);
    })
    .then(syncResult => {
      if (!syncResult.status) {
        console.error(new Error("API still not available..."));
        broadcast({ action: "api-unavailable" }, syncResult.review);
        return;
      }

      console.log("Sync is ok... Proceed!");
      removeOfflineReview(reviewKey)
        .then(result => {
          if (result) {
            broadcast({ action: "review-saved" }, syncResult.review);
          } else {
            broadcast({ action: "review-not-deleted" }, syncResult.review);
          }
        })
        .catch(err => {
          console.error("Impossible to remove cached offline review => ", err);
        });
    })
    .catch(err => {
      console.error("Failed to process sync event => ", err);
    });
}

function ResendReview(review) {
  console.log("Let's resend the review the API...");
  return saveNewReview(review)
    .then(apiResult => {
      return { status: apiResult.status, review: review };
    })
    .catch(err => {
      console.error("Failed to resend to the review from sw => ", err);
      return { status: false, review: undefined };
    });
}

function broadcast(message) {
  clients.matchAll().then(clients => {
    for (const client of clients) {
      client.postMessage(message);
    }
  });
}
