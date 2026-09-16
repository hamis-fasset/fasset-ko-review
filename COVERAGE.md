# Fasset CashApp Korean-review coverage

Generated from CashApp `development` at `1d8e0c2e378216573367dce234217e92a3b9da44` on 2026-09-16. Route registrations come from `src/route/index.js`, `src/route/stackNavigators.js`, and `src/route/TabNavigators.ios.js`. Exact copy keys come from each screen component and its first-level feature-local imports.

## What is covered

- 452 route registrations collapse to 402 distinct route+component rows.
- 7 rows are navigator containers; 395 are reviewable non-container route/component records (393 route names and 391 distinct component files).
- 39 captured visual states are traceable to 22 source-screen components.
- 373 non-container route/component records have no visual capture.
- 286 screens contain translation calls; 284 have at least one statically resolvable key and 109 have no translation call in the scanned files.
- The static scan resolves 1,708 distinct copy keys, finds 60 dynamic translation calls, and finds 34 static keys that are missing from the supplied copy pack.
- The review tool keeps 1,535 editable canonical strings in **Unmapped copy** because a static scan cannot safely tie them to one registered route. These may be unused, dynamically loaded, or used outside route components. Of these, 1,199 are from the second source drop and 336 are from batches 1–10.

This is two kinds of coverage, shown separately in the tool:

1. **Visual coverage:** real English capture plus live Korean rendering for 39 states.
2. **Source coverage:** all 395 non-container route/component records, with exact static keys where resolvable. A source record without a capture is text-only and is never presented as visually verified.

## Corrected visual-state mapping

The mapping was verified against OCR-visible keys and the current source. Navigator containers are excluded.

| capture id | source screen |
|---|---|
| login_01_logged_out_home | Signup |
| login_02_login_options | Login |
| login_03_email_form | LoginForm |
| login_06_dashboard | PortfolioHome (TodayScreen) |
| dashboard_01_home | PortfolioHome (TodayScreen) |
| market_01_root | Markets |
| market_02_commodities | MarketAssetListing |
| market_03_funds | MarketAssetListing |
| market_04_bundles | BundleList |
| buy_01_trade_sheet | Buy_v4 |
| buy_02_asset_list | SelectAsset |
| buy_03_payment_method | SelectPaymentMethod |
| buy_04_amount_empty | BuyKeyboardScreen |
| buy_05_amount_filled | BuyKeyboardScreen |
| buy_06_confirmation | TradePreview |
| buy_07_success | TradeSuccess |
| sell_01_trade_sheet | Sell_v4 |
| sell_02_asset_list | SelectSellAsset |
| sell_03_receive_method | SellPaymentMethods |
| sell_04_amount_empty | SellKeyboardScreen |
| sell_05_amount_filled | SellKeyboardScreen |
| sell_06_confirmation | TradePreview |
| sell_07_success | TradeSuccess |
| history_01_recent | PortfolioHome (TodayScreen) |
| history_02_list | AllTransactionHistory |
| history_03_detail | SellTransactionDetail_v4 |
| settings_01_hub | Account_ |
| settings_02_language | Preferences (language bottom sheet) |
| settings_03_currency | Preferences (currency bottom sheet) |
| logout_01_account_menu | Account_ |
| logout_02_confirm_dialog | Account_ |
| logout_03_logged_out | Signup |
| kyc_ae_01_financial_profile | KycJourney |
| kyc_ae_02_proof_of_address | KycJourney |
| kyc_ae_03_money_questions | KycJourney |
| kyc_ae_04_link_bank | KycJourney |
| kyc_lb_01_financial_profile | KycJourney |
| kyc_lb_02_money_questions | KycJourney |
| kyc_lb_03_money_questions_filled | KycJourney |

The earlier inventory incorrectly counted 32 captured components. It included navigator/wrapper guesses and misidentified history and KYC states. The corrected total is 22 identifiable source components and 373 uncaptured components.

## Highest-copy screens without a capture

