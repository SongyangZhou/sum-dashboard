from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, inventory, suppliers, orders, procurement, logistics

app = FastAPI(title="Supply Chain Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(orders.router)
app.include_router(procurement.router)
app.include_router(logistics.router)


@app.get("/")
def root():
    return {"message": "Supply Chain Management API", "docs": "/docs"}
