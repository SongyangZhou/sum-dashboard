from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    category = Column(String)
    contact_email = Column(String)
    risk_level = Column(String)  # low, medium, high
    active = Column(Boolean, default=True)
    orders = relationship("Order", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    category = Column(String)
    unit_cost = Column(Float)
    reorder_point = Column(Integer)
    lead_time_days = Column(Integer)
    inventory_records = relationship("InventoryRecord", back_populates="product")
    orders = relationship("Order", back_populates="product")
    purchase_orders = relationship("PurchaseOrder", back_populates="product")


class InventoryRecord(Base):
    __tablename__ = "inventory_records"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse = Column(String)
    region = Column(String)
    quantity = Column(Integer)
    last_updated = Column(DateTime)
    product = relationship("Product", back_populates="inventory_records")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    customer = Column(String)
    product_id = Column(Integer, ForeignKey("products.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    order_date = Column(DateTime)
    expected_delivery = Column(DateTime)
    actual_delivery = Column(DateTime, nullable=True)
    status = Column(String)  # Delivered, In Transit, Processing, On Hold, Cancelled
    shipped_in_full = Column(Boolean, default=True)
    on_hold = Column(Boolean, default=False)
    product = relationship("Product", back_populates="orders")
    supplier = relationship("Supplier", back_populates="orders")
    shipment = relationship("Shipment", back_populates="order", uselist=False)


class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    carrier = Column(String)
    tracking_number = Column(String, unique=True)
    origin = Column(String)
    destination = Column(String)
    shipped_date = Column(DateTime)
    estimated_delivery = Column(DateTime)
    actual_delivery = Column(DateTime, nullable=True)
    status = Column(String)
    freight_cost = Column(Float)
    order = relationship("Order", back_populates="shipment")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_cost = Column(Float)
    requisition_date = Column(DateTime)
    po_date = Column(DateTime)
    invoice_date = Column(DateTime, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    status = Column(String)  # Open, Invoiced, Paid, Cancelled
    total_amount = Column(Float)
    payment_terms = Column(String)
    supplier = relationship("Supplier", back_populates="purchase_orders")
    product = relationship("Product", back_populates="purchase_orders")
