# ⚡ RentWave — Electronics Rental Platform

A front-end rental storefront. No build step, no dependencies.

## Run it
Unzip and open `index.html` in any modern browser.

## Files
| File | Purpose |
|------|---------|
| index.html | Page layout: header, hero, filters, product grid, modal, cart drawer |
| styles.css | Theme (light/dark), responsive layout, components |
| data.js | Product catalog (edit to add gear) |
| cart.js | Pricing engine, cart state (localStorage), payment methods + validation |
| app.js | UI rendering, events, payment step and checkout flow |

## Creative touches
- **Tiered discounts**: 7+ days 10%, 14+ days 20%, 30 days 25%
- **Damage protection** add-on (15% of daily rate)
- **Rent-to-own meter**: 50% of your rent is credited toward buying
- **Eco counter**: estimated CO₂ avoided by renting instead of buying new
- **Payment methods**: card (live formatting, Luhn check, expiry check), digital wallet, bank transfer, pay on delivery ($5 fee)
- **Live quote** with refundable deposit, stock-aware availability, dark mode

## Ideas to extend
Connect `cart.js` to a Java/REST backend and a cloud database for real bookings, payments, and user accounts.
