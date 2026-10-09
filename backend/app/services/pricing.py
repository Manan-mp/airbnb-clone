from dataclasses import dataclass

from app.config import get_settings


@dataclass(frozen=True)
class Quote:
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int


def compute_quote(nightly_price: int, cleaning_fee: int, nights: int) -> Quote:
    """subtotal = nightly x nights; service fee = rate x subtotal (rounded); all integer rupees."""
    subtotal = nightly_price * nights
    service_fee = round(subtotal * get_settings().service_fee_rate)
    return Quote(nights, nightly_price, subtotal, cleaning_fee, service_fee, subtotal + cleaning_fee + service_fee)
