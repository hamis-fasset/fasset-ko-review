#!/usr/bin/env node
/**
 * Enrich the route inventory with the exact, statically resolvable i18n keys used
 * by each screen and its first-level feature-local imports.
 *
 * Usage:
 *   node build/generate-code-screens.js /path/to/CashApp
 *
 * Inputs live beside this script in ../data. The generated code-screens.json is
 * consumed by the browser review tool; it is intentionally source-derived so
 * uncaptured routes are visible instead of being collapsed into one giant bucket.
 */
const fs = require('fs');
const path = require('path');

const TOOL = path.resolve(__dirname, '..');
const ROOT = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(ROOT, 'src'))) {
  console.error('Pass the CashApp repository root as the first argument.');
  process.exit(2);
}

const ALIASES = {
  '@assets': 'src/assets', '@components': 'src/components', '@constants': 'src/constants',
  '@modules': 'src/modules', '@route': 'src/route', '@screens': 'src/screens',
  '@services': 'src/services', '@styles': 'src/styles', '@utils': 'src/utils',
  '@themeV3': 'src/theme_v3', '@assetsV3': 'src/assets_v3', '@hooks': 'src/hooks',
  '@crypto-bundles': 'src/screens/Dashboard/crypto-bundle',
  '@buy-sell': 'src/screens/Dashboard/trade/buy-sell',
  '@typography': 'src/components_v4/typography', '@modals': 'src/components_v4/modals',
  '@cards': 'src/components_v4/cards', '@layouts': 'src/components_v4/layouts',
  '@animations': 'src/components_v4/animated', '@media': 'src/components_v4/media',
  '@buttons': 'src/components_v4/buttons', '@charts': 'src/components_v4/charts',
  '@icons': 'src/assets_v4/icons', '@images': 'src/assets_v4/images',
  '@themeV4': 'src/theme_v4', '@componentsV4': 'src/components_v4', '@sdk': 'src/sdk',
};

function resolveFile(spec, fromFile) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else {
    const alias = Object.keys(ALIASES).find(a => spec === a || spec.startsWith(a + '/'));
    if (!alias) return null;
    base = path.join(ROOT, ALIASES[alias], spec.slice(alias.length));
  }
  for (const suffix of ['', '.js', '.jsx', '.ts', '.tsx', '.ios.js', '.android.js', '/index.js', '/index.jsx', '/index.ts', '/index.tsx']) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function parseImports(source) {
  const specs = [];
  const re = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) specs.push(match[1]);
  const sideEffect = /import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffect.exec(source))) specs.push(match[1]);
  const required = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = required.exec(source))) specs.push(match[1]);
  return [...new Set(specs)];
}

