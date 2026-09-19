# Ghetto Link Books

Storefront for digital short stories. Books are $10 each, buy 2 get 1 free. Checkout goes to a Square-hosted page with Cash App Pay enabled.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Square checkout

Copy these into `.env.local` from the [Square Developer Dashboard](https://developer.squareup.com/apps):

- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT` — `sandbox` on your laptop; `production` on the live site
- `SITE_URL` — `http://localhost:3000` locally, then your live `https://` URL (server-only)

In Square Dashboard, enable Cash App Pay for payment links. Hosted Square checkout also accepts cards; that is a Square limitation, not something this site can turn off.

Without those keys, Pay with Cash App shows a configuration error instead of redirecting.

## Go live (real money)

The app is already wired for production. You only change Square credentials and env vars.

1. Open [developer.squareup.com/apps](https://developer.squareup.com/apps), open your app, and set the toggle at the top to **Production** (not Sandbox).
2. **Credentials** → copy the **Production** access token.
3. **Locations** → copy the **Production** location ID (different from sandbox).
4. In the real [Square Dashboard](https://squareup.com/dashboard) (not the Sandbox test dashboard), enable **Cash App Pay** on payment links.
5. In **Vercel → Settings → Environment Variables** (Production), set:
   - `SQUARE_ENVIRONMENT` = `production`
   - `SQUARE_ACCESS_TOKEN` = the production token
   - `SQUARE_LOCATION_ID` = the production location ID
   - `SITE_URL` = your live `https://` URL (Vercel domain or `https://ghettolink22.com`)
   - `RESEND_API_KEY` = the same Resend key that worked in sandbox
   - `EMAIL_FROM` = `Ghetto Link Books <orders@ghettolink22.com>`
   - `EMAIL_REPLY_TO` = `ghettolink22@gmail.com`
6. Redeploy. Do a real $10 test with your own card or Cash App, then refund it in Square if you want.

Keep local `.env.local` on `sandbox` so laptop tests stay fake money.

## Confirmation email

After a paid order, this site sends a confirmation with [Resend](https://resend.com).

1. Create a free Resend account and an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. Put `RESEND_API_KEY` in `.env.local` and on Vercel. Set `EMAIL_FROM=Ghetto Link Books <orders@ghettolink22.com>` after `ghettolink22.com` is verified in Resend. Replies go to `EMAIL_REPLY_TO` (`ghettolink22@gmail.com`).
3. Restart `npm run dev` after local env changes.

Optional: in the Developer Console (**Production** toggle), open **Webhooks**, add notification URL `https://YOUR-LIVE-SITE/api/webhooks/square`, and subscribe to `payment.updated` and `order.updated`. That sends the confirmation even if the buyer never returns to the thank-you page. Then set `SQUARE_WEBHOOK_SIGNATURE_KEY` on Vercel.

## Swap in real books

Edit [`data/books.ts`](data/books.ts) and replace cover files in [`public/covers/`](public/covers/). Keep PDFs off the public site.
