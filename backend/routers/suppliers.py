from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Supplier, Order, PurchaseOrder

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("/")
def get_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    result = []
    for s in suppliers:
        delivered = [o for o in s.orders if o.status == "Delivered" and o.actual_delivery]
        on_time = [o for o in delivered if o.actual_delivery <= o.expected_delivery]
        rejected = [o for o in s.orders if o.status == "Cancelled"]
        full_shipments = [o for o in delivered if o.shipped_in_full]
        lead_times = [(o.actual_delivery - o.order_date).days for o in delivered]
        avg_lead = round(sum(lead_times) / len(lead_times), 1) if lead_times else 0

        otd = round(len(on_time) / len(delivered) * 100, 1) if delivered else 0
        rejection_rate = round(len(rejected) / len(s.orders) * 100, 1) if s.orders else 0
        full_rate = round(len(full_shipments) / len(delivered) * 100, 1) if delivered else 0

        total_spend = sum(po.total_amount for po in s.purchase_orders)

        result.append({
            "id": s.id,
            "name": s.name,
            "country": s.country,
            "category": s.category,
            "risk_level": s.risk_level,
            "active": s.active,
            "on_time_delivery": otd,
            "rejection_rate": rejection_rate,
            "shipped_in_full_rate": full_rate,
            "avg_lead_time_days": avg_lead,
            "total_orders": len(s.orders),
            "total_spend": round(total_spend, 2),
        })

    result.sort(key=lambda x: x["on_time_delivery"], reverse=True)
    return result


@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = db.query(Supplier.risk_level, func.count(Supplier.id)).group_by(Supplier.risk_level).all()
    return [{"risk_level": r[0], "count": r[1]} for r in rows]


@router.get("/spend-by-category")
def get_spend_by_category(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = (
        db.query(Supplier.category, func.sum(PurchaseOrder.total_amount))
        .join(PurchaseOrder, Supplier.id == PurchaseOrder.supplier_id)
        .group_by(Supplier.category)
        .all()
    )
    return [{"category": r[0], "spend": round(r[1] or 0, 2)} for r in rows]
