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
- `SQUARE_ENVIRONMENT` — `sandbox` until you are ready to take real money
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally, then your live URL

In Square Dashboard, enable Cash App Pay for payment links. Hosted Square checkout also accepts cards; that is a Square limitation, not something this site can turn off.

Without those keys, Pay with Cash App shows a configuration error instead of redirecting.

## Confirmation email (sandbox)

Square does not send the book email. After a paid order, this site sends a confirmation with [Resend](https://resend.com).

1. Create a free Resend account and an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. Put `RESEND_API_KEY` in `.env.local`. Set `EMAIL_FROM=Ghetto Link Books <orders@ghettolink22.com>` after `ghettolink22.com` is verified in Resend. Replies go to `EMAIL_REPLY_TO` (`ghettolink22@gmail.com`).
3. Restart `npm run dev`.
4. At checkout, use **the same email as your Resend account**. The `resend.dev` test sender can only deliver to that address until you verify your own domain.
5. Pay in Square sandbox, then land on `/success`. If Square marks the order paid, the email goes out.

Optional: in the Developer Console, subscribe a **Sandbox** webhook to `payment.updated` pointing at `https://your-public-url/api/webhooks/square`, then set `SQUARE_WEBHOOK_SIGNATURE_KEY`. Localhost is not reachable unless you use a tunnel such as ngrok. The success page still sends the email without a webhook.

## Swap in real books

Edit [`data/books.ts`](data/books.ts) and replace the SVG files in [`public/covers/`](public/covers/). Keep PDFs off the public site; email files after you see the paid order in Square.
