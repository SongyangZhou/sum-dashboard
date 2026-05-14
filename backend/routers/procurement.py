from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PurchaseOrder, Supplier, Product

router = APIRouter(prefix="/api/procurement", tags=["procurement"])


@router.get("/")
def get_purchase_orders(
    page: int = 1,
    page_size: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status)

    total = query.count()
    items = query.order_by(PurchaseOrder.po_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for po in items:
        cycle_days = (po.po_date - po.requisition_date).days if po.po_date and po.requisition_date else None
        result.append({
            "id": po.id,
            "po_number": po.po_number,
            "supplier_name": po.supplier.name if po.supplier else "",
            "product_name": po.product.name if po.product else "",
            "product_sku": po.product.sku if po.product else "",
            "category": po.product.category if po.product else "",
            "quantity": po.quantity,
            "unit_cost": po.unit_cost,
            "total_amount": po.total_amount,
            "requisition_date": po.requisition_date.isoformat() if po.requisition_date else None,
            "po_date": po.po_date.isoformat() if po.po_date else None,
            "invoice_date": po.invoice_date.isoformat() if po.invoice_date else None,
            "payment_date": po.payment_date.isoformat() if po.payment_date else None,
            "status": po.status,
            "payment_terms": po.payment_terms,
            "cycle_days": cycle_days,
        })

    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/summary")
def get_procurement_summary(db: Session = Depends(get_db)):
    total_spend = db.query(func.sum(PurchaseOrder.total_amount)).scalar() or 0
    open_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status == "Open").count()
    paid_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status == "Paid").count()
    invoiced_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status == "Invoiced").count()

    pos_with_cycle = db.query(PurchaseOrder).filter(
        PurchaseOrder.po_date != None,
        PurchaseOrder.requisition_date != None,
    ).all()
    avg_cycle = 0
    if pos_with_cycle:
        cycles = [(po.po_date - po.requisition_date).days for po in pos_with_cycle]
        avg_cycle = round(sum(cycles) / len(cycles), 1)

    return {
        "total_spend": round(total_spend, 2),
        "open_pos": open_pos,
        "paid_pos": paid_pos,
        "invoiced_pos": invoiced_pos,
        "avg_cycle_days": avg_cycle,
    }


@router.get("/spend-by-category")
def get_spend_by_category(db: Session = Depends(get_db)):
    rows = (
        db.query(Product.category, func.sum(PurchaseOrder.total_amount))
        .join(PurchaseOrder, Product.id == PurchaseOrder.product_id)
        .group_by(Product.category)
        .all()
    )
    return [{"category": r[0], "spend": round(r[1] or 0, 2)} for r in rows]


@router.get("/monthly-spend")
def get_monthly_spend(db: Session = Depends(get_db)):
    import datetime
    now = datetime.datetime.now()
    result = []
    for i in range(11, -1, -1):
        month_start = (now - datetime.timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (now - datetime.timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0) if i > 0 else now
        spend = db.query(func.sum(PurchaseOrder.total_amount)).filter(
            PurchaseOrder.po_date >= month_start,
            PurchaseOrder.po_date < month_end,
        ).scalar() or 0
        result.append({"month": month_start.strftime("%b %Y"), "spend": round(spend, 2)})
    return result
