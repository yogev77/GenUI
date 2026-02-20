/**
 * Builds a standalone HTML page for a funnel component.
 * Uses CDN React + Tailwind + Babel to render JSX at runtime.
 * No Next.js build required — instant availability.
 */

const FAKE_CHECKOUT_SOURCE = `
function FakeCheckout({ price, productName, onPurchase }) {
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  function formatCard(value) {
    const digits = value.replace(/\\D/g, "").slice(0, 16);
    return digits.replace(/(\\d{4})(?=\\d)/g, "$1 ");
  }
  function formatExpiry(value) {
    const digits = value.replace(/\\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }
  function validate() {
    const errs = {};
    if (cardNumber.replace(/\\s/g, "").length < 13) errs.card = "Enter a valid card number";
    if (expiry.length < 5) errs.expiry = "Enter MM/YY";
    if (cvc.length < 3) errs.cvc = "Enter CVC";
    if (!email.includes("@")) errs.email = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setSuccess(true); __trackEvent__("email_capture", email); onPurchase(); }, 2000);
  }

  if (success) {
    return React.createElement("div", { className: "max-w-md mx-auto text-center py-12 px-6" },
      React.createElement("div", { className: "w-16 h-16 rounded-full bg-leaf-400/20 flex items-center justify-center mx-auto mb-4" },
        React.createElement("svg", { className: "w-8 h-8 text-leaf-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5 },
          React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
        )
      ),
      React.createElement("h3", { className: "text-2xl font-bold text-gray-900 mb-2" }, "Payment Successful!"),
      React.createElement("p", { className: "text-gray-500" }, "Thank you for your purchase of " + productName + "."),
      React.createElement("p", { className: "text-xs text-gray-500 mt-4" }, "This is a demo — no real payment was processed.")
    );
  }

  return React.createElement("form", { onSubmit: handleSubmit, className: "max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm" },
    React.createElement("div", { className: "flex items-center justify-between mb-2" },
      React.createElement("span", { className: "text-sm text-gray-500" }, "Pay for"),
      React.createElement("span", { className: "font-semibold text-gray-900" }, productName)
    ),
    React.createElement("div", { className: "border-t border-gray-100 pt-4" },
      React.createElement("div", { className: "flex items-center justify-between mb-4" },
        React.createElement("span", { className: "text-gray-600" }, "Total"),
        React.createElement("span", { className: "text-2xl font-bold text-gray-900" }, "$" + price)
      )
    ),
    React.createElement("div", null,
      React.createElement("label", { className: "block text-sm text-gray-400 mb-1" }, "Email"),
      React.createElement("input", { type: "email", value: email, onChange: function(e){setEmail(e.target.value)}, placeholder: "you@example.com", className: "w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 transition-colors" }),
      errors.email && React.createElement("p", { className: "text-xs text-red-400 mt-1" }, errors.email)
    ),
    React.createElement("div", null,
      React.createElement("label", { className: "block text-sm text-gray-400 mb-1" }, "Card number"),
      React.createElement("input", { type: "text", value: cardNumber, onChange: function(e){setCardNumber(formatCard(e.target.value))}, placeholder: "4242 4242 4242 4242", className: "w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 transition-colors font-mono" }),
      errors.card && React.createElement("p", { className: "text-xs text-red-400 mt-1" }, errors.card)
    ),
    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
      React.createElement("div", null,
        React.createElement("label", { className: "block text-sm text-gray-400 mb-1" }, "Expiry"),
        React.createElement("input", { type: "text", value: expiry, onChange: function(e){setExpiry(formatExpiry(e.target.value))}, placeholder: "MM/YY", className: "w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 transition-colors font-mono" }),
        errors.expiry && React.createElement("p", { className: "text-xs text-red-400 mt-1" }, errors.expiry)
      ),
      React.createElement("div", null,
        React.createElement("label", { className: "block text-sm text-gray-400 mb-1" }, "CVC"),
        React.createElement("input", { type: "text", value: cvc, onChange: function(e){setCvc(e.target.value.replace(/\\D/g,"").slice(0,4))}, placeholder: "123", className: "w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 transition-colors font-mono" }),
        errors.cvc && React.createElement("p", { className: "text-xs text-red-400 mt-1" }, errors.cvc)
      )
    ),
    React.createElement("button", { type: "submit", disabled: processing, className: "w-full py-3 rounded-xl font-semibold text-white bg-leaf-400 hover:bg-leaf-400/90 transition-colors disabled:opacity-50 cursor-pointer" },
      processing ? "Processing..." : "Pay $" + price
    ),
    React.createElement("p", { className: "text-xs text-center text-gray-500 mt-2" }, "Demo checkout — no real payment is processed")
  );
}
`;

