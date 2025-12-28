# ShopifyAI - AI-Powered Shopify Analytics App

## Original Problem Statement
Build an AI-powered analytics application that connects to a Shopify store, reads customer/order/inventory data, and allows users to ask natural-language questions (e.g., inventory projection, sales trends). The system should translate questions into ShopifyQL, fetch data from Shopify, and return answers in simple, layman-friendly language.

## User Choices
- **LLM Provider**: OpenAI GPT-5.2 via Emergent LLM Key
- **Backend Architecture**: FastAPI (mocking Rails API layer) + Python AI Service
- **Shopify Integration**: Mock data with OAuth flow ready for production
- **Database**: MongoDB
- **Theme**: Light theme with Indigo/Emerald color palette

## Architecture

### Backend (FastAPI - /app/backend/server.py)
- **API Gateway**: RESTful endpoints with `/api` prefix
- **Store Management**: Connect/disconnect stores with mock OAuth
- **Analytics Service**: Aggregated metrics, sales trends, inventory analysis
- **AI Agent**: OpenAI GPT-5.2 for natural language processing
  - Intent classification (inventory, sales, customer analysis)
    - ShopifyQL query generation
      - Business-friendly response formatting
      - **Mock Data Generator**: Products, orders, customers, inventory

      ### Frontend (React - /app/frontend/src/)
      - **Landing Page**: App overview, features, how it works
      - **Connect Store**: Mock OAuth flow with form validation
      - **Dashboard**: Analytics overview, charts, low stock alerts
      - **AI Assistant**: Chat interface for natural language queries
      - **Query History**: Previous questions and answers

      ### Database (MongoDB)
      - `stores`: Connected store metadata
      - `mock_products`: Product catalog with inventory
      - `mock_orders`: Order history
      - `mock_customers`: Customer data
      - `questions`: Query history

      ## User Personas
      1. **Shopify Store Owner**: Non-technical, needs quick business insights
      2. **E-commerce Manager**: Wants inventory alerts and sales forecasting
      3. **Operations Lead**: Needs reorder recommendations

      ## Core Requirements (Static)
      - [x] Shopify OAuth integration (MOCKED for demo)
      - [x] Natural language question interface
      - [x] AI-powered intent classification
      - [x] ShopifyQL query generation
      - [x] Business-friendly response formatting
      - [x] Analytics dashboard with visualizations
      - [x] Query history tracking

      ## What's Been Implemented (December 27, 2025)

      ### Backend
      - FastAPI server with all API endpoints
      - Store connection with mock OAuth flow
      - Mock data generation (products, orders, customers)
      - AI Agent using OpenAI GPT-5.2 via emergentintegrations
      - Analytics aggregation (revenue, orders, AOV, top products)
      - Question processing with intent classification
      - ShopifyQL query generation

      ### Frontend
      - Landing page with hero, features, how it works sections
      - Store connection page with form validation
      - Dashboard with 4 KPI cards (Orders, Revenue, Customers, AOV)
      - Sales trend chart (14 days)
      - Low stock alerts panel
      - Top products by revenue chart
      - Recent orders table
      - AI Assistant chat interface
      - Query history page
      - Responsive design with Indigo/Emerald theme

      ### API Endpoints
      - `POST /api/stores/connect` - Connect new store
      - `GET /api/stores` - List connected stores
      - `GET /api/stores/{id}` - Get store details
      - `DELETE /api/stores/{id}` - Disconnect store
      - `GET /api/stores/{id}/analytics` - Get analytics summary
      - `POST /api/v1/questions` - Ask AI question
      - `GET /api/stores/{id}/questions` - Get question history
      - `GET /api/stores/{id}/products` - List products
      - `GET /api/stores/{id}/orders` - List orders
      - `GET /api/stores/{id}/customers` - List customers

      ## Prioritized Backlog

      ### P0 (Critical) - DONE
      - [x] Store connection flow
      - [x] Mock data generation
      - [x] AI question processing
      - [x] Basic analytics dashboard

      ### P1 (Important) - Remaining
      - [ ] Real Shopify OAuth integration
      - [ ] Real-time data sync from Shopify
      - [ ] Conversation memory for follow-up questions
      - [ ] ShopifyQL validation layer

      ### P2 (Nice to Have)
      - [ ] Caching Shopify responses
      - [ ] Export reports to PDF/CSV
      - [ ] Email alerts for low stock
      - [ ] Multi-store comparison dashboard
      - [ ] Retry & fallback logic in AI agent

      ## Next Tasks
      1. Add conversation memory for contextual follow-ups
      2. Implement query validation for ShopifyQL
      3. Add more chart types (pie, area, scatter)
      4. Integrate real Shopify OAuth when credentials provided
      5. Add admin settings page
      
