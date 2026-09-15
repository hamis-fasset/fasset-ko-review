# Fasset mobile app (FassetIO/CashApp, branch development) screen inventory

Generated 2026-09-15 from `src/route/index.js`, `src/route/stackNavigators.js`, `src/route/TabNavigators.ios.js` (Android tab file mirrors iOS).

## Totals

- Route registrations parsed: 452 (many routes are registered in both the Auth stack and the Dashboard stack; deduped by route+file)
- Distinct screens (route+component): 402, of which 7 are navigator containers (AppTabs, Home, Pay, Auth, Dashboard, guest wrappers)
- Screens with translation calls: 285; screens with zero `t()` calls in the component or its one-level children: 110
- Captured by the Maestro set: **32** screens (39 capture ids)
- NOT captured: **363** screens

## Navigation structure

- Root stack (`Route`): Splash, onBoarding (Welcome), Auth, Dashboard, Browser, consentScreen, EnterPIN, CreatePIN, ConfirmPIN, LBWelcome, Deeplink, DeeplinkCoinDetail
- Auth stack (`AuthNavigator`): GuestTabs (guest bottom tabs) + login/signup/OTP/PIN/KYC/POA screens, plus a subset of market and trade screens reachable while logged out
- Dashboard stack (`DashboardNavigator`, ~360 routes): AppTabs (main bottom tabs) + every authenticated flow (trade v4, swap, deposit, withdraw, P2P, IBAN, Fasset Pay/card, staking, earn, remittance, donations, referral, stocks, bundles, financing, account settings)
- Main bottom tabs (`AppTabs`): Home -> PortfolioStack (PortfolioHome = TodayScreen, P2P, VerifyIdentity); AccountV4; Pay -> PayStackNavigator (PayResolver, FassetPay, CardSelectionDetailScreen, CardOnboardingScreen); Markets (MarketScreen); Transactions (PaymentScreen)
- Guest bottom tabs (`GuestModeStack`): Home (guest TodayScreen), AccountV4 and Transactions both render the Signup screen, Markets
- Language and currency pickers are bottom sheets inside the `Preferences` route, not routes of their own. Logout is a confirm modal on `Account_`.
- `NewLoginForm` is registered but nothing navigates to it; `LoginForm` is the live email form. `ReferFriend`/`MyReferrals` swap component on the `referralV2` feature flag.

## i18n setup (`src/utils/localization/i18n.js`)

- i18next + react-i18next, `compatibilityJSON: 'v3'`, `fallbackLng: 'en'`.
- Registered locales: `en`, `id`, `in` (alias of the Indonesian bundle), `tr`. Translation files live in `src/utils/localization/{en,id,tr}/translation.json`.
- **No `ko` locale exists** (no folder, no resource entry).
- Detection: AsyncStorage `APP_LANG` first; otherwise device language (`id`/`idn` -> id) else a geo-IP call (`api.fetchUserLocation`, country ID/IDN -> id) else `en`. The chosen language is persisted once.
- `translate.js` is a thin `i18n.t` wrapper; components mostly call `t('namespace.key')` directly.

## Capture mapping used

| capture id | routes |
|---|---|
| login_01_logged_out_home | onBoarding, Home@guest (uncertain: either Welcome (onBoarding) or the guest Home tab) |
| login_02_login_options | Login |
| login_03_email_form | LoginForm |
| login_06_dashboard | PortfolioHome, AppTabs, Home |
| dashboard_01_home | PortfolioHome, AppTabs, Home |
| market_01_root | Markets |
| market_02_commodities | MarketAssetListing |
| market_03_funds | MarketAssetListing |
| market_04_bundles | MarketAssetListing, BundleList (uncertain: could be MarketAssetListing (bundle category) or BundleList) |
| buy_01_trade_sheet | Buy_v4 |
| buy_02_asset_list | SelectAsset |
| buy_03_payment_method | SelectPaymentMethod |
| buy_04_amount_empty | BuyKeyboardScreen |
| buy_05_amount_filled | BuyKeyboardScreen |
| buy_06_confirmation | TradePreview |
| buy_07_success | TradeSuccess |
| sell_01_trade_sheet | Sell_v4 |
| sell_02_asset_list | SelectSellAsset |
| sell_03_payment_method | SellPaymentMethods |
| sell_04_amount_empty | SellKeyboardScreen |
| sell_05_amount_filled | SellKeyboardScreen |
| sell_06_confirmation | TradePreview |
| sell_07_success | TradeSuccess |
| history_01_recent | Transactions |
| history_02_list | PaymentHistory, AllTransactionHistory |
| history_03_detail | BuyTransactionDetail_v4, sendFundsTransactionDetailScreen (uncertain: detail type depends on which transaction was tapped) |
| settings_01_hub | AccountV4, Account_ |
| settings_02_language | Preferences (uncertain: language and currency are bottom sheets inside Preferences, not routes) |
| settings_03_currency | Preferences (uncertain: see settings_02_language) |
| logout_01 | Account_ |
| logout_02 | Account_ |
| logout_03 | onBoarding |
| kyc_ae_01_financial_profile | KycJourney |
| kyc_ae_02_proof_of_address | POAList, POADetails, UploadPOA |
| kyc_ae_03_money_questions | KycJourney |
| kyc_ae_04_link_bank | AddPayMethod, LeanOnBoarding |
| kyc_lb_01 | LBWelcome |
| kyc_lb_02 | LBWelcome (uncertain: LB steps 2-3 likely continue into KycJourney/Verify; only LBWelcome asserted) |
| kyc_lb_03 | LBWelcome (uncertain: see kyc_lb_02) |

## Top 15 uncaptured screens by translated-string weight

Weight = per-screen `t()` calls per namespace, scaled by log10 of the namespace size you supplied (new 806, fassetCard 258, ...). `t` = raw call count.

| # | route | file | navigator | namespaces | t | weight |
|---|---|---|---|---|---|---|
| 1 | OrderDetails | src/screens/Dashboard/p2p/OrderDetails/index.js | Dashboard stack (authenticated root) | new, signUp, indoDepositPayList, portfolio | 115 | 439 |
| 2 | FassetPay | src/screens/Dashboard/FassetPay/screens/HomeScreen.js | Pay tab stack | fassetCard, new | 56 | 192 |
| 3 | MyAdsForm | src/screens/Dashboard/p2p/MyAdsForm/index.js | Dashboard stack (authenticated root) | new, signUp, p2pTabs | 45 | 171 |
| 4 | consentScreen | src/screens/Authentication/consentScreen/index.js | Auth stack + Root stack | signUp, new | 51 | 159 |
| 5 | RainCardConfirmOrderScreen | src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardConfirmOrderScreen.js | Dashboard stack (authenticated root) | fassetCard | 42 | 143 |
| 6 | DepositEwallet | src/screens/Dashboard/wallet/deposit/depositIndo/depositEwallet.js | Dashboard stack (authenticated root) | new, depositV4 | 41 | 140 |
| 7 | DepositCBB | src/screens/Dashboard/wallet/deposit/depositCBB/index.js | Dashboard stack (authenticated root) | new | 35 | 137 |
| 8 | WithdrawCrypto | src/screens/Dashboard/wallet/withdrawCrypto/index.js | Dashboard stack (authenticated root) | new, cryptoWithDraw, signUp, staking | 43 | 126 |
| 9 | TwoFactorAuth | src/screens/Dashboard/account/twoFactorAuth/index.js | Dashboard stack (authenticated root) | new, myFasset | 32 | 122 |
| 10 | AddPaymentForm | src/screens/Dashboard/p2p/AddPaymentForm/index.js | Dashboard stack (authenticated root) | new, signUp, indoDepositPayList | 33 | 120 |
| 11 | AccSetup1 | src/screens/Authentication/accSetup1/index.js | Dashboard stack (authenticated root) + Auth stack | new | 29 | 113 |
| 12 | BankDeposit | src/screens/Dashboard/wallet/bankDeposit/index.js | Dashboard stack (authenticated root) | new | 28 | 109 |
| 13 | RainCardFinancialDetails | src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardFinancialDetails.js | Dashboard stack (authenticated root) | fassetCard | 32 | 109 |
| 14 | FiatTransactionDetail | src/screens/Dashboard/transactionDetail/fiatTransactionDetail.js | Dashboard stack (authenticated root) | new, portfolio | 25 | 94 |
| 15 | ContactsDetail | src/screens/Dashboard/remittance/contactDetail/index.js | Dashboard stack (authenticated root) | remittance, new, pin | 33 | 94 |

