# HPC System Configuration Tool

A dynamic High-Performance Computing (HPC) system configuration tool with Angular frontend, Python FastAPI backend, and PostgreSQL database.

## 🚀 Features

- **Interactive Configuration Wizard**: 4-step guided process for HPC system setup
- **Real-time Pricing**: Dynamic pricing based on node count with in-memory caching
- **System Validation**: Intelligent validation and compatibility checking
- **Database Persistence**: Configuration storage with unique IDs
- **Modern UI**: Responsive Angular interface with Material Design
- **Docker Deployment**: Complete containerized solution

## 🏗️ Architecture

```
Frontend (Angular 19)  →  Backend (FastAPI)  →  Database (PostgreSQL)
     ↓                        ↓                       ↓
- Stepper UI             - REST API              - Configuration storage
- State management       - Pricing service       - Node pricing data
- Form validation        - SQLAlchemy ORM        - Data persistence
```

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## 🐳 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HPC-System-Configuration-Tool
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📝 Configuration Flow

### Step 1: System Type
- Select system type (DataCore X300)
- Choose deployment type (MiniCluster/SuperCluster)
- Configure node count and rack layout

### Step 2: Power Configuration
- Select power type (DC/AC/Mixed)
- Choose region for power standards
- Review power efficiency calculations

### Step 3: Storage Configuration
- Select storage protocol (High-Speed/Ethernet)
- Choose storage vendor
- Configure support duration

### Step 4: Review & Generate
- Review complete configuration
- View dynamic pricing
- Generate and save configuration

## 💰 Pricing Model

Dynamic pricing based on node count:
- 4 nodes: $199.99
- 8 nodes: $349.99
- 16 nodes: $649.99
- ... up to 512 nodes

Prices are cached in memory for optimal performance.

## 🛠️ Development

### Local Development Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```

**Database:**
```bash
docker run --name postgres-local -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine
```

### Project Structure

```
HPC-System-Configuration-Tool/
├── frontend/                 # Angular application
│   ├── src/app/
│   │   ├── components/      # UI components
│   │   ├── services/        # State management & API
│   │   └── interfaces/      # TypeScript definitions
│   └── Dockerfile
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── models.py       # Database models
│   │   ├── api_routes.py   # REST API endpoints
│   │   ├── database.py     # Database configuration
│   │   └── pricing_service.py # Pricing logic
│   └── Dockerfile
├── docker-compose.yml      # Multi-container setup
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
- Default: `postgresql://postgres:postgres@postgres-db:5432/hpc_config`

**Frontend:**
- `apiUrl`: Backend API URL
- Default: `http://localhost:8000/api`

### Database Schema

**configurations** table:
- `id`: Primary key
- `configuration_id`: Unique configuration identifier
- `configuration_data`: JSON configuration data
- `is_generated`: Generation status
- `created_at`/`updated_at`: Timestamps

**node_pricing** table:
- `nodes_count`: Number of nodes (primary key)
- `price_usd`: Price in USD
- `created_at`/`updated_at`: Timestamps

## 📊 API Endpoints

- `GET /api/pricing/nodes/{count}`: Get price for specific node count
- `GET /api/pricing/all`: Get all pricing options
- `POST /api/configuration/save`: Save configuration
- `GET /api/configuration/{id}`: Retrieve configuration
- `GET /api/health`: Health check

## 🧪 Testing

Access http://localhost:4200 and follow the configuration wizard:

1. Select DataCore X300 → MiniCluster → 4 nodes
2. Choose Full DC Power → United States
3. Select High-Speed Interconnect → WekaIO → 5 Years
4. Review pricing ($199.99) and generate configuration

## 🚀 Deployment

The application is fully containerized and ready for production deployment with Docker Compose.

For production:
1. Update environment variables
2. Configure proper PostgreSQL credentials
3. Set up reverse proxy (nginx) if needed
4. Enable HTTPS/SSL
