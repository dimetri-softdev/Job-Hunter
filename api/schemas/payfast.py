from typing import Literal

from pydantic import BaseModel


class SubscriptionCheckoutRequest(BaseModel):
    plan: Literal["starter", "standard", "lite", "premium"]
    billingInterval: Literal["monthly", "annual"]
