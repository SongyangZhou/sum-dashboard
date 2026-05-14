from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Shipment, Order

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


@router.get("/")
def get_shipments(
    page: int = 1,
    page_size: int = 20,
    status: str = None,
    carrier: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Shipment)
    if status:
        query = query.filter(Shipment.status == status)
    if carrier:
        query = query.filter(Shipment.carrier == carrier)

    total = query.count()
    items = query.order_by(Shipment.shipped_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for s in items:
        delay_days = None
        if s.actual_delivery and s.estimated_delivery:
            delay_days = (s.actual_delivery - s.estimated_delivery).days

        result.append({
            "id": s.id,
            "tracking_number": s.tracking_number,
            "order_number": s.order.order_number if s.order else "",
            "carrier": s.carrier,
            "origin": s.origin,
            "destination": s.destination,
            "shipped_date": s.shipped_date.isoformat() if s.shipped_date else None,
            "estimated_delivery": s.estimated_delivery.isoformat() if s.estimated_delivery else None,
            "actual_delivery": s.actual_delivery.isoformat() if s.actual_delivery else None,
            "status": s.status,
            "freight_cost": s.freight_cost,
            "delay_days": delay_days,
        })

    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/summary")
def get_logistics_summary(db: Session = Depends(get_db)):
    total = db.query(Shipment).count()
    in_transit = db.query(Shipment).filter(Shipment.status == "In Transit").count()
    delivered = db.query(Shipment).filter(Shipment.status == "Delivered").count()
    total_freight = db.query(func.sum(Shipment.freight_cost)).scalar() or 0

    delivered_shipments = db.query(Shipment).filter(
        Shipment.status == "Delivered",
        Shipment.actual_delivery != None,
    ).all()
    on_time = [s for s in delivered_shipments if s.actual_delivery <= s.estimated_delivery]
    otd = round(len(on_time) / len(delivered_shipments) * 100, 1) if delivered_shipments else 0

    avg_freight = round(total_freight / total, 2) if total else 0

    return {
        "total_shipments": total,
        "in_transit": in_transit,
        "delivered": delivered,
        "on_time_delivery_rate": otd,
        "total_freight_cost": round(total_freight, 2),
        "avg_freight_cost": avg_freight,
    }


@router.get("/carrier-performance")
def get_carrier_performance(db: Session = Depends(get_db)):
    carriers = db.query(Shipment.carrier).distinct().all()
    result = []
    for (carrier,) in carriers:
        shipments = db.query(Shipment).filter(Shipment.carrier == carrier, Shipment.status == "Delivered", Shipment.actual_delivery != None).all()
        if not shipments:
            continue
        on_time = [s for s in shipments if s.actual_delivery <= s.estimated_delivery]
        avg_cost = sum(s.freight_cost for s in shipments) / len(shipments)
        result.append({
            "carrier": carrier,
            "on_time_rate": round(len(on_time) / len(shipments) * 100, 1),
            "shipment_count": len(shipments),
            "avg_freight_cost": round(avg_cost, 2),
        })
    result.sort(key=lambda x: x["on_time_rate"], reverse=True)
    return result
