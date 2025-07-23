"""
Seed pricing data for node configurations
"""
from sqlalchemy.orm import Session
from database import engine
from models import NodePricing, Base
from decimal import Decimal

def seed_pricing_data():
    """
    Create pricing table and insert pricing data for all node configurations
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
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
    
    # Create database session
    with Session(engine) as session:
        try:
            # Clear existing data
            session.query(NodePricing).delete()
            
            # Insert new pricing data
            for nodes, price in pricing_data.items():
                pricing_record = NodePricing(
                    nodes_count=nodes,
                    price_usd=price
                )
                session.add(pricing_record)
            
            session.commit()
            print(f"✅ Successfully seeded {len(pricing_data)} pricing records")
            
            # Verify data
            count = session.query(NodePricing).count()
            print(f"📊 Total pricing records in database: {count}")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error seeding pricing data: {e}")
            raise

if __name__ == "__main__":
    seed_pricing_data() 