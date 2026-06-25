import { defineMiddleware } from "astro:middleware";
import crypto from "crypto";

// Secret for signing cookies/tokens
const SECURITY_SECRET = process.env.SECURITY_SECRET || "meidallm-cyber-defense-key-2026";

// Simple SHA-256 helper
function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// Generate a valid verification cookie value
function generateVerificationToken(ip: string, timestamp: number): string {
  const data = `${ip}:${timestamp}`;
  const signature = crypto.createHmac("sha256", SECURITY_SECRET).update(data).digest("hex");
  return `${timestamp}.${signature}`;
}

// Validate verification cookie value
function validateVerificationToken(token: string, ip: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr || "0", 10);
  
  // 15-minute expiry
  const now = Date.now();
  if (now - timestamp > 15 * 60 * 1000) return false;
  
  const expectedSignature = crypto.createHmac("sha256", SECURITY_SECRET).update(`${ip}:${timestamp}`).digest("hex");
  return signature === expectedSignature;
}

// Sliding-window IP Rate Limiter
// key: IP address, value: array of timestamps (ms)
const rateLimitMap = new Map<string, number[]>();
// Track POST requests specifically for login/signup/state endpoints
const postLimitMap = new Map<string, number[]>();

function cleanOldRequests(timestamps: number[], windowMs: number): number[] {
  const now = Date.now();
  return timestamps.filter(t => now - t < windowMs);
}

// Clean up maps periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const cleaned = cleanOldRequests(timestamps, 60 * 1000);
    if (cleaned.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, cleaned);
  }
  for (const [ip, timestamps] of postLimitMap.entries()) {
    const cleaned = cleanOldRequests(timestamps, 60 * 1000);
    if (cleaned.length === 0) postLimitMap.delete(ip);
    else postLimitMap.set(ip, cleaned);
  }
}, 5 * 60 * 1000);

