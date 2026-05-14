import random
import datetime
from database import engine, SessionLocal
from models import Base, Supplier, Product, InventoryRecord, Order, Shipment, PurchaseOrder

random.seed(42)

SUPPLIERS = [
    {"name": "TechParts Co", "country": "China", "category": "Electronics", "contact_email": "orders@techparts.cn", "risk_level": "low"},
    {"name": "GlobalChem Industries", "country": "Germany", "category": "Chemicals", "contact_email": "supply@globalchem.de", "risk_level": "low"},
    {"name": "AgriFresh Ltd", "country": "Brazil", "category": "Food", "contact_email": "export@agrifresh.br", "risk_level": "medium"},
    {"name": "MetalWorks Inc", "country": "USA", "category": "Industrial", "contact_email": "sales@metalworks.com", "risk_level": "low"},
    {"name": "TextileGroup India", "country": "India", "category": "Textiles", "contact_email": "orders@textilegroup.in", "risk_level": "medium"},
    {"name": "PharmaSource AG", "country": "Switzerland", "category": "Pharmaceuticals", "contact_email": "supply@pharmasource.ch", "risk_level": "low"},
    {"name": "AutoParts Direct", "country": "Japan", "category": "Automotive", "contact_email": "export@autoparts.jp", "risk_level": "low"},
    {"name": "ChipMakers Asia", "country": "Taiwan", "category": "Electronics", "contact_email": "sales@chipmakers.tw", "risk_level": "medium"},
    {"name": "PlasticCraft Co", "country": "South Korea", "category": "Plastics", "contact_email": "orders@plasticcraft.kr", "risk_level": "low"},
    {"name": "NorthStar Energy", "country": "Canada", "category": "Energy", "contact_email": "supply@northstar.ca", "risk_level": "low"},
    {"name": "FoodProcessors BV", "country": "Netherlands", "category": "Food", "contact_email": "export@foodproc.nl", "risk_level": "low"},
    {"name": "SteelMasters", "country": "Poland", "category": "Industrial", "contact_email": "sales@steelmasters.pl", "risk_level": "high"},
    {"name": "PackagingPlus SA", "country": "Mexico", "category": "Packaging", "contact_email": "orders@packplus.mx", "risk_level": "medium"},
    {"name": "OfficePro Inc", "country": "USA", "category": "Office", "contact_email": "supply@officepro.com", "risk_level": "low"},
    {"name": "QuickFreight SG", "country": "Singapore", "category": "Logistics", "contact_email": "ops@quickfreight.sg", "risk_level": "medium"},
]

PRODUCTS = [
    {"sku": "ELEC-001", "name": "Microchips 32-bit", "category": "Electronics", "unit_cost": 4.50, "reorder_point": 500, "lead_time_days": 21},
    {"sku": "ELEC-002", "name": "Circuit Boards PCB", "category": "Electronics", "unit_cost": 12.00, "reorder_point": 300, "lead_time_days": 14},
    {"sku": "ELEC-003", "name": "Proximity Sensors", "category": "Electronics", "unit_cost": 8.75, "reorder_point": 200, "lead_time_days": 10},
    {"sku": "ELEC-004", "name": "LCD Displays 7inch", "category": "Electronics", "unit_cost": 22.00, "reorder_point": 150, "lead_time_days": 18},
    {"sku": "ELEC-005", "name": "Li-ion Batteries", "category": "Electronics", "unit_cost": 6.20, "reorder_point": 400, "lead_time_days": 12},
    {"sku": "INDU-001", "name": "Steel Beams Grade A", "category": "Industrial", "unit_cost": 85.00, "reorder_point": 50, "lead_time_days": 30},
    {"sku": "INDU-002", "name": "Bolts & Fasteners Set", "category": "Industrial", "unit_cost": 3.40, "reorder_point": 1000, "lead_time_days": 7},
    {"sku": "INDU-003", "name": "Hydraulic Pumps", "category": "Industrial", "unit_cost": 320.00, "reorder_point": 20, "lead_time_days": 45},
    {"sku": "INDU-004", "name": "Ball Bearings 6200", "category": "Industrial", "unit_cost": 5.80, "reorder_point": 500, "lead_time_days": 14},
    {"sku": "INDU-005", "name": "Industrial Valves", "category": "Industrial", "unit_cost": 48.00, "reorder_point": 80, "lead_time_days": 21},
    {"sku": "FOOD-001", "name": "Coffee Beans Arabica", "category": "Food", "unit_cost": 9.50, "reorder_point": 200, "lead_time_days": 21},
    {"sku": "FOOD-002", "name": "Cocoa Powder Fine", "category": "Food", "unit_cost": 6.80, "reorder_point": 300, "lead_time_days": 21},
    {"sku": "FOOD-003", "name": "Wheat Flour Premium", "category": "Food", "unit_cost": 1.20, "reorder_point": 1000, "lead_time_days": 14},
    {"sku": "FOOD-004", "name": "Refined Sugar 50kg", "category": "Food", "unit_cost": 28.00, "reorder_point": 150, "lead_time_days": 14},
    {"sku": "FOOD-005", "name": "Vegetable Oil 20L", "category": "Food", "unit_cost": 35.00, "reorder_point": 100, "lead_time_days": 18},
    {"sku": "CHEM-001", "name": "Acetone Industrial", "category": "Chemicals", "unit_cost": 14.00, "reorder_point": 100, "lead_time_days": 14},
    {"sku": "CHEM-002", "name": "Ethanol 99% Pure", "category": "Chemicals", "unit_cost": 22.00, "reorder_point": 80, "lead_time_days": 14},
    {"sku": "CHEM-003", "name": "Polymer Resin Grade B", "category": "Chemicals", "unit_cost": 18.50, "reorder_point": 120, "lead_time_days": 21},
    {"sku": "CHEM-004", "name": "Industrial Adhesives", "category": "Chemicals", "unit_cost": 32.00, "reorder_point": 60, "lead_time_days": 10},
    {"sku": "PACK-001", "name": "Cardboard Boxes L", "category": "Packaging", "unit_cost": 2.10, "reorder_point": 2000, "lead_time_days": 7},
    {"sku": "PACK-002", "name": "Bubble Wrap Roll 50m", "category": "Packaging", "unit_cost": 15.00, "reorder_point": 300, "lead_time_days": 7},
    {"sku": "PACK-003", "name": "Euro Pallets", "category": "Packaging", "unit_cost": 12.50, "reorder_point": 200, "lead_time_days": 10},
    {"sku": "PACK-004", "name": "Shrink Film 500m", "category": "Packaging", "unit_cost": 45.00, "reorder_point": 100, "lead_time_days": 7},
    {"sku": "AUTO-001", "name": "Brake Pads OEM", "category": "Automotive", "unit_cost": 38.00, "reorder_point": 100, "lead_time_days": 21},
    {"sku": "AUTO-002", "name": "Alternators 12V", "category": "Automotive", "unit_cost": 95.00, "reorder_point": 50, "lead_time_days": 28},
]