Sorted by distinct statically resolved canonical keys. These are the best next capture targets.

| screen | source file | keys | dynamic calls | hard-coded estimate |
|---|---|---:|---:|---:|
| OrderDetails | `src/screens/Dashboard/p2p/OrderDetails/index.js` | 100 | 0 | 4 |
| MyAdsForm | `src/screens/Dashboard/p2p/MyAdsForm/index.js` | 40 | 0 | 0 |
| DepositEwallet | `src/screens/Dashboard/wallet/deposit/depositIndo/depositEwallet.js` | 37 | 0 | 0 |
| FassetPay | `src/screens/Dashboard/FassetPay/screens/HomeScreen.js` | 35 | 0 | 24 |
| WithdrawCrypto | `src/screens/Dashboard/wallet/withdrawCrypto/index.js` | 35 | 2 | 3 |
| RainCardConfirmOrderScreen | `src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardConfirmOrderScreen.js` | 33 | 0 | 1 |
| ContactsDetail | `src/screens/Dashboard/remittance/contactDetail/index.js` | 30 | 0 | 0 |
| CountrySelect | `src/screens/Authentication/countrySelect/index.js` | 28 | 0 | 1 |
| AddPaymentForm | `src/screens/Dashboard/p2p/AddPaymentForm/index.js` | 27 | 0 | 1 |
| PortfolioV4 | `src/screens/Dashboard/portfolio_v4/index.js` | 27 | 2 | 4 |
| RainCardFinancialDetails | `src/screens/Dashboard/FassetPay/screens/CardKYC/RainCardFinancialDetails.js` | 27 | 0 | 0 |
| AccSetup1 | `src/screens/Authentication/accSetup1/index.js` | 26 | 0 | 0 |
| LBWelcome | `src/screens/Authentication/LBWelcome/index.js` | 26 | 0 | 0 |
| IDScan | `src/screens/Authentication/ManualKYC/IDScan/index.js` | 25 | 0 | 0 |
| DepositCBB | `src/screens/Dashboard/wallet/deposit/depositCBB/index.js` | 24 | 0 | 1 |

## Keys referenced in code but absent from the copy pack

These 34 keys need an engineering/source-pack decision before Korean can be complete:

`earn.makeTheAction`, `indoWithdrawPayList.availableWithdraw`, `indoWithdrawPayList.selectBank`, `myFasset.fatherName`, `new.addNewDebit`, `new.addStep`, `new.allAnswers`, `new.app`, `new.attemptAllAnswers`, `new.cameraPermission`, `new.currentAssets`, `new.customerSupport2`, `new.default`, `new.depositDesc`, `new.devicesLogIn`, `new.diffBank`, `new.gotoPay`, `new.indoText`, `new.payeeBank`, `new.receivedAmount`, `new.refCode`, `new.selectDesti`, `new.transactionDesc`, `new.transferComplete`, `new.withdrawAmount`, `new.withdrawDes`, `new.withdrawDest`, `new.withdrawNow`, `new_ob.fatherName`, `poa.pdfFormat`, `remittance.noRecipientDesc`, `sellFlow.tooManyAttempts`, `staking.completiondate`, and `staking.stakeEnd`.

## Runtime i18n state

- Registered locales are `en`, `id`, `in` (Indonesian alias), and `tr`; `ko` is not registered yet.
- Detection uses `APP_LANG`, then device language, then a geo-IP fallback, and persists the result.
- Mobile-infra still needs to register `ko`, load the reviewed bundle, and capture the Korean journeys for final truncation sign-off.

## Machine-readable sources

- `data/screen-inventory.json`: 402 corrected route+component rows.
- `data/code-screens.json`: source commit, exact per-screen keys, capture mapping, dynamic-call counts, missing keys, and hard-coded estimates.
- `data/screens.json`: the 39 visual states shown in the current-app reviewer.
- `data/ocr.json`: on-image boxes and exact copy-key matches.