function featureChildren(file) {
  const source = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const featureDir = path.dirname(dir);
  return parseImports(source).map(spec => resolveFile(spec, file)).filter(child => {
    if (!child || child === file || !child.startsWith(featureDir + path.sep)) return false;
    if (/\.(json|png|svg|jpe?g)$/.test(child)) return false;
    if (/src\/components(_v4)?\//.test(child) && !child.startsWith(dir + path.sep)) return false;
    return true;
  });
}

const STATIC_CALL = /\b(?:translate|i18n\.t|t)\(\s*(['"`])([A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+)\1/g;
const ANY_CALL = /\b(?:translate|i18n\.t|t)\(\s*/g;
const FILE_FIXES = {
  'src/screens/Dashboard/referral/screens/MyReferrals.js': 'src/screens/Dashboard/referral/screens/MyReferrals/index.js',
};
const CAPTURE_CORRECTIONS = {
  Signup: ['login_01_logged_out_home', 'logout_03_logged_out'],
  PortfolioHome: ['login_06_dashboard', 'dashboard_01_home', 'history_01_recent'],
  Markets: ['market_01_root'],
  MarketAssetListing: ['market_02_commodities', 'market_03_funds'],
  BundleList: ['market_04_bundles'],
  Buy_v4: ['buy_01_trade_sheet'],
  SelectAsset: ['buy_02_asset_list'],
  SelectPaymentMethod: ['buy_03_payment_method'],
  BuyKeyboardScreen: ['buy_04_amount_empty', 'buy_05_amount_filled'],
  TradePreview: ['buy_06_confirmation', 'sell_06_confirmation'],
  TradeSuccess: ['buy_07_success', 'sell_07_success'],
  Sell_v4: ['sell_01_trade_sheet'],
  SelectSellAsset: ['sell_02_asset_list'],
  SellPaymentMethods: ['sell_03_receive_method'],
  SellKeyboardScreen: ['sell_04_amount_empty', 'sell_05_amount_filled'],
  AllTransactionHistory: ['history_02_list'],
  SellTransactionDetail_v4: ['history_03_detail'],
  Account_: ['settings_01_hub', 'logout_01_account_menu', 'logout_02_confirm_dialog'],
  Preferences: ['settings_02_language', 'settings_03_currency'],
  KycJourney: ['kyc_ae_01_financial_profile', 'kyc_ae_02_proof_of_address', 'kyc_ae_03_money_questions', 'kyc_ae_04_link_bank', 'kyc_lb_01_financial_profile', 'kyc_lb_02_money_questions', 'kyc_lb_03_money_questions_filled'],
};
function collect(relFile) {
  if (!relFile) return { keys: [], unresolvedKeys: [], dynamicCalls: 0, scanned: [] };
  const file = path.join(ROOT, relFile);
  if (!fs.existsSync(file)) return { keys: [], unresolvedKeys: [], dynamicCalls: 0, scanned: [] };
  const files = [file, ...featureChildren(file)];
  const keys = new Set();
  let allCalls = 0;
  let staticCalls = 0;
  for (const candidate of files) {
    let source;
    try { source = fs.readFileSync(candidate, 'utf8'); } catch { continue; }
    let match;
    ANY_CALL.lastIndex = 0;
    while (ANY_CALL.exec(source)) allCalls += 1;
    STATIC_CALL.lastIndex = 0;
    while ((match = STATIC_CALL.exec(source))) { keys.add(match[2]); staticCalls += 1; }
  }
  return {
    keys: [...keys].sort(),
    dynamicCalls: Math.max(0, allCalls - staticCalls),
    scanned: files.map(fileName => path.relative(ROOT, fileName)),
  };
}

const inventory = JSON.parse(fs.readFileSync(path.join(TOOL, 'data/screen-inventory.json'), 'utf8'));
const copy = JSON.parse(fs.readFileSync(path.join(TOOL, 'data/copy.json'), 'utf8'));
const copyKeys = new Set(copy.map(row => row.k));
const canonicalOf = Object.fromEntries(copy.map(row => [row.k, row.canon]));

for (const screen of inventory) {
  screen.file = FILE_FIXES[screen.file] || screen.file;
  screen.capture_ids = CAPTURE_CORRECTIONS[screen.route] || [];
  screen.captured = screen.capture_ids.length > 0;
}
fs.writeFileSync(path.join(TOOL, 'data/screen-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');

const screens = inventory.map((screen, index) => {
  const correctedFile = screen.file;
  const found = collect(correctedFile);
  const known = [];
  const unresolved = [];
  for (const key of found.keys) {
    if (copyKeys.has(key)) known.push(canonicalOf[key] || key);
    else unresolved.push(key);
  }
  const stableFile = correctedFile || `container-${index}`;
  const captureIds = CAPTURE_CORRECTIONS[screen.route] || [];
  return {
    id: `code:${screen.route}:${stableFile}`,
    route: screen.route,
    file: correctedFile,
    navigator: screen.navigator,
    captured: captureIds.length > 0,
    captureIds,
    container: !!screen.container,
    keys: [...new Set(known)].sort(),
    unresolvedKeys: unresolved,
    dynamicCalls: found.dynamicCalls,
    reportedCalls: screen.t_calls || 0,
    hardcodedEstimate: screen.hardcoded_literals_estimate || 0,
    scanned: found.scanned,
    ...(screen.note ? { note: screen.note } : {}),
  };
});

const out = {
  generatedAt: new Date().toISOString(),
  source: {
    branch: 'development',
    commit: (() => {
      try { return require('child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
      catch { return null; }
    })(),
  },
  totals: {
    routes: screens.length,
    reviewableScreens: screens.filter(s => !s.container).length,
    capturedScreens: screens.filter(s => !s.container && s.captured).length,
    uncapturedScreens: screens.filter(s => !s.container && !s.captured).length,
    screensWithStaticKeys: screens.filter(s => !s.container && s.keys.length).length,
    distinctStaticKeys: new Set(screens.flatMap(s => s.keys)).size,
    unresolvedStaticKeys: new Set(screens.flatMap(s => s.unresolvedKeys)).size,
    dynamicCalls: screens.reduce((sum, s) => sum + s.dynamicCalls, 0),
  },
  screens,
};
fs.writeFileSync(path.join(TOOL, 'data/code-screens.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.totals, null, 2));
