from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import InventoryRecord, Product

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/")
def get_inventory(
    page: int = 1,
    page_size: int = 20,
    category: str = None,
    region: str = None,
    alert: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(InventoryRecord).join(Product)
    if category:
        query = query.filter(Product.category == category)
    if region:
        query = query.filter(InventoryRecord.region == region)

    records = query.all()

    enriched = []
    for r in records:
        status = "ok"
        if r.quantity == 0:
            status = "out_of_stock"
        elif r.quantity < r.product.reorder_point:
            status = "low"
        elif r.quantity > r.product.reorder_point * 4:
            status = "overstock"

        if alert == "low" and status not in ("low", "out_of_stock"):
            continue
        if alert == "overstock" and status != "overstock":
            continue

        enriched.append({
            "id": r.id,
            "sku": r.product.sku,
            "product_name": r.product.name,
            "category": r.product.category,
            "warehouse": r.warehouse,
            "region": r.region,
            "quantity": r.quantity,
            "reorder_point": r.product.reorder_point,
            "status": status,
            "last_updated": r.last_updated.isoformat() if r.last_updated else None,
        })

    total = len(enriched)
    start = (page - 1) * page_size
    paginated = enriched[start: start + page_size]

    return {"total": total, "page": page, "page_size": page_size, "items": paginated}


@router.get("/summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    records = db.query(InventoryRecord).join(Product).all()

    total_skus = db.query(func.count(Product.id.distinct())).scalar()
    total_units = sum(r.quantity for r in records)
    low_stock = sum(1 for r in records if 0 < r.quantity < r.product.reorder_point)
    out_of_stock = sum(1 for r in records if r.quantity == 0)
    overstock = sum(1 for r in records if r.quantity > r.product.reorder_point * 4)

    return {
        "total_skus": total_skus,
        "total_units": total_units,
        "low_stock_alerts": low_stock,
        "out_of_stock": out_of_stock,
        "overstock_alerts": overstock,
    }


@router.get("/by-region")
def get_inventory_by_region(db: Session = Depends(get_db)):
    rows = (
        db.query(InventoryRecord.region, func.sum(InventoryRecord.quantity))
        .group_by(InventoryRecord.region)
        .all()
    )
    return [{"region": r[0], "quantity": r[1]} for r in rows]


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Product.category).distinct().all()
    return [c[0] for c in cats]