export function sanitizeForStandalone(code: string): string {
  return code
    .replace(/^\s*"use client";\s*\n?/m, "")
    .replace(/^\s*\/\/\s*@ts-nocheck\s*\n?/m, "")
    .replace(/^\s*import\s+.*from\s+['"].*['"];?\s*\n?/gm, "")
    .replace(/^\s*export\s+default\s+/m, "const __Component__ = ");
}

export interface FunnelColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  dark: string;
}

export interface FunnelStyleInput {
  colors: FunnelColors;
  fonts?: {
    heading: string;
    body: string;
  };
  styleNotes?: string;
}

export function buildStandaloneHTML(opts: {
  componentCode: string;
  funnelId: string;
  pageName: string;
  apiBase: string;
  nextUrl?: string | null;
  colors?: FunnelColors | null;
  style?: FunnelStyleInput | null;
}): string {
  const { componentCode, funnelId, pageName, apiBase, nextUrl } = opts;
  const colors = opts.style?.colors ?? opts.colors ?? null;
  const fonts = opts.style?.fonts;

  const sanitized = sanitizeForStandalone(componentCode);
  const needsFakeCheckout = componentCode.includes("FakeCheckout");

  // Build full source block, then base64-encode to avoid HTML escaping issues.
  // We use Babel.transform() programmatically so we can pass isTSX:true
  // to the TypeScript preset (not possible via data-presets attribute).
  const fullSource = [
    `var { useState, useEffect, useRef, useCallback, useMemo } = React;`,
    needsFakeCheckout ? FAKE_CHECKOUT_SOURCE : "",
    sanitized,
    `function handleEvent(type, value) { __trackEvent__(type, value); }`,
    `var root = ReactDOM.createRoot(document.getElementById("root"));`,
    `root.render(React.createElement(__Component__, { onEvent: handleEvent${nextUrl ? `, nextUrl: ${JSON.stringify(nextUrl)}` : ""} }));`,
  ]
    .filter(Boolean)
    .join("\n");

  const encodedSource = Buffer.from(fullSource).toString("base64");

  // Build Google Fonts link if custom fonts
  const fontFamilies: string[] = [];
  if (fonts) {
    if (fonts.heading && fonts.heading !== "system-ui") fontFamilies.push(fonts.heading);
    if (fonts.body && fonts.body !== "system-ui" && fonts.body !== fonts.heading) fontFamilies.push(fonts.body);
  }
  const googleFontsLink = fontFamilies.length > 0
    ? `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?${fontFamilies.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap" rel="stylesheet" />`
    : "";

  const fontFamilyCSS = fonts
    ? `font-family: '${fonts.body}', system-ui, -apple-system, sans-serif;`
    : "font-family: system-ui, -apple-system, sans-serif;";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageName}</title>
  ${googleFontsLink}
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            leaf: {
              100: '${colors?.background ?? "#e8f1fb"}',
              200: '${colors?.accent ?? "#414141"}',
              400: '${colors?.primary ?? "#338bd5"}',
              700: '${colors?.secondary ?? "#2d1f93"}',
              900: '${colors?.accent ?? "#2e2e2e"}',
              950: '${colors?.dark ?? "#1b1b1b"}',
            }
          }
        }
      }
    };
  <\/script>
  <style>
    body { margin: 0; ${fontFamilyCSS} }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Event tracking -->
  <script>
    var __SESSION_ID__ = (function() {
      var key = "funnel-session-id";
      var id = sessionStorage.getItem(key);
      if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(key, id); }
      return id;
    })();

    var __VISITOR_ID__ = (function() {
      var match = document.cookie.match(/funnel-visitor-id=([^;]+)/);
      if (match) return match[1];
      var id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      document.cookie = "funnel-visitor-id=" + id + ";path=/;max-age=31536000;SameSite=Lax";
      return id;
    })();

    function __trackEvent__(type, value) {
      var payload = JSON.stringify({
        funnelId: ${JSON.stringify(funnelId)},
        pageName: ${JSON.stringify(pageName)},
        sessionId: __SESSION_ID__,
        visitorId: __VISITOR_ID__,
        type: type,
        value: value,
        timestamp: new Date().toISOString()
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(${JSON.stringify(apiBase + "/api/funnel/events")}, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(${JSON.stringify(apiBase + "/api/funnel/events")}, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload
        }).catch(function(){});
      }
    }

    // Track page view
    __trackEvent__("page_view");

    // Track scroll depth once
    var __scrollTracked__ = false;
    window.addEventListener("scroll", function() {
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      var depth = Math.round((window.scrollY / scrollHeight) * 100);
      if (depth > 50 && !__scrollTracked__) {
        __scrollTracked__ = true;
        __trackEvent__("scroll_depth", depth);
      }
    }, { passive: true });
  <\/script>

  <!-- Component: compiled via Babel with TypeScript+JSX support -->
  <script>
    (function() {
      var __src = new TextDecoder().decode(Uint8Array.from(atob("${encodedSource}"), function(c) { return c.charCodeAt(0); }));
      var __out = Babel.transform(__src, {
        presets: [
          ["react", { runtime: "classic" }],
          ["typescript", { isTSX: true, allExtensions: true }]
        ]
      });
      eval(__out.code);
    })();
  <\/script>
</body>
</html>`;
}