WAREHOUSES = [
    {"name": "Chicago DC", "region": "North America"},
    {"name": "Dallas Hub", "region": "North America"},
    {"name": "New York Port", "region": "North America"},
    {"name": "Amsterdam FC", "region": "Europe"},
    {"name": "Frankfurt DC", "region": "Europe"},
    {"name": "Shanghai Port", "region": "Asia"},
    {"name": "Singapore Hub", "region": "Asia"},
]

CUSTOMERS = [
    "Apex Manufacturing", "Delta Industries", "Horizon Corp", "Summit Retail",
    "Pacific Trading Co", "Atlantic Distributors", "Nordic Supply Chain",
    "Alpine Logistics", "Meridian Enterprises", "Zenith Global",
    "Cardinal Systems", "Vector Technologies", "Quantum Solutions",
    "Sterling Commerce", "Titan Industries",
]

CARRIERS = ["FedEx", "DHL", "UPS", "Maersk", "MSC", "Evergreen", "COSCO"]


def random_date(start_days_ago: int, end_days_ago: int = 0) -> datetime.datetime:
    start = datetime.datetime.now() - datetime.timedelta(days=start_days_ago)
    end = datetime.datetime.now() - datetime.timedelta(days=end_days_ago)
    delta = end - start
    return start + datetime.timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Suppliers
    suppliers = []
    for s in SUPPLIERS:
        supplier = Supplier(**s)
        db.add(supplier)
        suppliers.append(supplier)
    db.commit()
    for s in suppliers:
        db.refresh(s)

    # Products
    products = []
    for p in PRODUCTS:
        product = Product(**p)
        db.add(product)
        products.append(product)
    db.commit()
    for p in products:
        db.refresh(p)

    # Inventory records
    for product in products:
        num_warehouses = random.randint(2, 5)
        chosen = random.sample(WAREHOUSES, num_warehouses)
        for wh in chosen:
            # Some products deliberately below reorder point to trigger alerts
            if random.random() < 0.15:
                qty = random.randint(0, product.reorder_point - 1)
            elif random.random() < 0.10:
                qty = random.randint(product.reorder_point * 3, product.reorder_point * 6)
            else:
                qty = random.randint(product.reorder_point, product.reorder_point * 3)
            inv = InventoryRecord(
                product_id=product.id,
                warehouse=wh["name"],
                region=wh["region"],
                quantity=qty,
                last_updated=random_date(5, 0),
            )
            db.add(inv)
    db.commit()

    # Orders (350 over 12 months)
    category_supplier_map = {
        "Electronics": [s for s in suppliers if s.category in ("Electronics",)],
        "Industrial": [s for s in suppliers if s.category == "Industrial"],
        "Food": [s for s in suppliers if s.category == "Food"],
        "Chemicals": [s for s in suppliers if s.category == "Chemicals"],
        "Packaging": [s for s in suppliers if s.category == "Packaging"],
        "Automotive": [s for s in suppliers if s.category == "Automotive"],
    }
    fallback_suppliers = suppliers[:5]

    orders = []
    for i in range(350):
        product = random.choice(products)
        cat_suppliers = category_supplier_map.get(product.category, fallback_suppliers)
        supplier = random.choice(cat_suppliers) if cat_suppliers else random.choice(suppliers)
        order_date = random_date(365, 0)
        lead = product.lead_time_days + random.randint(-2, 5)
        expected_delivery = order_date + datetime.timedelta(days=lead)
        days_since_order = (datetime.datetime.now() - order_date).days

        # Determine status based on age
        if days_since_order < 3:
            status = "Processing"
            actual_delivery = None
            on_hold = random.random() < 0.1
        elif days_since_order < product.lead_time_days:
            status = random.choice(["In Transit", "Processing"])
            actual_delivery = None
            on_hold = random.random() < 0.05
        else:
            roll = random.random()
            if roll < 0.88:
                status = "Delivered"
                # ~93% on-time (delay <= 0), ~7% late
                delay = random.randint(-5, 0) if random.random() < 0.93 else random.randint(1, 10)
                actual_delivery = expected_delivery + datetime.timedelta(days=delay)
            elif roll < 0.94:
                status = "In Transit"
                actual_delivery = None
            elif roll < 0.97:
                status = "On Hold"
                actual_delivery = None
            else:
                status = "Cancelled"
                actual_delivery = None
            on_hold = status == "On Hold"

        shipped_in_full = random.random() > 0.03
        qty = random.randint(10, 500)
        price = product.unit_cost * random.uniform(1.1, 1.4)

        order = Order(
            order_number=f"ORD-{2024000 + i + 1}",
            customer=random.choice(CUSTOMERS),
            product_id=product.id,
            supplier_id=supplier.id,
            quantity=qty,
            unit_price=round(price, 2),
            order_date=order_date,
            expected_delivery=expected_delivery,
            actual_delivery=actual_delivery,
            status=status,
            shipped_in_full=shipped_in_full,
            on_hold=on_hold,
        )
        db.add(order)
        orders.append(order)

    db.commit()
    for o in orders:
        db.refresh(o)

    # Shipments for non-Processing, non-Cancelled orders
    for order in orders:
        if order.status in ("Processing", "Cancelled"):
            continue
        wh = random.choice(WAREHOUSES)
        shipped = order.order_date + datetime.timedelta(days=random.randint(1, 3))
        est_del = order.expected_delivery
        shipment = Shipment(
            order_id=order.id,
            carrier=random.choice(CARRIERS),
            tracking_number=f"TRK{random.randint(100000000, 999999999)}",
            origin=wh["name"],
            destination=f"{random.choice(CUSTOMERS)} - {random.choice(['Chicago', 'New York', 'London', 'Frankfurt', 'Tokyo', 'Singapore'])}",
            shipped_date=shipped,
            estimated_delivery=est_del,
            actual_delivery=order.actual_delivery,
            status=order.status,
            freight_cost=round(random.uniform(80, 1800), 2),
        )
        db.add(shipment)

    db.commit()

    # Purchase Orders (280)
    payment_terms_options = ["Net30", "Net60", "Net90"]
    po_statuses = ["Paid", "Paid", "Paid", "Invoiced", "Open", "Cancelled"]

    for i in range(280):
        product = random.choice(products)
        cat_suppliers = category_supplier_map.get(product.category, fallback_suppliers)
        supplier = random.choice(cat_suppliers) if cat_suppliers else random.choice(suppliers)
        req_date = random_date(400, 10)
        po_date = req_date + datetime.timedelta(days=random.randint(1, 4))
        status = random.choice(po_statuses)
        terms = random.choice(payment_terms_options)
        terms_days = int(terms.replace("Net", ""))
        invoice_date = po_date + datetime.timedelta(days=random.randint(15, 40)) if status in ("Invoiced", "Paid") else None
        payment_date = invoice_date + datetime.timedelta(days=terms_days + random.randint(-5, 10)) if status == "Paid" and invoice_date else None
        qty = random.randint(50, 1000)
        cost = product.unit_cost * random.uniform(0.95, 1.05)

        po = PurchaseOrder(
            po_number=f"PO-{2024000 + i + 1}",
            supplier_id=supplier.id,
            product_id=product.id,
            quantity=qty,
            unit_cost=round(cost, 2),
            requisition_date=req_date,
            po_date=po_date,
            invoice_date=invoice_date,
            payment_date=payment_date,
            status=status,
            total_amount=round(qty * cost, 2),
            payment_terms=terms,
        )
        db.add(po)

    db.commit()
    db.close()
    print("Database seeded successfully.")
    print(f"  {len(suppliers)} suppliers")
    print(f"  {len(products)} products")
    print("  ~350 inventory records")
    print("  350 orders")
    print("  ~280 shipments")
    print("  280 purchase orders")


if __name__ == "__main__":
    seed()
