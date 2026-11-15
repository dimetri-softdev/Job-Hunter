interface SubscriptionStatusInput {
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  paymentFailedAt: Date | null;
}

export function getAdminSubscriptionStatus(
  subscription: SubscriptionStatusInput | null,
  now: Date,
): string | null {
  if (!subscription) return null;

  const nowTime = now.getTime();
  if (subscription.status === "TRIALING") {
    return subscription.trialEndsAt &&
      subscription.trialEndsAt.getTime() > nowTime
      ? "TRIALING"
      : "EXPIRED";
  }
  if (subscription.status === "ACTIVE" || subscription.status === "CANCELED") {
    return subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() > nowTime
      ? subscription.status
      : "EXPIRED";
  }
  if (subscription.status === "PAST_DUE") {
    const gracePeriodEndsAt = subscription.paymentFailedAt
      ? subscription.paymentFailedAt.getTime() + 7 * 24 * 60 * 60 * 1000
      : null;
    return gracePeriodEndsAt && gracePeriodEndsAt > nowTime
      ? "PAST_DUE"
      : "EXPIRED";
  }
  return subscription.status;
}