export const onRequest = defineMiddleware(async (context: any, next: any) => {
  const { request, url, cookies } = context;
  
  // Exclude static assets, health check, and internal files
  if (
    url.pathname.startsWith("/_astro") ||
    url.pathname.startsWith("/api/health") ||
    url.pathname.includes(".") // e.g. favicon.ico, images
  ) {
    return next();
  }

  // Get Client IP
  const clientIp = 
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
    request.headers.get("x-real-ip") || 
    context.clientAddress ||
    "127.0.0.1";

  const now = Date.now();

  // 1. IP Rate Limiting Logic
  let ipRequests = rateLimitMap.get(clientIp) || [];
  ipRequests = cleanOldRequests(ipRequests, 60 * 1000);
  ipRequests.push(now);
  rateLimitMap.set(clientIp, ipRequests);

  const requestCount = ipRequests.length;

  // 2. POST endpoint rate limiting
  let postRequests = postLimitMap.get(clientIp) || [];
  if (request.method === "POST") {
    postRequests = cleanOldRequests(postRequests, 60 * 1000);
    postRequests.push(now);
    postLimitMap.set(clientIp, postRequests);
  }
  const postCount = postRequests.length;

  // DDoS / Hard Block threshold (120 req/min)
  if (requestCount > 120) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>429 Too Many Requests</title>
        <style>
          body {
            background-color: #0b0f19;
            color: #f3f4f6;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: rgba(17, 24, 39, 0.7);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            max-width: 450px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
          h1 { color: #ef4444; margin-top: 0; font-size: 24px; }
          p { color: #9ca3af; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Cyber Shield Triggered</h1>
          <p>Too many requests detected from your IP Address (${clientIp}). To prevent Application-Layer DDoS threats, your access is temporarily restricted. Please wait a minute and refresh.</p>
        </div>
      </body>
      </html>`,
      {
        status: 429,
        headers: { "Content-Type": "text/html" }
      }
    );
  }

  // 3. CAPTCHA Handler & Middleware interception
  const captchaSession = cookies.get("cap_session")?.value || "";
  const isVerified = validateVerificationToken(captchaSession, clientIp);

  // Check if we need to verify captcha
  if (url.pathname === "/verify-captcha") {
    const challenge = url.searchParams.get("challenge") || "";
    const nonce = url.searchParams.get("nonce") || "";
    const redirectUrl = url.searchParams.get("redirect") || "/";

    // Difficulty verification: Must hash to start with '0000' (approx. 65k operations, ~100ms on client)
    const hash = sha256(challenge + nonce);
    if (hash.startsWith("0000") && challenge.includes(clientIp)) {
      // Create session cookie
      const token = generateVerificationToken(clientIp, now);
      cookies.set("cap_session", token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 // 15 minutes
      });
      return context.redirect(redirectUrl);
    } else {
      return new Response(JSON.stringify({ error: "Invalid cryptographic proof of work." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Trigger CAPTCHA check for:
  // - Explicit test request (?trigger-captcha=true)
  // - Moderate rate limit trigger (40-120 req/min)
  // - High frequency POST operations (15+ POST reqs/min)
  const shouldTriggerCaptcha = 
    !isVerified && 
    (url.searchParams.get("trigger-captcha") === "true" || 
     requestCount > 40 || 
     (request.method === "POST" && postCount > 15));

  if (shouldTriggerCaptcha) {
    const challenge = `${clientIp}:${now}:${Math.random().toString(36).substring(2)}`;
    const redirectParam = encodeURIComponent(url.pathname + url.search);
    
    // Return premium CAPTCHA page
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Verification Required</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-color: #0b0f19;
            --card-bg: rgba(17, 24, 39, 0.75);
            --border-color: rgba(99, 102, 241, 0.25);
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
          }
          body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            overflow: hidden;
            position: relative;
          }
          .background {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1;
            overflow: hidden;
          }
          .circle {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
            filter: blur(40px);
          }
          .circle-1 { width: 400px; height: 400px; top: -100px; left: -100px; }
          .circle-2 { width: 500px; height: 500px; bottom: -150px; right: -100px; }

          .card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 40px;
            width: 100%;
            max-width: 440px;
            box-sizing: border-box;
            backdrop-filter: blur(12px);
            z-index: 2;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
            text-align: center;
            animation: fadeIn 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            color: var(--primary);
            margin-bottom: 24px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 12px 0;
            letter-spacing: -0.02em;
          }
          p {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.6;
            margin: 0 0 28px 0;
          }
          .btn {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 14px 28px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .btn:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
          }
          .btn:disabled {
            background: rgba(99, 102, 241, 0.4);
            cursor: not-allowed;
            box-shadow: none;
          }
          .progress-bar-container {
            display: none;
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 3px;
            margin-top: 24px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            border-radius: 3px;
            transition: width 0.1s linear;
          }
          .status-text {
            display: none;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 10px;
          }
          .footer {
            margin-top: 32px;
            font-size: 11px;
            color: rgba(156, 163, 175, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .footer svg { width: 14px; height: 14px; fill: currentColor; }
        </style>
      </head>
      <body>
        <div class="background">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
        </div>

        <div class="card">
          <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 32px; height: 32px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1>Security Verification</h1>
          <p>To verify your session and mitigate automated DDoS risks, please solve a quick cryptographic verification challenge.</p>
          
          <button id="verify-btn" class="btn" onclick="startVerification()">
            Verify Connection
          </button>

          <div class="progress-bar-container" id="progress-container">
            <div class="progress-bar" id="progress-bar"></div>
          </div>
          <div class="status-text" id="status-text">Ready</div>

          <div class="footer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clip-rule="evenodd" />
            </svg>
            Powered by Cap • Privacy First
          </div>
        </div>

        <script>
          const challenge = "${challenge}";
          const redirect = "${redirectParam}";

          // Simple client-side SHA-256 implementation
          async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          }

          async function startVerification() {
            const btn = document.getElementById('verify-btn');
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.getElementById('progress-bar');
            const statusText = document.getElementById('status-text');

            btn.disabled = true;
            btn.innerHTML = 'Analyzing Connection...';
            progressContainer.style.display = 'block';
            statusText.style.display = 'block';

            let nonce = 0;
            let solved = false;
            const startTime = Date.now();
            
            // To prevent blocking the main thread entirely and show progress, we do it in chunks
            const batchSize = 1000;
            
            async function solveLoop() {
              for (let i = 0; i < batchSize; i++) {
                const testString = challenge + nonce;
                
                // Let's implement a standard Javascript proof-of-work finder
                // Challenge difficulty: start with '0000'
                // We use subtle crypto which is fast, but async.
                const hash = await sha256(testString);
                
                if (hash.startsWith('0000')) {
                  solved = true;
                  break;
                }
                nonce++;
              }

              if (solved) {
                progressBar.style.width = '100%';
                statusText.innerText = 'Verification complete! Redirecting...';
                window.location.href = '/verify-captcha?challenge=' + encodeURIComponent(challenge) + '&nonce=' + nonce + '&redirect=' + redirect;
              } else {
                // Update simulated progress based on operations completed
                const elapsed = Date.now() - startTime;
                // Cap progress at 95% until solved
                const progress = Math.min(95, Math.floor((nonce / 80000) * 100));
                progressBar.style.width = progress + '%';
                statusText.innerText = 'Solving security puzzle... ' + progress + '%';
                
                // Continue in next frame to keep browser responsive
                requestAnimationFrame(solveLoop);
              }
            }

            solveLoop();
          }
        </script>
      </body>
      </html>`,
      {
        status: 403,
        headers: { "Content-Type": "text/html" }
      }
    );
  }

  // 4. Inject Security Headers on response
  const response = await next();
  
  response.headers.set("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  return response;
});
