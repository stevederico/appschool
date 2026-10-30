# Todo

## Done

- [x] Webhook: `customer.subscription.*` events re-fetch the subscription from Stripe before applying it. A late or retried `customer.subscription.created` (status `incomplete`) arriving after `checkout.session.completed` no longer demotes a paying user. Regression test: `payment_stale_subscription_created_after_checkout_keeps_user_subscribed`.
- [x] Webhook: the Stripe subscription id is stored in `subscription_id`, and a patch for a different subscription that is not `active`/`trialing` is ignored, so an old customer's `customer.subscription.deleted` no longer re-locks a resubscriber. Regression test: `payment_old_subscription_deleted_after_resubscribe_keeps_user_subscribed`.
- [x] Webhook: a database error while applying a subscription answers 500 and the event is not marked processed, so Stripe retries it. Regression test: `payment_db_error_returns_500_and_is_not_recorded`.