## Namespace coverage (your 25 largest namespaces)

| namespace | strings | screens using it | of which captured |
|---|---|---|---|
| new | 806 | 170 | 9 |
| fassetCard | 258 | 21 | 0 |
| earn | 89 | 13 | 1 |
| buyV4 | 79 | 20 | 10 |
| manualKYC | 78 | 5 | 0 |
| refer | 77 | 2 | 0 |
| fassetPay | 70 | 4 | 0 |
| remittance | 70 | 6 | 0 |
| signUp | 68 | 37 | 4 |
| staking | 58 | 15 | 0 |
| updated | 50 | 4 | 3 |
| new_ob | 45 | 7 | 1 |
| swap_v4 | 45 | 6 | 0 |
| depositV4 | 42 | 5 | 0 |
| sellFlow | 39 | 11 | 4 |
| donations | 34 | 6 | 0 |
| accountsV4 | 33 | 5 | 4 |
| myFasset | 31 | 15 | 1 |
| signup_new | 29 | 8 | 0 |
| onBoarding | 27 | 5 | 2 |
| market_v4 | 24 | 4 | 4 |
| pin | 22 | 11 | 0 |
| fassetTag | 20 | 1 | 1 |
| poa | 20 | 12 | 2 |
| portfolio | 20 | 16 | 1 |

## Uncaptured screens grouped by navigator

### Dashboard stack (authenticated root) (300)

