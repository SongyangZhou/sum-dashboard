from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, inventory, suppliers, orders, procurement, logistics


def _auto_seed():
    from database import SessionLocal
    from models import Supplier
    import models
    from database import engine
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Supplier).count() == 0:
            db.close()
            import seed
            seed.seed()
    finally:
        try:
            db.close()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    _auto_seed()
    yield


app = FastAPI(
    title="Supply Chain Management System",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
