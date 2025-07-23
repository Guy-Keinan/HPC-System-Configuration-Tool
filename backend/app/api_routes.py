from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import Configuration
from app.pricing_service import pricing_service
import uuid
import datetime

# Create API Router
router = APIRouter(prefix="/api", tags=["Configuration"])

# Pydantic Models for API
class ConfigurationSaveRequest(BaseModel):
    """Request model for saving complete configuration"""
    configuration_data: Dict[str, Any]

class ConfigurationResponse(BaseModel):
    """Response model for configuration operations"""
    id: int
    configuration_data: Dict[str, Any]
    is_generated: bool
    configuration_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    """Request model for exporting configuration"""
    format: str  # "json" or "pdf"

class PriceResponse(BaseModel):
    """Response model for pricing queries"""
    nodes_count: int
    price_usd: float
    currency: str = "USD"
    response_time_ms: str = "< 1ms"

class AllPricesResponse(BaseModel):
    """Response model for all pricing options"""
    pricing_options: Dict[int, float]
    currency: str = "USD"
    total_options: int

# API Endpoints

@router.post("/configuration/save", response_model=Dict[str, Any])
async def save_configuration(
    request: ConfigurationSaveRequest,
    db: Session = Depends(get_db)
):
    """
    Save complete configuration data to database
    Generates unique configuration ID and marks as generated
    """
    try:
        # Generate unique configuration ID
        config_id = f"LOCAL-{int(datetime.datetime.now().timestamp() * 1000)}"
        
        # Create new configuration - convert dict to JSON string
        import json
        config_json = json.dumps(request.configuration_data)
        
        config = Configuration(
            configuration_data=config_json,
            is_generated=True,
            configuration_id=config_id
        )
        
        db.add(config)
        db.commit()
        db.refresh(config)
        
        return {
            "id": config.id,
            "configuration_id": config.configuration_id,
            "message": "Configuration saved successfully",
            "status": "success"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save configuration: {str(e)}"
        )

@router.get("/configuration/{config_id}", response_model=ConfigurationResponse)
async def get_configuration(config_id: int, db: Session = Depends(get_db)):
    """
    Get configuration by ID
    Returns complete configuration data
    """
    config = db.query(Configuration).filter(Configuration.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration with ID {config_id} not found"
        )
    
    return ConfigurationResponse(
        id=config.id,
        configuration_data=config.configuration_data or {},
        is_generated=config.is_generated,
        configuration_id=config.configuration_id,
        created_at=config.created_at.isoformat() if config.created_at else None,
        updated_at=config.updated_at.isoformat() if config.updated_at else None
    )

@router.post("/configuration/{config_id}/export", response_model=Dict[str, Any])
async def export_configuration(
    config_id: int,
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """
    Export configuration as JSON or PDF
    Returns download link or file data
    """
    # Get configuration
    config = db.query(Configuration).filter(Configuration.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration with ID {config_id} not found"
        )
    
    if not config.is_generated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration must be generated before export"
        )
    
    try:
        if request.format.lower() == "json":
            # Return JSON data directly
            return {
                "format": "json",
                "configuration_id": config.configuration_id,
                "data": config.configuration_data,
                "exported_at": datetime.datetime.now().isoformat(),
                "message": "JSON export ready"
            }
        
        elif request.format.lower() == "pdf":
            # For now, return placeholder - PDF generation will be implemented later
            return {
                "format": "pdf",
                "configuration_id": config.configuration_id,
                "message": "PDF export functionality will be implemented",
                "status": "pending"
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Export format must be 'json' or 'pdf'"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export configuration: {str(e)}"
        )

# =============================================================================
# PRICING ENDPOINTS
# =============================================================================

@router.get("/pricing/nodes/{nodes_count}", response_model=PriceResponse)
async def get_price_by_nodes(nodes_count: int):
    """
    Get price for specific number of nodes
    Returns instant response from memory cache
    
    Args:
        nodes_count: Number of nodes (4, 8, 16, 32, 64, 128, 192, 256, 320, 384, 448, 512)
    
    Returns:
        Price information for the specified node count
    """
    try:
        price = pricing_service.get_price(nodes_count)
        
        if price is None:
            available_nodes = pricing_service.get_available_node_counts()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid node count: {nodes_count}. Available options: {available_nodes}"
            )
        
        return PriceResponse(
            nodes_count=nodes_count,
            price_usd=price
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing service not initialized: {str(e)}"
        )

@router.get("/pricing/all", response_model=AllPricesResponse)
async def get_all_prices():
    """
    Get all available pricing options
    Returns all node configurations with their prices
    
    Returns:
        Dictionary of all available pricing options
    """
    try:
        all_prices = pricing_service.get_all_prices()
        
        return AllPricesResponse(
            pricing_options=all_prices,
            total_options=len(all_prices)
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing service not initialized: {str(e)}"
        )

@router.get("/pricing/nodes", response_model=Dict[str, Any])
async def get_available_node_counts():
    """
    Get list of available node configurations
    
    Returns:
        List of available node counts
    """
    try:
        available_nodes = pricing_service.get_available_node_counts()
        
        return {
            "available_node_counts": available_nodes,
            "total_options": len(available_nodes),
            "message": "Available node configuration options"
        }
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing service not initialized: {str(e)}"
        ) 