- `OrderDetails` — src/screens/Dashboard/p2p/OrderDetails/index.js — ns: new, signUp, indoDepositPayList, portfolio (t=115, literals~4)
- `MyAdsForm` — src/screens/Dashboard/p2p/MyAdsForm/index.js — ns: new, signUp, p2pTabs (t=45, literals~0)
- `WithdrawCrypto` — src/screens/Dashboard/wallet/withdrawCrypto/index.js — ns: new, cryptoWithDraw, signUp, staking (t=43, literals~3)
- `RainCardConfirmOrderScreen` — src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardConfirmOrderScreen.js — ns: fassetCard (t=42, literals~1)
- `DepositEwallet` — src/screens/Dashboard/wallet/deposit/depositIndo/depositEwallet.js — ns: new, depositV4 (t=41, literals~0)
- `DepositCBB` — src/screens/Dashboard/wallet/deposit/depositCBB/index.js — ns: new (t=35, literals~1)
- `PortfolioV4` — src/screens/Dashboard/portfolio_v4/index.js — ns: accountsV4, earn, portfolio, buyV4 (t=34, literals~4)
- `AddPaymentForm` — src/screens/Dashboard/p2p/AddPaymentForm/index.js — ns: new, signUp, indoDepositPayList (t=33, literals~1)
- `ContactsDetail` — src/screens/Dashboard/remittance/contactDetail/index.js — ns: remittance, new, pin (t=33, literals~0)
- `TwoFactorAuth` — src/screens/Dashboard/account/twoFactorAuth/index.js — ns: new, myFasset (t=32, literals~0)
- `RainCardFinancialDetails` — src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardFinancialDetails.js — ns: fassetCard (t=32, literals~0)
- `BankDeposit` — src/screens/Dashboard/wallet/bankDeposit/index.js — ns: new (t=28, literals~7)
- `IDScan` — src/screens/Authentication/ManualKYC/IDScan/index.js — ns: manualKYC, signup_new, new (t=27, literals~0)
- `EarnTransactionDetail` — src/screens/Dashboard/transactionDetail/earnTransactionDetail.js — ns: earn, new (t=26, literals~0)
- `StakeCoin` — src/screens/Dashboard/trade/staking/stakeCoin/index.js — ns: staking, signUp (t=26, literals~0)
- `Swap_v4` — src/screens/Dashboard/trade_v4/swape/Swap_v4.js — ns: swap_v4 (t=25, literals~1)
- `FiatTransactionDetail` — src/screens/Dashboard/transactionDetail/fiatTransactionDetail.js — ns: new, portfolio (t=25, literals~0)
- `Security` — src/screens/Dashboard/account/security/index.js — ns: new, signUp, account (t=25, literals~0)
- `SubscriptionDetailStable` — src/screens/Dashboard/earn/subscriptionDetail/subscriptionDetailStable.js — ns: earn, new, signUp (t=25, literals~0)
- `CardTopUpTxnScreen` — src/screens/Dashboard/transactionDetail/CardTopUpTxnScreen.js — ns: buyV4, fassetCard (t=24, literals~1)
- `Withdraw` — src/screens/Dashboard/wallet/withdraw/index.js — ns: new, indoWithdrawPayList (t=23, literals~0)
- `EnterAmount` — src/screens/Dashboard/remittance/enterAmount/index.js — ns: remittance, signUp, new (t=23, literals~0)
- `ReviewTransfer` — src/screens/Dashboard/remittance/reviewTransfer/index.js — ns: remittance, new (t=23, literals~0)
- `SubscriptionDetailFlexi` — src/screens/Dashboard/earn/subscriptionDetail/subscriptionDetailFlexi.js — ns: earn, portfolio, new, signUp (t=23, literals~0)
- `UpdateInfo` — src/screens/Dashboard/account/updateInfo/index.js — ns: myFasset, new_ob (t=22, literals~0)
- `SwapKeyboardScreen` — src/screens/Dashboard/trade_v4/swape/SwapKeyboardScreen.js — ns: swap_v4 (t=22, literals~0)
- `FassetPaySettings` — src/screens/Dashboard/FassetPay/screens/SettingsScreen.js — ns: fassetCard (t=22, literals~1)
- `DepositBank` — src/screens/Dashboard/wallet/deposit/depositIndo/depositBank.js — ns: depositV4, indoDepositPayList, new (t=21, literals~0)
- `Recieve` — src/screens/Dashboard/wallet/recieve/index.js — ns: new, depositV4 (t=21, literals~1)
- `FassetPayTopUp` — src/screens/Dashboard/CardTopUp/index.js — ns: fassetCard (t=21, literals~3)
- `CardTopUp` — src/screens/Dashboard/CardTopUp/index.js — ns: fassetCard (t=21, literals~3)
- `RainCardAddressScreen` — src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardAddressScreen.js — ns: fassetCard (t=21, literals~1)
- `PaymentScreen` — src/screens/Dashboard/wallet/deposit/depositIndo/PaymentScreen.js — ns: new, depositV4 (t=20, literals~0)
- `TransactionStatus` — src/screens/Dashboard/wallet/deposit/depositIndo/transactionStatus.js — ns: new, portfolio (t=19, literals~0)
- `StakingTransactionDetails` — src/screens/Dashboard/trade/staking/transactionDetails/index.js — ns: staking, voucher (t=19, literals~0)
- `FassetPayStatement` — src/screens/Dashboard/FassetPay/screens/StatementScreen.js — ns: fassetCard, buyV4 (t=19, literals~0)
- `EarnDashboard` — src/screens/Dashboard/earn/dashboard/index.js — ns: earn, modals, new (t=19, literals~0)
- `StableSavings` — src/screens/Dashboard/earn/stableSavings/index.js — ns: earn, modals, portfolio (t=19, literals~0)
- `PreviewProduct` — src/screens/Dashboard/earn/stableSavings/previewProduct.js — ns: earn, new, staking (t=19, literals~1)
- `Selfie` — src/screens/Authentication/ManualKYC/Selfie/index.js — ns: manualKYC, new (t=19, literals~0)
- `BundleTransactionDetail_v4` — src/screens/Dashboard/allTransactionHistory/BundleTransactionDetail_v4/index.js — ns: buyV4, sellFlow (t=18, literals~0)
- `SellTransactionDetail_v4` — src/screens/Dashboard/trade_v4/sell/SellTransactionDetail_v4.js — ns: buyV4, sellFlow (t=18, literals~0)
- `ChangePass` — src/screens/Dashboard/account/changePass/index.js — ns: signUp, new, myFasset, nonSocial (t=18, literals~0)
- `Devices` — src/screens/Dashboard/account/devices/index.js — ns: new, education (t=18, literals~0)
- `StockSellTransactionDetail_v4` — src/screens/Dashboard/allTransactionHistory/StockSellTransactionDetail_v4/index.js — ns: swap_v4, buyV4, sellFlow (t=17, literals~0)
- `StableSavingsDetails` — src/screens/Dashboard/earn/stableSavings/stableSavingsDetails.js — ns: earn, signUp, new, fassetPay (t=17, literals~0)
- `Information` — src/screens/Authentication/ManualKYC/Information/index.js — ns: manualKYC, myFasset, new_ob, new (t=17, literals~2)
- `ConvertCrypto` — src/screens/Dashboard/trade/convert/convertCrypto/index.js — ns: new (t=16, literals~0)
- `SellStock` — src/screens/Dashboard/stocks/sell/sellStock/index.js — ns: new, stockMarketClosed (t=16, literals~1)
- `PreviewStockBuy` — src/screens/Dashboard/stocks/buy/preview/index.js — ns: new, stock, staking, modals (t=16, literals~4)
- `PersonalInfo` — src/screens/Dashboard/account/personalInfo/index.js — ns: new, myFasset, new_ob, account (t=15, literals~0)
- `SwapTransactionDetail_v4` — src/screens/Dashboard/trade_v4/swape/SwapTransactionDetail_v4.js — ns: swap_v4 (t=15, literals~0)
- `Quit` — src/screens/Authentication/ManualKYC/Quit/index.js — ns: manualKYC (t=15, literals~0)
- `WireTransferTransactionDetail` — src/screens/Dashboard/wallet/deposit/wireTransfer_v4/WireTransferTransactionDetail.js — ns: buyV4 (t=14, literals~0)
- `SendReceiveTransactionDetail` — src/screens/Dashboard/transactionDetail/sendReceiveTransactionDetail.js — ns: new (t=14, literals~0)
- `LeanTransactionDetail` — src/screens/Dashboard/wallet/deposit/depositLeanV4/LeanTransactionDetail.js — ns: buyV4 (t=14, literals~0)
- `FassetPayLimits` — src/screens/Dashboard/FassetPay/screens/LimitsScreen.js — ns: fassetCard (t=14, literals~1)
- `FassetPayCardPIN` — src/screens/Dashboard/FassetPay/screens/FassetPayCardPINScreen.js — ns: fassetCard (t=14, literals~0)
- `ConfirmOrderScreen` — src/screens/Dashboard/FassetPay/screens/CardKYC/ConfirmOrderScreen.js — ns: fassetCard (t=14, literals~20)
- `Contacts` — src/screens/Dashboard/remittance/contacts/index.js — ns: remittance (t=14, literals~0)
- `VerifyOtp` — src/screens/Dashboard/account/verifyOtp/index.js — ns: myFasset, new, verifyDevice, pin (t=13, literals~0)
- `FinancingPreview` — src/screens/Dashboard/financing/financingCrypto/FinancingPreview.js — ns: financing, modals (t=13, literals~4)
- `AdDetails` — src/screens/Dashboard/p2p/AdDetails/index.js — ns: new (t=13, literals~0)
- `WithdrawBank` — src/screens/Dashboard/wallet/withdraw/withdrawIndo/withdrawBank.js — ns: new, indoWithdrawPayList, indoDepositPayList (t=13, literals~0)
- `SendInternal` — src/screens/Dashboard/wallet/sendInternal/index.js — ns: new, tabBar (t=13, literals~1)
- `CardWithdrawPreview` — src/screens/Dashboard/CardWithdraw/screens/CardWithdrawPreview.js — ns: fassetCard (t=13, literals~0)
- `AboutOwn` — src/screens/Dashboard/rewards/about/index.js — ns: rewardsV4 (t=13, literals~0)
- `ManualDetails` — src/screens/Authentication/ManualKYC/ManualDetails/index.js — ns: manualKYC (t=13, literals~0)
- `BuyReceipt` — src/screens/Dashboard/trade/buy/buyReceipt/index.js — ns: new (t=12, literals~0)
- `PreviewBuy` — src/screens/Dashboard/trade/buy/buyCrypto/PreviewBuy.js — ns: new, vouchers, poa, voucher (t=12, literals~5)
- `WithdrawCBB` — src/screens/Dashboard/wallet/withdraw/withdrawCBB/index.js — ns: new (t=12, literals~2)
- `PayMethodInfo` — src/screens/Dashboard/account/payMethodInfo/index.js — ns: new, signUp, poa (t=12, literals~2)
- `IndoBankDetails` — src/screens/Dashboard/account/indoBankDetails/index.js — ns: new, signUp, poa (t=12, literals~0)
- `CardTxnDetails` — src/screens/Dashboard/CardWithdraw/screens/CardTxnDetails.js — ns: fassetCard (t=12, literals~1)
- `BuyStock` — src/screens/Dashboard/stocks/buy/buyStock/index.js — ns: new, stockMarketClosed, depositCKO, Continue (t=12, literals~0)
- `RemittanceTransactionDetail` — src/screens/Dashboard/remittance/remittanceTransactionDetail/index.js — ns: remittance, voucher, new, cryptoWithDraw (t=12, literals~0)
- `EWalletQR` — src/screens/Dashboard/wallet/deposit/depositIndo/eWalletQR.js — ns: new, portfolio (t=11, literals~0)
- `EnterPINCard` — src/screens/Dashboard/FassetPay/screens/EnterPINCard.js — ns: pin, new, voucher (t=11, literals~0)
- `PreviewStockSell` — src/screens/Dashboard/stocks/sell/preview/index.js — ns: new, stock, poa, voucher (t=11, literals~4)
- `EnterPINEarlyIBAN` — src/screens/Dashboard/iban/screens/EnterPINEarlyIBAN.js — ns: pin, voucher (t=11, literals~0)
- `BuySellOrders` — src/screens/Dashboard/p2p/BuySellOrders/index.js — ns: new (t=10, literals~0)
- `SanctionSecurity` — src/screens/Authentication/SanctionSecurity/index.js — ns: new_ob (t=10, literals~0)
- `Receipt` — src/screens/Dashboard/wallet/receipt/index.js — ns: new (t=10, literals~0)
- `NewNumber` — src/screens/Dashboard/account/newNumber/index.js — ns: new, signUp (t=10, literals~0)
- `SetupGauth` — src/screens/Dashboard/account/setupGauth/index.js — ns: new, signUp, nonSocial (t=10, literals~0)
- `DeleteAccount` — src/screens/Dashboard/account/deleteAccount/index.js — ns: new (t=10, literals~0)
- `Buy` — src/screens/Dashboard/trade/buy-sell/Screens/Buy/index.js — ns: disclaimer, new, portfolio, voucher (t=9, literals~1)
- `Sell` — src/screens/Dashboard/trade/buy-sell/Screens/Sell/index.js — ns: disclaimer, new, portfolio, voucher (t=9, literals~2)
- `ConfirmSell` — src/screens/Dashboard/trade/sell/confirmSell/index.js — ns: new (t=9, literals~0)
- `AddPayment` — src/screens/Dashboard/p2p/AddPayment/index.js — ns: new, signUp (t=9, literals~0)
- `DepositPreview` — src/screens/Dashboard/wallet/deposit/depositPreview/index.js — ns: depositCKO, voucher (t=9, literals~2)
- `P2pKeyboardScreen` — src/screens/Dashboard/wallet/p2pVersion2/P2pKeyboardScreen.js — ns: p2pTabs, new (t=9, literals~21)
- `PreviewCardOrderScreen` — src/screens/Dashboard/FassetPay/screens/PreviewCardOrderScreen.js — ns: fassetCard (t=9, literals~3)
- `EditWatchList` — src/screens/Dashboard/portfolio/watchlist/editWatchList.js — ns: portfolio, new (t=8, literals~3)
- `PreviewConvert` — src/screens/Dashboard/trade/convert/convertCrypto/PreviewConvert.js — ns: new, poa, voucher, staking (t=8, literals~4)
- `CryptoSend` — src/screens/Dashboard/cryptoSend/index.js — ns: new, cryptoWithDraw (t=8, literals~11)
- `CryptoHistory` — src/screens/Dashboard/wallet/cryptoHistory/index.js — ns: new, tabBar (t=8, literals~0)
- `SwapTransactionDetail` — src/screens/Dashboard/transactionDetail/swapTransactionDetail.js — ns: new (t=8, literals~0)
- `PaymentMethods` — src/screens/Dashboard/account/paymentMethods/index.js — ns: new, account (t=8, literals~0)
- `StakingPreview` — src/screens/Dashboard/trade/staking/stakingPreview/index.js — ns: staking (t=8, literals~2)
- `CardWithdraw` — src/screens/Dashboard/CardWithdraw/index.js — ns: fassetCard (t=8, literals~0)
- `FassetPayTopUpPreview` — src/screens/Dashboard/FassetPay/screens/TopUpPreviewScreen.js — ns: fassetPay (t=8, literals~0)
- `VerifyPIN` — src/screens/Dashboard/account/PIN/VerifyPIN/index.js — ns: pin (t=8, literals~0)
- `WelcomeEarn` — src/screens/Dashboard/earn/welcomeEarnSplash/index.js — ns: earn, onBoarding, portfolio (t=8, literals~0)
- `EditWithdrawalMethod` — src/screens/Dashboard/p2p/p2pNew/Withdrawal/EditWithdrawalMethod/index.js — ns: p2pV2, new (t=7, literals~3)
- `ConfirmConvert` — src/screens/Dashboard/trade/convert/confirmConvert/index.js — ns: new (t=7, literals~0)
- `TwoFaOtpVerify` — src/screens/Dashboard/account/2faOtpVerify/index.js — ns: new, verifyDevice, signUp (t=7, literals~0)
- `TransactionDetail` — src/screens/Dashboard/trade/buy/buyCrypto/TransactionDetail.js — ns: new (t=7, literals~1)
- `BuySellTransactionDetail` — src/screens/Dashboard/transactionDetail/buySellTransactionDetail.js — ns: new (t=7, literals~3)
- `ChangePhone` — src/screens/Dashboard/account/changePhone/index.js — ns: new, account, myFasset (t=7, literals~0)
- `AntiPhishing` — src/screens/Dashboard/account/antiPhishing/index.js — ns: new, myFasset (t=7, literals~0)
- `DonationDetails` — src/screens/Dashboard/donation/screens/ProjectDetailScreen.js — ns: donations (t=7, literals~0)
- `ReferralCustomerProgress` — src/screens/Dashboard/referral/screens/ReferralProgress/index.js — ns: refer (t=7, literals~0)
- `SellCrypto` — src/screens/Dashboard/trade/sell/sellCrypto/index.js — ns: new (t=6, literals~0)
- `Converted` — src/screens/Dashboard/trade_v4/swape/Converted.js — ns: swap_v4 (t=6, literals~4)
- `Deposit` — src/screens/Dashboard/wallet/deposit/index.js — ns: depositV4, lean, new (t=6, literals~0)
- `DepositCash` — src/screens/Dashboard/wallet/deposit/depositCash/index.js — ns: depositCKO, new (t=6, literals~0)
- `DepositTransaction` — src/screens/Dashboard/wallet/deposit/depositTransaction/index.js — ns: voucher (t=6, literals~1)
- `Send` — src/screens/Dashboard/wallet/send/index.js — ns: new (t=6, literals~0)
- `Stake` — src/screens/Dashboard/trade/staking/onBoarding/index.js — ns: onBoardingScreen (t=6, literals~2)
- `DonationOrgDetails` — src/screens/Dashboard/donation/screens/OrgDetailScreen.js — ns: donations (t=6, literals~0)
- `DonationAmount` — src/screens/Dashboard/donation/screens/DonateScreen.js — ns: donations (t=6, literals~0)
- `LeanPayment` — src/screens/Dashboard/wallet/deposit/depositLean/LeanPayment.js — ns: lean (t=6, literals~0)
- `MailingAddress` — src/screens/Dashboard/FassetPay/screens/CardKYC/MailingAddress.js — ns: fassetCard (t=6, literals~25)
- `ConfirmNewPIN` — src/screens/Dashboard/account/PIN/ConfirmNewPIN/index.js — ns: pin (t=6, literals~0)
- `EarnHistory` — src/screens/Dashboard/earn/history/index.js — ns: earn (t=6, literals~0)
- `TotalSubscription` — src/screens/Dashboard/earn/totalSubscription/index.js — ns: earn (t=6, literals~1)
- `AddWithdrawalMethod` — src/screens/Dashboard/p2p/p2pNew/Withdrawal/AddWithdrawalMethod/index.js — ns: p2pV2, new (t=5, literals~2)
- `ReferralProgram` — src/screens/Dashboard/account/referral/index.js — ns: referralProgram, account (t=5, literals~2)
- `NewPhone` — src/screens/Dashboard/account/newPhone/index.js — ns: new, myFasset, signUp (t=5, literals~2)
- `RepayLoan` — src/screens/Dashboard/financing/financingCrypto/RepayPage.js — ns: disclaimer, new, socialApp, voucher (t=5, literals~1)
- `SelectCryptoSend` — src/screens/Dashboard/trade/send/selectCryptoSend/index.js — ns: new (t=5, literals~0)
- `SelectCryptoReceive` — src/screens/Dashboard/trade/receive/selectCryptoReceive/index.js — ns: new (t=5, literals~0)
- `TranHistory` — src/screens/Dashboard/wallet/tranHistory/index.js — ns: new (t=5, literals~0)
- `FassetPayTxnDetails` — src/screens/Dashboard/FassetPay/screens/TransactionDetailScreen.js — ns: buyV4, fassetCard (t=5, literals~3)
- `StockTransactionDetail` — src/screens/Dashboard/stocks/transactionDetail/index.js — ns: new, Status, Total (t=5, literals~2)
- `GlobalOnBoarding` — src/screens/Dashboard/stocks/GlobalOnBoarding/index.js — ns: globalOnboard (t=5, literals~0)
- `Rewards` — src/screens/Dashboard/rewards/index.js — ns: rewardsV4, updated (t=5, literals~1)
- `WithdrawalMethodP2P` — src/screens/Dashboard/p2p/p2pNew/Withdrawal/WithdrawalMethod/index.js — ns: p2pV2 (t=4, literals~0)
- `P2pSellerOrderCreatedScreen` — src/screens/Dashboard/wallet/p2pVersion2/P2pSellerOrderCreatedScreen.js — ns: new, p2pTabs (t=4, literals~12)
- `Reviews` — src/screens/Dashboard/p2p/Reviews/index.js — ns: new (t=4, literals~0)
- `TranHistoryAll` — src/screens/Dashboard/wallet/tranHistoryAll/index.js — ns: new, checkOut (t=4, literals~0)
- `StakingWallet` — src/screens/Dashboard/wallet/stakingWallet/index.js — ns: staking (t=4, literals~0)
- `BundlePortfolio` — src/screens/Dashboard/crypto-bundle/screens/BundlePortfolioScreen.js — ns: new, bundle (t=4, literals~0)
- `DonationTypes` — src/screens/Dashboard/donation/screens/DonationTypeScreen.js — ns: donations (t=4, literals~0)
- `DepositSummary` — src/screens/Dashboard/wallet/deposit/depositP2p/DepositSummary.js — ns: p2pV2 (t=4, literals~5)
- `NewPIN` — src/screens/Dashboard/account/PIN/NewPIN/index.js — ns: pin (t=4, literals~0)
- `RemittanceHistory` — src/screens/Dashboard/remittance/allRemittanceHistory/index.js — ns: new, checkOut (t=4, literals~0)
- `RemittanceInitiated` — src/screens/Dashboard/remittance/remittanceInitiated/index.js — ns: remittance, Share (t=4, literals~2)
- `SwapAsset` — src/screens/Dashboard/trade_v4/swape/SwapAsset.js — ns: swap_v4 (t=3, literals~3)
- `MarketAd` — src/screens/Miscs/MarketAd.js — ns: new (t=3, literals~0)
- `BanxaSuccess` — src/screens/Miscs/banxa/success.js — ns: new (t=3, literals~0)
- `BanxaFailed` — src/screens/Miscs/banxa/failed.js — ns: new (t=3, literals~0)
- `BanxaCancelled` — src/screens/Miscs/banxa/cancelled.js — ns: new (t=3, literals~0)
- `WithdrawMain` — src/screens/Dashboard/wallet/withdraw_v4/WithdrawIndex.js — ns: p2pTabs (t=3, literals~5)
- `CryptoWarn` — src/screens/Dashboard/wallet/cryptoWarn/index.js — ns: new (t=3, literals~0)
- `BankInfo` — src/screens/Dashboard/wallet/bankInfo/index.js — ns: new, portfolio (t=3, literals~9)
- `Activity` — src/screens/Dashboard/account/activity/index.js — ns: new (t=3, literals~0)
- `Donations` — src/screens/Dashboard/donation/screens/DonationsScreen.js — ns: donations (t=3, literals~0)
- `DepositP2p` — src/screens/Dashboard/wallet/deposit/depositP2p/index.js — ns: new, new_ob (t=3, literals~4)
- `ProfileVerification` — src/screens/Dashboard/FassetPay/screens/CardKYC/ProfileVerification.js — ns: card (t=3, literals~1)
- `PINList` — src/screens/Dashboard/account/PIN/PINList/index.js — ns: pin (t=3, literals~0)
- `GlobalTermsConditions` — src/screens/Dashboard/stocks/GlobalTermsConditions/index.js — ns: globalOnboard (t=3, literals~0)
- `EarnProfitHistory` — src/screens/Dashboard/earn/profitHistory/index.js — ns: earn (t=3, literals~0)
- `SendMoneyConfirmation` — src/screens/Dashboard/iban/screens/SendMoneyConfirmation.js — ns: buyV4 (t=3, literals~3)
- `P2PRealeasingFunds` — src/screens/Dashboard/wallet/p2pVersion2/P2PRealeasingFunds.js — ns: new (t=2, literals~15)
- `IBANHomeScreen` — src/screens/Dashboard/iban/screens/IBANHomeScreen.js — ns: new (t=2, literals~3)
- `SelectCryptoSell` — src/screens/Dashboard/trade/sell/selectCryptoSell/index.js — ns: new (t=2, literals~0)
- `StockBuyTransactionDetail_v4` — src/screens/Dashboard/allTransactionHistory/StockBuyTransactionDetail_v4/index.js — ns: sellFlow (t=2, literals~3)
- `SelectCryptoConvert` — src/screens/Dashboard/trade/convert/selectCryptoConvert/index.js — ns: new (t=2, literals~0)
- `SelectSendInternalCrypto` — src/screens/Dashboard/trade/sendInternal/sendInternalCrypto/index.js — ns: new (t=2, literals~0)
- `WithdrawV4` — src/screens/Dashboard/wallet/withdraw_v4/index.js — ns: new (t=2, literals~0)
- `StakingAmount` — src/screens/Dashboard/trade/staking/stakingAmount/index.js — ns: staking, new (t=2, literals~0)
- `DepositAccounts` — src/screens/Dashboard/wallet/deposit/depositLean/DepositAccounts.js — ns: new (t=2, literals~2)
- `MainCardSelectionScreen` — src/screens/Dashboard/FassetPay/screens/MainCardSelectionScreen.js — ns: cardKyc, fassetCard (t=2, literals~14)
- `IDVerificationInfo` — src/screens/Dashboard/FassetPay/screens/CardKYC/IDVerificationInfo.js — ns: card (t=2, literals~2)
- `FassetPayTransactions` — src/screens/Dashboard/FassetPay/screens/TransactionScreen.js — ns: fassetPay (t=2, literals~0)
- `IBANAllTransactionScreenV2` — src/screens/Dashboard/iban/screens/IBANAllTransactionScreenV2.js — ns: new (t=2, literals~2)
- `P2pOrderCreatedScreen` — src/screens/Dashboard/wallet/p2pVersion2/P2pOrderCreatedScreen.js — ns: sellFlow (t=1, literals~15)
- `ConfirmBuy` — src/screens/Dashboard/trade/buy/confirmBuy/index.js — ns: checkOut (t=1, literals~1)
- `FinancingCrypto` — src/screens/Dashboard/financing/financingCrypto/index.js — ns: Financing (t=1, literals~0)
- `LoanHistoryDetails` — src/screens/Dashboard/financing/financingCrypto/LoanHistoryDetails.js — ns: new (t=1, literals~7)
- `AddBankWireTransfer` — src/screens/Dashboard/wallet/deposit/wireTransfer_v4/AddBankWireTransfer.js — ns: new (t=1, literals~12)
- `Chat` — src/screens/Dashboard/p2p/Chat/index.js — ns: new (t=1, literals~0)
- `DepositInstructions` — src/screens/Dashboard/wallet/deposit/depositIndo/depositInstructions.js — ns: new (t=1, literals~8)
- `WithdrawBankSelect` — src/screens/Dashboard/wallet/withdraw/WithdrawBankScreen.js — ns: new (t=1, literals~3)
- `AddNewBank` — src/screens/Dashboard/wallet/deposit/addBank/AddNewBank.js — ns: modals (t=1, literals~2)
- `Notifications` — src/screens/Dashboard/account/notifications/index.js — ns: new (t=1, literals~3)
- `StakingHistory` — src/screens/Dashboard/trade/staking/stakingHistory/index.js — ns: new (t=1, literals~1)
- `EarnWalletDetail` — src/screens/Dashboard/trade/staking/EarnWallet/EarnWalletDetail.js — ns: modals (t=1, literals~4)
- `CryptoBundleAmount` — src/screens/Dashboard/crypto-bundle/screens/InsertBundleAmount.js — ns: bundles (t=1, literals~1)
- `DonationsHistory` — src/screens/Dashboard/donation/screens/DonationsHistory.js — ns: donations (t=1, literals~0)
- `DepositWire` — src/screens/Dashboard/wallet/deposit/depositWire/DepositWire.js — ns: new (t=1, literals~3)
- `PreviewOrder` — src/screens/Dashboard/wallet/deposit/depositP2p/PreviewOrder.js — ns: new (t=1, literals~12)
- `OrderCreated` — src/screens/Dashboard/wallet/deposit/depositP2p/OrderCreated.js — ns: sellFlow (t=1, literals~21)
- `DepositInitPreview` — src/screens/Dashboard/wallet/deposit/depositWire/DepositInitPreview.js — ns: depositCKO (t=1, literals~7)
- `ChatScreen` — src/screens/Dashboard/wallet/p2pVersion2/ChatScreen.js — ns: new (t=1, literals~3)
- `DepositCard` — src/screens/Dashboard/wallet/deposit/DepositCardV4/DepositCard.js — ns: depositeScreen (t=1, literals~3)
- `IDVerification` — src/screens/Dashboard/FassetPay/screens/CardKYC/IDVerification.js — ns: card (t=1, literals~4)
- `AddPassportNumber` — src/screens/Dashboard/FassetPay/screens/CardKYC/AddPassportNumber.js — ns: card (t=1, literals~7)
- `ComingSoonScreen` — src/screens/Dashboard/iban/screens/ComingSoonScreen.js — ns: new (t=1, literals~0)
- `P2pWithdrawalMethod` — src/screens/Dashboard/wallet/p2pVersion2/P2pWithdrawalMethod.js — no t() calls (t=0, literals~11)
- `P2pRemoveBank` — src/screens/Dashboard/wallet/p2pVersion2/P2pRemoveBank.js — no t() calls (t=0, literals~9)
- `P2pHistory` — src/screens/Dashboard/wallet/p2pVersion2/P2pHistory.js — no t() calls (t=0, literals~3)
- `P2pTransactionDetail` — src/screens/Dashboard/wallet/p2pVersion2/P2pTransactionDetail.js — no t() calls (t=0, literals~3)
- `DepositAvailability` — src/screens/Dashboard/today/screens/DepositAvailabilityScreen.js — no t() calls (t=0, literals~0)
- `DepositExchangeVerification` — src/screens/Dashboard/today/screens/DepositExchangeVerificationScreen.js — no t() calls (t=0, literals~15)
- `SelectCrypto` — src/screens/Dashboard/trade/buy/selectCryptoBuy/index.js — no t() calls (t=0, literals~1)
- `ConfirmBuyBanxa` — src/screens/Dashboard/trade/buy/confirmBuy/confirmBuyBanxa.js — no t() calls (t=0, literals~0)
- `ReceiveTransactionDetail_v4` — src/screens/Dashboard/allTransactionHistory/ReceiveTransactionDetail_v4/index.js — no t() calls (t=0, literals~4)
- `FinancingIntroScreen` — src/screens/Dashboard/financing/financingCrypto/IntroScreen.js — no t() calls (t=0, literals~1)
- `FinancingSuccess` — src/screens/Dashboard/financing/financingCrypto/FinancingSuccess.js — no t() calls (t=0, literals~2)
- `SendKeyboard` — src/screens/Dashboard/cryptoSend/SendKeyboard/index.js — no t() calls (t=0, literals~1)
- `SendOtp` — src/screens/Dashboard/cryptoSend/SendOtp/index.js — no t() calls (t=0, literals~1)
- `SendFunds` — src/screens/Dashboard/sendFunds/SendFunds.js — no t() calls (t=0, literals~8)
- `SearchContacts` — src/screens/Dashboard/sendFunds/SearchContacts.js — no t() calls (t=0, literals~2)
- `FindMyFriends` — src/screens/Dashboard/sendFunds/FindMyFriends.js — no t() calls (t=0, literals~2)
- `PaymentLink` — src/screens/Dashboard/sendFunds/PaymentLink.js — no t() calls (t=0, literals~4)
- `SendFundsKeyboardScreen` — src/screens/Dashboard/sendFunds/SendFundsKeyboardScreen.js — no t() calls (t=0, literals~2)
- `PreviewSendFunds` — src/screens/Dashboard/sendFunds/PreviewSendFunds.js — no t() calls (t=0, literals~3)
- `SelectSendFundsAsset` — src/screens/Dashboard/sendFunds/SelectSendFundsAsset.js — no t() calls (t=0, literals~3)
- `SendScreen` — src/screens/Dashboard/trade/send/index.js — no t() calls (t=0, literals~9)
- `SendTravelRule` — src/screens/Dashboard/cryptoSend/SendTravelRule/index.js — no t() calls (t=0, literals~8)
- `SendAdditional` — src/screens/Dashboard/cryptoSend/SendAdditional/index.js — no t() calls (t=0, literals~13)
- `WireTransferKeyboard` — src/screens/Dashboard/wallet/deposit/wireTransfer_v4/WireTransferKeyboard.js — no t() calls (t=0, literals~4)
- `PreviewTransfer` — src/screens/Dashboard/wallet/deposit/wireTransfer_v4/PreviewTransfer.js — no t() calls (t=0, literals~2)
- `P2PNew` — src/screens/Dashboard/p2p/p2pNew/index.js — no t() calls (t=0, literals~4)
- `P2pOnBoarding` — src/screens/Dashboard/p2p/p2pNew/P2pOnBoarding.js — no t() calls (t=0, literals~2)
- `WithdrawP2p` — src/screens/Dashboard/wallet/withdraw/withdrawP2p/index.js — no t() calls (t=0, literals~5)
- `Details` — src/screens/Dashboard/p2p/p2pNew/Details.js — no t() calls (t=0, literals~2)
- `WithdrawPreviewNew` — src/screens/Dashboard/wallet/withdraw/withdrawP2p/WithdrawPreview.js — no t() calls (t=0, literals~4)
- `NetworkScreen` — src/screens/Dashboard/wallet/recieve/NetworkScreen.js — no t() calls (t=0, literals~1)
- `BankTransfer` — src/screens/Dashboard/wallet/deposit/BankTransfer/index.js — no t() calls (t=0, literals~12)
- `WithdrawPreview` — src/screens/Dashboard/wallet/withdraw/WithdrawPreview.js — no t() calls (t=0, literals~7)
- `DepositReceipt` — src/screens/Dashboard/wallet/deposit/depositWire/DepositReceipt.js — no t() calls (t=0, literals~6)
- `WithdrawOtp` — src/screens/Dashboard/wallet/withdraw_v4/WithdrawOtp.js — no t() calls (t=0, literals~2)
- `WithdrawSuccess` — src/screens/Dashboard/wallet/withdraw_v4/WithdrawSucess.js — no t() calls (t=0, literals~2)
- `WithdrawTransactionDetailScreen` — src/screens/Dashboard/wallet/withdraw_v4/WithdrawTransactionDetailScreen.js — no t() calls (t=0, literals~5)
- `EarlyAccessDetailScreen` — src/screens/Dashboard/transactionDetail/EarlyAccessDetailScreen.js — no t() calls (t=0, literals~6)
- `referralProgress` — src/screens/Dashboard/account/referralProgress/index.js — no t() calls (t=0, literals~0)
- `StakingEntry` — src/screens/Dashboard/trade/staking/StakingEntry/index.js — no t() calls (t=0, literals~6)
- `EarnWallet` — src/screens/Dashboard/trade/staking/EarnWallet/index.js — no t() calls (t=0, literals~4)
- `StakeCompleteFlash` — src/screens/Dashboard/trade/staking/stake-completed/flash-screen.js — no t() calls (t=0, literals~1)
- `BundleTransactionHistory` — src/screens/Dashboard/crypto-bundle/screens/BundleTransactionHistoryScreen.js — no t() calls (t=0, literals~0)
- `BundleTransactionHistoryDetails` — src/screens/Dashboard/crypto-bundle/screens/BundleTransactionHistoryDetailScreen.js — no t() calls (t=0, literals~5)
- `BundlePreview` — src/screens/Dashboard/crypto-bundle/screens/BundlePreviewScreen.js — no t() calls (t=0, literals~7)
- `BundleIntro` — src/screens/Dashboard/crypto-bundle/screens/BundleIntroScreen.js — no t() calls (t=0, literals~1)
- `LinkBank` — src/screens/Dashboard/wallet/deposit/depositLean/LinkBank.js — no t() calls (t=0, literals~3)
- `LeanKeyboardScreen` — src/screens/Dashboard/wallet/deposit/depositLeanV4/LeanKeyboardScreen.js — no t() calls (t=0, literals~4)
- `LeanPreviewTransfer` — src/screens/Dashboard/wallet/deposit/depositLeanV4/LeanPreviewTransfer.js — no t() calls (t=0, literals~0)
- `P2pMarketplaceBuyScreen` — src/screens/Dashboard/wallet/p2pVersion2/P2pMarketplaceBuyScreen.js — no t() calls (t=0, literals~9)
- `P2pBankListScreen` — src/screens/Dashboard/wallet/p2pVersion2/P2pBankListScreen.js — no t() calls (t=0, literals~8)
- `PreviewDepositCard` — src/screens/Dashboard/wallet/deposit/DepositCardV4/PreviewDepositCard.js — no t() calls (t=0, literals~0)
- `ActivatePhysicalCardScreen` — src/screens/Dashboard/FassetPay/screens/ActivatePhysicalCardScreen.js — no t() calls (t=0, literals~8)
- `PhysicalCards` — src/screens/Dashboard/PhysicalCards/index.js — no t() calls (t=0, literals~1)
- `AllTransactionCardScreen` — src/screens/Dashboard/FassetPay/screens/AllTransactionCardScreen.js — no t() calls (t=0, literals~3)
- `AddToWalletScreen` — src/screens/Dashboard/FassetPay/screens/AddToWalletScreen.js — no t() calls (t=0, literals~1)
- `TakeSelfie` — src/screens/Dashboard/FassetPay/screens/CardKYC/TakeSelfie.js — no t() calls (t=0, literals~6)
- `TakeSelfieInfo` — src/screens/Dashboard/FassetPay/screens/CardKYC/TakeSelfieInfo.js — no t() calls (t=0, literals~3)
- `UploadSignatureInfo` — src/screens/Dashboard/FassetPay/screens/CardKYC/UploadSignatureInfo.js — no t() calls (t=0, literals~4)
- `DeliveryAddress` — src/screens/Dashboard/FassetPay/screens/CardKYC/DeliveryAddress.js — no t() calls (t=0, literals~33)
- `CardActivationScreen` — src/screens/Dashboard/FassetPay/screens/CardKYC/CardActivationScreen.js — no t() calls (t=0, literals~12)
- `FassetPayActivateNewCard` — src/screens/Dashboard/FassetPay/screens/ActivateNewCardScreen.js — no t() calls (t=0, literals~18)
- `PurchaseCardSuccessScreen` — src/screens/Dashboard/FassetPay/screens/PurchaseCardSuccessScreen.js — no t() calls (t=0, literals~4)
- `SelectCardScreen` — src/screens/Dashboard/FassetPay/screens/SelectCardScreen.js — no t() calls (t=0, literals~2)
- `FassetPayFAQs` — src/screens/Dashboard/FassetPay/screens/FAQScreen.js — no t() calls (t=0, literals~3)
- `FAQDetail` — src/screens/Dashboard/FassetPay/screens/FAQDetail.js — no t() calls (t=0, literals~5)
- `UnsubscribeEarnProduct` — src/screens/Dashboard/earn/unsubscribeEarnProduct/index.js — no t() calls (t=0, literals~0)
- `RewardsCampaignDetail` — src/screens/Dashboard/rewards/campaign/detail/index.js — no t() calls (t=0, literals~1)
- `ReferFriend` — src/screens/Dashboard/referral/index.js — no t() calls (t=0, literals~0) — feature flag referralV2: legacy component src/screens/Dashboard/account_v4/referral/index.js
- `MyReferrals` — src/screens/Dashboard/referral/screens/MyReferrals.js — no t() calls (t=0, literals~0) — feature flag referralV2: legacy component src/screens/Dashboard/account_v4/referral/history.js
- `SendTransactionDetail` — src/screens/Dashboard/cryptoSend/SendTransactionDetail/index.js — no t() calls (t=0, literals~6)
- `CheckingAccount` — src/screens/Dashboard/checking-account/index.js — no t() calls (t=0, literals~6)
- `ActivateGlobalUSDAccountScreen` — src/screens/Dashboard/iban/screens/ActivateGlobalUSDAccountScreen.js — no t() calls (t=0, literals~21)
- `FinancialProfileScreen` — src/screens/Dashboard/iban/screens/FinancialProfileScreen.js — no t() calls (t=0, literals~5)
- `ConfirmIBANOrderScreen` — src/screens/Dashboard/iban/screens/ConfirmIBANOrderScreen.js — no t() calls (t=0, literals~19)
- `EarlyAccessOrderCompleted` — src/screens/Dashboard/iban/screens/EarlyAccessOrderCompleted.js — no t() calls (t=0, literals~4)
- `AddPayeeScreen` — src/screens/Dashboard/iban/screens/AddPayeeScreen.js — no t() calls (t=0, literals~1)
- `AccountActivationRequirementScreen` — src/screens/Dashboard/iban/screens/AccountActivationRequirementScreen.js — no t() calls (t=0, literals~12)
- `IBANTransactionDetail` — src/screens/Dashboard/transactionDetail/IBANTransactionDetail.js — no t() calls (t=0, literals~11)
- `AddFassetTagScreen` — src/screens/Dashboard/iban/screens/AddFassetTagScreen.js — no t() calls (t=0, literals~4)
- `IBANTransactionDetailV2` — src/screens/Dashboard/transactionDetail/IBANTransactionDetailV2.js — no t() calls (t=0, literals~11)
- `IBANTransactionDetailV2Internal` — src/screens/Dashboard/transactionDetail/IBANTransactionDetailV2Internal.js — no t() calls (t=0, literals~8)
- `IBANStatementScreenV2` — src/screens/Dashboard/iban/screens/IBANStatementScreenV2.js — no t() calls (t=0, literals~7)
- `IBANSettings` — src/screens/Dashboard/iban/screens/IBANSettings.js — no t() calls (t=0, literals~1)
- `IBANLimitsScreen` — src/screens/Dashboard/iban/screens/IBANLimitsScreen.js — no t() calls (t=0, literals~3)
- `AddPaymentMethodSelection` — src/screens/Dashboard/iban/screens/AddPaymentMethodSelection.js — no t() calls (t=0, literals~1)
- `ReceiveAccountDetails` — src/screens/Dashboard/iban/screens/ReceiveAccountDetails.js — no t() calls (t=0, literals~1)
- `MoveMoneyIBANConfirmation` — src/screens/Dashboard/iban/screens/MoveMoneyIBANConfirmation.js — no t() calls (t=0, literals~9)
- `MoveMoneyIBAN` — src/screens/Dashboard/iban/screens/MoveMoneyIBAN.js — no t() calls (t=0, literals~9)
- `MoveMoneyCompleted` — src/screens/Dashboard/iban/screens/MoveMoneyCompleted.js — no t() calls (t=0, literals~3)
- `SendMoneyBankTransfer` — src/screens/Dashboard/iban/screens/SendMoneyBankTransfer.js — no t() calls (t=0, literals~2)
- `SendMoneyEnterAmount` — src/screens/Dashboard/iban/screens/SendMoneyEnterAmount.js — no t() calls (t=0, literals~3)
- `SendMoneyCompleted` — src/screens/Dashboard/iban/screens/SendMoneyCompleted.js — no t() calls (t=0, literals~3)
- `IBANAllTransactionScreen` — src/screens/Dashboard/iban/screens/IBANAllTransactionScreen.js — no t() calls (t=0, literals~3)
- `UpdateTransactionLimitScreen` — src/screens/Dashboard/iban/screens/UpdateTransactionLimitScreen.js — no t() calls (t=0, literals~1)
- `FeeDetailsScreen` — src/screens/Dashboard/iban/screens/FeeDetailsScreen.js — no t() calls (t=0, literals~1)
- `IBANStatementScreen` — src/screens/Dashboard/iban/screens/IBANStatementScreen.js — no t() calls (t=0, literals~7)
- `IBANAccountClosureScreen` — src/screens/Dashboard/iban/screens/IBANAccountClosureScreen.js — no t() calls (t=0, literals~19)
- `IBANOTPScreen` — src/screens/Dashboard/iban/screens/IBANOTPScreen.js — no t() calls (t=0, literals~5)

