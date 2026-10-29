# Todo

## Done

- [x] Webhook: `customer.subscription.*` events re-fetch the subscription from Stripe before applying it. A late or retried `customer.subscription.created` (status `incomplete`) arriving after `checkout.session.completed` no longer demotes a paying user. Regression test: `payment_stale_subscription_created_after_checkout_keeps_user_subscribed`.
