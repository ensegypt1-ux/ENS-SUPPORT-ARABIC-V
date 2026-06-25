import { DEV_PWA_CLEANUP_KEY } from "@/lib/pwa/constants";

/**
 * Runs before React hydrates in local dev (when PWA is disabled).
 * Removes stale service workers once per tab so cached HTML (transferSize 0)
 * does not interact badly with Next.js dev tooling.
 */
export function DevServiceWorkerReset() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_PWA === "true"
  ) {
    return null;
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var k=${JSON.stringify(DEV_PWA_CLEANUP_KEY)};if(!("serviceWorker"in navigator))return;if(sessionStorage.getItem(k)==="1")return;try{sessionStorage.setItem(k,"1");}catch(e){}Promise.all([navigator.serviceWorker.getRegistrations().then(function(regs){return Promise.all(regs.map(function(r){return r.unregister()}))}),"caches"in window?caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key.indexOf("solvio-pwa-")===0}).map(function(key){return caches.delete(key)}))}):Promise.resolve()]).catch(function(){});}catch(e){}})();`,
      }}
    />
  );
}