### Dashboard stack (authenticated root) + Auth stack (34)

- `CountrySelect` — src/screens/Authentication/countrySelect/index.js — ns: signUp, signup_new, new, new_ob (t=29, literals~1)
- `AccSetup1` — src/screens/Authentication/accSetup1/index.js — ns: new (t=29, literals~0)
- `Verify` — src/screens/Authentication/verifyAcc/index.js — ns: new, signUp, verifyDevice, signup_new (t=21, literals~0)
- `CryptoInfo` — src/screens/Dashboard/wallet/cryptoInfo/index.js — ns: new, tabBar, staking (t=21, literals~3)
- `BuyCrypto` — src/screens/Dashboard/trade/buy/buyCrypto/index.js — ns: new (t=17, literals~0)
- `AddIndobank` — src/screens/Dashboard/account/addIndobank/index.js — ns: new (t=17, literals~0)
- `prepareNationality` — src/screens/Authentication/prepareNationality/index.js — ns: new (t=15, literals~0)
- `ReferralCode` — src/screens/Authentication/referralCode/index.js — ns: refer, new, modals (t=15, literals~1)
- `BankStatement` — src/screens/Authentication/bankStatement/index.js — ns: new (t=13, literals~0)
- `OtpAuthentication` — src/screens/Authentication/otpAuthentication/index.js — ns: new, verifyDevice, signUp (t=11, literals~4)
- `PreviewSell` — src/screens/Dashboard/trade/sell/sellCrypto/PreviewSell.js — ns: new, poa, voucher, staking (t=10, literals~3)
- `QnA` — src/screens/Authentication/QnA/index.js — ns: new (t=10, literals~2)
- `FiatInfo` — src/screens/Dashboard/wallet/fiatInfo/index.js — ns: new, tabBar (t=10, literals~2)
- `PreviewBuyv3` — src/screens/Dashboard/trade/buy/buyCrypto/PreviewBuyv3.js — ns: new, voucher, poa, staking (t=9, literals~4)
- `SetupComplete` — src/screens/Authentication/completeSetup/index.js — ns: new, poa (t=9, literals~0)
- `AllSet` — src/screens/Authentication/allSet/index.js — ns: new, portfolio (t=7, literals~0)
- `AccSetup` — src/screens/Authentication/accSetup/index.js — ns: kyc, new (t=7, literals~6)
- `AccSetup2` — src/screens/Authentication/accSetup2/index.js — ns: new (t=7, literals~0)
- `POASuccess` — src/screens/Authentication/POA/POASuccess/index.js — ns: poa (t=6, literals~0)
- `kycFinish` — src/screens/Authentication/kycFinish/index.js — ns: new (t=5, literals~0)
- `SelectBankList` — src/screens/Dashboard/account/selectBankList/index.js — ns: new, indoWithdrawPayList (t=5, literals~2)
- `AddBankAccount` — src/screens/Dashboard/account/addBankAccontDetail/index.js — ns: new, indoWithdrawPayList, youDontHaveBankAccount (t=5, literals~0)
- `StockInfo` — src/screens/Dashboard/wallet/stockInfo/index.js — ns: new, tabBar (t=5, literals~1)
- `AboutFasset` — src/screens/Dashboard/account/options/AboutFasset.js — ns: account (t=5, literals~0)
- `EthereumWallet` — src/screens/Dashboard/trade/staking/EthereumWallet/index.js — ns: new (t=3, literals~5)
- `documentList` — src/screens/Authentication/documentList/index.js — ns: new (t=2, literals~0)
- `CryptoBundleDetails` — src/screens/Dashboard/crypto-bundle/screens/CryptoBundleDetailScreen.js — ns: bundle (t=2, literals~4)
- `livingCountry` — src/screens/Authentication/livingCountry/index.js — ns: new (t=1, literals~1)
- `MarketSearch` — src/screens/Dashboard/marketSearch/index.js — ns: Search (t=1, literals~1)
- `CoinDetail` — src/screens/Dashboard/market/detail/index.js — no t() calls (t=0, literals~1)
- `StockDetail` — src/screens/Dashboard/stocks/detail/index.js — no t() calls (t=0, literals~1)
- `StockStatistics` — src/screens/Dashboard/stocks/screens/stocksStatistics.js — no t() calls (t=0, literals~7)
- `WelcomeRewards` — src/screens/Dashboard/rewards/welcome/index.js — no t() calls (t=0, literals~0)
- `CampaignIntro` — src/screens/Dashboard/rewards/campaign-intro/index.js — no t() calls (t=0, literals~0)

