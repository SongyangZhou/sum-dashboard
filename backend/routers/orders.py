from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from database import get_db
from models import Order, Product, Supplier
import datetime

router = APIRouter(prefix="/api/orders", tags=["orders"])

SORTABLE_COLUMNS = {
    "order_number": Order.order_number,
    "customer": Order.customer,
    "quantity": Order.quantity,
    "total_value": Order.quantity * Order.unit_price,
    "order_date": Order.order_date,
    "expected_delivery": Order.expected_delivery,
    "actual_delivery": Order.actual_delivery,
    "status": Order.status,
}


@router.get("/")
def get_orders(
    page: int = 1,
    page_size: int = 20,
    status: str = None,
    supplier_id: int = None,
    sort_by: str = "order_date",
    sort_dir: str = "desc",
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if supplier_id:
        query = query.filter(Order.supplier_id == supplier_id)

    total = query.count()

    col = SORTABLE_COLUMNS.get(sort_by, Order.order_date)
    order_expr = desc(col) if sort_dir == "desc" else asc(col)
    items = query.order_by(order_expr).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for o in items:
        delay_days = None
        if o.actual_delivery and o.expected_delivery:
            delay_days = (o.actual_delivery - o.expected_delivery).days

        result.append({
            "id": o.id,
            "order_number": o.order_number,
            "customer": o.customer,
            "product_name": o.product.name if o.product else "",
            "product_sku": o.product.sku if o.product else "",
            "supplier_name": o.supplier.name if o.supplier else "",
            "quantity": o.quantity,
            "unit_price": o.unit_price,
            "total_value": round(o.quantity * o.unit_price, 2),
            "order_date": o.order_date.isoformat() if o.order_date else None,
            "expected_delivery": o.expected_delivery.isoformat() if o.expected_delivery else None,
            "actual_delivery": o.actual_delivery.isoformat() if o.actual_delivery else None,
            "status": o.status,
            "shipped_in_full": o.shipped_in_full,
            "on_hold": o.on_hold,
            "delay_days": delay_days,
        })

    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/summary")
def get_order_summary(db: Session = Depends(get_db)):
    total = db.query(Order).count()
    by_status = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    on_hold = db.query(Order).filter(Order.on_hold == True).count()

    delivered = db.query(Order).filter(Order.status == "Delivered", Order.actual_delivery != None).all()
    on_time = [o for o in delivered if o.actual_delivery <= o.expected_delivery]
    otd = round(len(on_time) / len(delivered) * 100, 1) if delivered else 0

    total_value = db.query(func.sum(Order.quantity * Order.unit_price)).scalar() or 0

    return {
        "total_orders": total,
        "on_time_delivery_rate": otd,
        "on_hold_orders": on_hold,
        "total_value": round(total_value, 2),
        "by_status": {r[0]: r[1] for r in by_status},
    }
