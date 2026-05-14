from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Order, Supplier, Product, InventoryRecord, PurchaseOrder, Shipment
import datetime

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    thirty_days_ago = now - datetime.timedelta(days=30)
    ninety_days_ago = now - datetime.timedelta(days=90)
    one_eighty_days_ago = now - datetime.timedelta(days=180)

    # On-Time Delivery Rate (last 90 days of delivered orders)
    delivered = db.query(Order).filter(
        Order.status == "Delivered",
        Order.actual_delivery != None,
        Order.actual_delivery >= ninety_days_ago,
    ).all()
    on_time = [o for o in delivered if o.actual_delivery <= o.expected_delivery]
    otd_rate = round(len(on_time) / len(delivered) * 100, 1) if delivered else 0

    delivered_prev = db.query(Order).filter(
        Order.status == "Delivered",
        Order.actual_delivery != None,
        Order.actual_delivery >= one_eighty_days_ago,
        Order.actual_delivery < ninety_days_ago,
    ).all()
    on_time_prev = [o for o in delivered_prev if o.actual_delivery <= o.expected_delivery]
    otd_prev = round(len(on_time_prev) / len(delivered_prev) * 100, 1) if delivered_prev else 0

    # Perfect Order Rate
    perfect = [o for o in delivered if o.shipped_in_full and not o.on_hold and o.actual_delivery <= o.expected_delivery]
    perfect_rate = round(len(perfect) / len(delivered) * 100, 1) if delivered else 0

    # Inventory Turnover (annualised based on orders / avg inventory)
    total_ordered_units = db.query(func.sum(Order.quantity)).filter(
        Order.order_date >= now - datetime.timedelta(days=365)
    ).scalar() or 0
    total_inventory = db.query(func.sum(InventoryRecord.quantity)).scalar() or 1
    inventory_turnover = round((total_ordered_units / total_inventory) * 1, 1)

    # Fill Rate (shipped-in-full, all delivered last 90 days)
    all_recent = db.query(Order).filter(Order.actual_delivery >= ninety_days_ago, Order.status == "Delivered").all()
    filled = [o for o in all_recent if o.shipped_in_full]
    fill_rate = round(len(filled) / len(all_recent) * 100, 1) if all_recent else 0

    # PO Cycle Time (avg days from requisition to PO)
    recent_pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.po_date != None,
        PurchaseOrder.po_date >= thirty_days_ago,
    ).all()
    if recent_pos:
        cycle_times = [(po.po_date - po.requisition_date).days for po in recent_pos]
        po_cycle_time = round(sum(cycle_times) / len(cycle_times), 1)
    else:
        po_cycle_time = 0

    # Total active orders
    active_orders = db.query(Order).filter(Order.status.in_(["Processing", "In Transit", "On Hold"])).count()

    return {
        "on_time_delivery_rate": {"value": otd_rate, "target": 95, "prev": otd_prev, "unit": "%"},
        "perfect_order_rate": {"value": perfect_rate, "target": 98, "unit": "%"},
        "inventory_turnover": {"value": inventory_turnover, "target": 6, "unit": "x/yr"},
        "fill_rate": {"value": fill_rate, "target": 98, "unit": "%"},
        "po_cycle_time": {"value": po_cycle_time, "target": 3, "unit": "days", "lower_is_better": True},
        "active_orders": {"value": active_orders, "unit": "orders"},
    }


@router.get("/order-trend")
def get_order_trend(db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    result = []
    for i in range(11, -1, -1):
        month_start = (now - datetime.timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            month_end = now
        else:
            month_end = (now - datetime.timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        count = db.query(Order).filter(
            Order.order_date >= month_start,
            Order.order_date < month_end,
        ).count()
        delivered_count = db.query(Order).filter(
            Order.order_date >= month_start,
            Order.order_date < month_end,
            Order.status == "Delivered",
        ).count()
        result.append({
            "month": month_start.strftime("%b %Y"),
            "orders": count,
            "delivered": delivered_count,
        })
    return result


@router.get("/order-status")
def get_order_status(db: Session = Depends(get_db)):
    rows = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    return [{"status": r[0], "count": r[1]} for r in rows]


@router.get("/top-suppliers")
def get_top_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).filter(Supplier.active == True).all()
    result = []
    for s in suppliers:
        delivered = [o for o in s.orders if o.status == "Delivered" and o.actual_delivery]
        if not delivered:
            continue
        on_time = [o for o in delivered if o.actual_delivery <= o.expected_delivery]
        otd = round(len(on_time) / len(delivered) * 100, 1)
        result.append({"name": s.name, "on_time_delivery": otd, "order_count": len(delivered)})

    result.sort(key=lambda x: x["on_time_delivery"], reverse=True)
    return result[:8]


@router.get("/inventory-by-category")
def get_inventory_by_category(db: Session = Depends(get_db)):
    rows = (
        db.query(Product.category, func.sum(InventoryRecord.quantity))
        .join(InventoryRecord, Product.id == InventoryRecord.product_id)
        .group_by(Product.category)
        .all()
    )
    return [{"category": r[0], "quantity": r[1]} for r in rows]