### Auth stack (13)

- `DeviceVerify` — src/screens/Authentication/deviceVerify/index.js — ns: new, verifyDevice, signUp, myFasset (t=23, literals~0)
- `Password` — src/screens/Authentication/NonSocialSignup/Password/index.js — ns: signup_new, ff_onboarding_3_copy_refresh, signUp, verifyDevice (t=20, literals~0)
- `NewPassConfirm` — src/screens/Authentication/newPassConfirm/index.js — ns: signUp, new, verifyDevice, nonSocial (t=17, literals~0)
- `ForgetPassOtp` — src/screens/Authentication/forgetPassOtp/index.js — ns: new, myFasset, verifyDevice, signUp (t=15, literals~0)
- `EmailVerify` — src/screens/Authentication/NonSocialSignup/EmailVerify/index.js — ns: new, signup_new, verifyDevice, myFasset (t=14, literals~0)
- `Signup` — src/screens/Authentication/signup/index.js — ns: signup_new, signUp, new, restrict_ob (t=13, literals~0)
- `AccSetup3` — src/screens/Authentication/accSetup3/index.js — ns: new (t=13, literals~0)
- `EmailSignup` — src/screens/Authentication/NonSocialSignup/EmailSignup/index.js — ns: signUp, new, verifyDevice, onBoarding (t=8, literals~0)
- `ForgetPass` — src/screens/Authentication/forgetPass/index.js — ns: signUp, logIn, verifyDevice, new (t=6, literals~0)
- `OTPMethodSelection` — src/screens/Authentication/selectOtpMethod/index.js — ns: signUp, new (t=4, literals~0)
- `verifySocialAcc` — src/screens/Authentication/verifySocialAcc/index.js — ns: new, signUp (t=3, literals~0)
- `NewLoginForm` — src/screens/Authentication/NewLoginForm/index.js — no t() calls (t=0, literals~14)
- `VerificationPaused` — src/screens/Authentication/verificationPaused/index.js — no t() calls (t=0, literals~2)

