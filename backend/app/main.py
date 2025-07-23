from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.api_routes import router
from app.pricing_service import pricing_service
import uvicorn
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI instance
app = FastAPI(
    title="HPC System Configuration API",
    description="Configure your high-performance computing cluster with intelligent validation and real-time pricing",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Angular default port (local development)
        "http://frontend:4200",   # Docker container name
        "http://127.0.0.1:4200"   # Local IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and load pricing data"""
    logger.info("🚀 Starting HPC Configuration API...")
    
    # Initialize pricing data if needed (this will also create all tables)
    await initialize_pricing_data()
    
    # Load pricing data to memory cache
    await pricing_service.load_prices_to_cache()
    logger.info("✅ Pricing service initialized")
    
    logger.info("🎯 API ready to serve requests!")

async def initialize_pricing_data():
    """Initialize pricing data if the table is empty"""
    from sqlalchemy.orm import Session
    from sqlalchemy import text
    from app.models import NodePricing
    from app.database import Base
    from decimal import Decimal
    
    # First ensure tables exist using the correct Base from database
    Base.metadata.create_all(bind=engine)
    logger.info("✅ All tables created/verified")
    
    with Session(engine) as session:
        # Now check if pricing data exists - SQLAlchemy 2.0 compatible
        try:
            count_result = session.execute(text("SELECT COUNT(*) FROM node_pricing")).scalar()
            
            if count_result == 0:
                logger.info("📊 Initializing pricing data...")
                
                # Pricing data - nodes_count: price_usd
                pricing_data = {
                    4: Decimal('199.99'),
                    8: Decimal('349.99'), 
                    16: Decimal('649.99'),
                    32: Decimal('1199.99'),
                    64: Decimal('2299.99'),
                    128: Decimal('4399.99'),
                    192: Decimal('6299.99'),
                    256: Decimal('8199.99'),
                    320: Decimal('9999.99'),
                    384: Decimal('11699.99'),
                    448: Decimal('13299.99'),
                    512: Decimal('14999.99')
                }
                
                # Insert pricing data
                for nodes, price in pricing_data.items():
                    pricing_record = NodePricing(
                        nodes_count=nodes,
                        price_usd=price
                    )
                    session.add(pricing_record)
                
                session.commit()
                logger.info(f"✅ Inserted {len(pricing_data)} pricing records")
            else:
                logger.info(f"📊 Pricing data already exists ({count_result} records)")
                
        except Exception as e:
            logger.error(f"❌ Error checking/creating pricing data: {e}")
            # Still try to create basic data structure
            session.rollback()

# Health Check Endpoint
@app.get("/api/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "HPC Configuration API",
        "version": "2.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "HPC System Configuration API",
        "docs": "/api/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Development only
    ) 