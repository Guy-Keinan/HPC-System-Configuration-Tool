"""
Pricing Service - Handles node pricing with in-memory caching
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from app.database import engine
from app.models import NodePricing
import logging

logger = logging.getLogger(__name__)

class PricingService:
    """
    Service to handle pricing logic with in-memory cache for maximum performance
    """
    
    def __init__(self):
        self._price_cache: Dict[int, float] = {}
        self._is_loaded = False
    
    async def load_prices_to_cache(self) -> None:
        """
        Load all pricing data from database to memory cache
        Called once during application startup
        """
        try:
            with Session(engine) as session:
                pricing_records = session.query(NodePricing).all()
                
                # Clear existing cache
                self._price_cache.clear()
                
                # Load all prices to memory
                for record in pricing_records:
                    self._price_cache[record.nodes_count] = float(record.price_usd)
                
                self._is_loaded = True
                logger.info(f"✅ Loaded {len(pricing_records)} prices to memory cache")
                logger.info(f"📊 Available node configurations: {sorted(self._price_cache.keys())}")
                
        except Exception as e:
            logger.error(f"❌ Failed to load prices to cache: {e}")
            raise
    
    def get_price(self, nodes_count: int) -> Optional[float]:
        """
        Get price for specific number of nodes
        Returns price instantly from memory cache
        
        Args:
            nodes_count: Number of nodes
            
        Returns:
            Price in USD or None if not found
        """
        if not self._is_loaded:
            raise RuntimeError("Pricing service not initialized. Call load_prices_to_cache() first.")
        
        return self._price_cache.get(nodes_count)
    
    def get_all_prices(self) -> Dict[int, float]:
        """
        Get all available pricing options
        
        Returns:
            Dictionary of {nodes_count: price_usd}
        """
        if not self._is_loaded:
            raise RuntimeError("Pricing service not initialized. Call load_prices_to_cache() first.")
        
        return self._price_cache.copy()
    
    def get_available_node_counts(self) -> list[int]:
        """
        Get list of available node configurations
        
        Returns:
            Sorted list of available node counts
        """
        if not self._is_loaded:
            raise RuntimeError("Pricing service not initialized. Call load_prices_to_cache() first.")
        
        return sorted(self._price_cache.keys())
    
    def is_valid_node_count(self, nodes_count: int) -> bool:
        """
        Check if the given node count is valid/available
        
        Args:
            nodes_count: Number of nodes to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not self._is_loaded:
            return False
        
        return nodes_count in self._price_cache

# Global pricing service instance
pricing_service = PricingService() 