### Root stack (4)

- `EnterPIN` — src/screens/Authentication/PIN/Enter/index.js — ns: pin, new, ff_onboarding_3_copy_refresh, voucher (t=22, literals~0)
- `Splash` — src/index.js — ns: onBoarding, sellFlow (t=3, literals~0)
- `Deeplink` — src/screens/Deeplink/DeeplinkLayout.js — ns: new (t=1, literals~0)
- `DeeplinkCoinDetail` — src/screens/Dashboard/market/detail/index.js — no t() calls (t=0, literals~1)

### Pay tab stack (4)

- `FassetPay` — src/screens/Dashboard/FassetPay/screens/HomeScreen.js — ns: fassetCard, new (t=56, literals~24)
- `CardSelectionDetailScreen` — src/screens/Dashboard/FassetPay/screens/CardSelectionDetailScreen.js — ns: fassetCard, cardKyc (t=25, literals~13)
- `CardOnboardingScreen` — src/screens/Dashboard/FassetPay/screens/CardKYC/CardOnboardingScreen.js — ns: fassetCard (t=15, literals~0)
- `PayResolver` — src/screens/Dashboard/FassetPay/screens/PayRouteResolver.js — no t() calls (t=0, literals~0)

### Auth stack + Root stack (3)

- `consentScreen` — src/screens/Authentication/consentScreen/index.js — ns: signUp, new (t=51, literals~0)
- `ConfirmPIN` — src/screens/Authentication/PIN/Confirm/index.js — ns: pin, new, ff_onboarding_3_copy_refresh (t=15, literals~0)
- `CreatePIN` — src/screens/Authentication/PIN/Create/index.js — ns: pin (t=5, literals~0)

### Home tab stack (PortfolioStack) (2)

- `VerifyIdentity` — src/screens/Dashboard/portfolio/noKyc/index.js — ns: new, portfolio (t=7, literals~0)
- `P2P` — src/screens/Dashboard/p2p/index.js — ns: new (t=2, literals~0)

### Main bottom tabs, guest mode (2)

- `AccountV4` — src/screens/Authentication/signup/index.js — ns: signup_new, signUp, new, restrict_ob (t=13, literals~0)
- `Transactions` — src/screens/Authentication/signup/index.js — ns: signup_new, signUp, new, restrict_ob (t=13, literals~0)

### Dashboard stack (authenticated root) + Auth stack + Root stack (1)

- `Browser` — src/screens/Miscs/Browser.js — no t() calls (t=0, literals~0)

## Captured screens (32)

- `MarketAssetListing` — src/screens/Dashboard/market_v4/screens/MarketAssetListing.js — market_02_commodities, market_03_funds, market_04_bundles
- `AddPayMethod` — src/screens/Authentication/addPayMethod/index.js — kyc_ae_04_link_bank
- `TradePreview` — src/screens/Dashboard/trade_v4/buy/TradePreview.js — buy_06_confirmation, sell_06_confirmation
- `Buy_v4` — src/screens/Dashboard/trade_v4/buy/Buy_v4.js — buy_01_trade_sheet
- `SelectAsset` — src/screens/Dashboard/trade_v4/buy/SelectAsset.js — buy_02_asset_list
- `SellPaymentMethods` — src/screens/Dashboard/trade_v4/sell/SellPaymentMethods.js — sell_03_payment_method
- `SelectSellAsset` — src/screens/Dashboard/trade_v4/sell/SelectSellAsset.js — sell_02_asset_list
- `BuyKeyboardScreen` — src/screens/Dashboard/trade_v4/buy/BuyKeyboardScreen.js — buy_04_amount_empty, buy_05_amount_filled
- `SellKeyboardScreen` — src/screens/Dashboard/trade_v4/sell/SellKeyboardScreen.js — sell_04_amount_empty, sell_05_amount_filled
- `SelectPaymentMethod` — src/screens/Dashboard/trade_v4/buy/SelectPaymentMethod.js — buy_03_payment_method
- `Sell_v4` — src/screens/Dashboard/trade_v4/sell/Sell_v4.js — sell_01_trade_sheet
- `TradeSuccess` — src/screens/Dashboard/trade_v4/buy/TradeSuccess.js — buy_07_success, sell_07_success
- `BuyTransactionDetail_v4` — src/screens/Dashboard/trade_v4/buy/BuyTransactionDetail_v4.js — history_03_detail
- `sendFundsTransactionDetailScreen` — src/screens/Dashboard/sendFunds/SendFundsTransactionDetailScreen.js — history_03_detail
- `UploadPOA` — src/screens/Authentication/uploadPOA/index.js — kyc_ae_02_proof_of_address
- `Preferences` — src/screens/Dashboard/account/preferences/index.js — settings_02_language, settings_03_currency
- `BundleList` — src/screens/Dashboard/crypto-bundle/screens/BundleListScreen.js — market_04_bundles
- `KycJourney` — src/screens/Authentication/kycJourney/index.js — kyc_ae_01_financial_profile, kyc_ae_03_money_questions
- `LeanOnBoarding` — src/screens/Dashboard/wallet/deposit/depositLean/LeanOnBoarding.js — kyc_ae_04_link_bank
- `POAList` — src/screens/Authentication/POA/POAList/index.js — kyc_ae_02_proof_of_address
- `POADetails` — src/screens/Authentication/POA/POADetails/index.js — kyc_ae_02_proof_of_address
- `Account_` — src/screens/Dashboard/account/index.js — settings_01_hub, logout_01, logout_02
- `AllTransactionHistory` — src/screens/Dashboard/allTransactionHistory/index.js — history_02_list
- `PaymentHistory` — src/screens/Dashboard/payments/PaymentHistory.js — history_02_list
- `AccountV4` — src/screens/Dashboard/account_v4/index.js — settings_01_hub
- `Login` — src/screens/Authentication/login/index.js — login_02_login_options
- `LoginForm` — src/screens/Authentication/login/loginForm.js — login_03_email_form
- `LBWelcome` — src/screens/Authentication/LBWelcome/index.js — kyc_lb_01, kyc_lb_02, kyc_lb_03
- `onBoarding` — src/screens/welcome/index.js — login_01_logged_out_home, logout_03
- `PortfolioHome` — src/screens/Dashboard/today/screens/TodayScreen.js — login_06_dashboard, dashboard_01_home
- `Markets` — src/screens/Dashboard/market_v4/screens/MarketScreen.js — market_01_root
- `Transactions` — src/screens/Dashboard/payments/PaymentScreen.js — history_01_recent
