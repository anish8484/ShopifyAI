from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Shopify Analytics AI")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Models ==============

class StoreCreate(BaseModel):
    shop_domain: str
    shop_name: str

class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_domain: str
    shop_name: str
    access_token: str = Field(default_factory=lambda: f"mock_token_{uuid.uuid4().hex[:16]}")
    is_connected: bool = True
    connected_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuestionRequest(BaseModel):
    store_id: str
    question: str

class QuestionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_id: str
    question: str
    answer: str
    confidence: str
    shopify_ql: Optional[str] = None
    intent: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AnalyticsSummary(BaseModel):
    total_orders: int
    total_revenue: float
    total_customers: int
    total_products: int
    avg_order_value: float
    top_products: List[Dict[str, Any]]
    recent_orders: List[Dict[str, Any]]
    low_stock_products: List[Dict[str, Any]]
    sales_by_day: List[Dict[str, Any]]

# ============== Mock Shopify Data Generator ==============

def generate_mock_products(store_id: str, count: int = 20) -> List[Dict]:
    products = []
    product_names = [
        "Premium Wireless Headphones", "Organic Cotton T-Shirt", "Smart Watch Pro",
        "Leather Wallet Classic", "Running Shoes Elite", "Coffee Maker Deluxe",
        "Yoga Mat Premium", "Portable Charger 20000mAh", "Bamboo Water Bottle",
        "Sunglasses UV400", "Backpack Travel", "Desk Lamp LED", "Bluetooth Speaker",
        "Plant-Based Protein Powder", "Essential Oil Set", "Ceramic Coffee Mug",
        "Fitness Tracker Band", "Stainless Steel Flask", "Notebook Leather Bound",
        "Wireless Mouse Ergonomic"
    ]
    for i in range(count):
        inventory = random.randint(0, 200)
        daily_sales = random.randint(2, 15)
        products.append({
            "id": f"prod_{store_id[:8]}_{i}",
            "title": product_names[i % len(product_names)],
            "price": round(random.uniform(19.99, 299.99), 2),
            "inventory_quantity": inventory,
            "avg_daily_sales": daily_sales,
            "days_of_stock": round(inventory / daily_sales, 1) if daily_sales > 0 else 999,
            "sku": f"SKU-{random.randint(1000, 9999)}",
            "vendor": random.choice(["Supplier A", "Supplier B", "Supplier C"]),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365))).isoformat()
        })
    return products

def generate_mock_orders(store_id: str, products: List[Dict], count: int = 100) -> List[Dict]:
    orders = []
    customer_names = ["John Smith", "Emma Wilson", "Michael Brown", "Sarah Davis", "James Johnson",
                      "Emily Taylor", "David Anderson", "Olivia Martinez", "Daniel Thomas", "Sophia Garcia"]
    
    for i in range(count):
        num_items = random.randint(1, 4)
        order_products = random.sample(products, min(num_items, len(products)))
        line_items = []
        total = 0
        for p in order_products:
            qty = random.randint(1, 3)
            line_items.append({
                "product_id": p["id"],
                "title": p["title"],
                "quantity": qty,
                "price": p["price"]
            })
            total += p["price"] * qty
        
        order_date = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 90))
        orders.append({
            "id": f"order_{store_id[:8]}_{i}",
            "order_number": 1000 + i,
            "customer_name": random.choice(customer_names),
            "customer_email": f"customer{i}@example.com",
            "total_price": round(total, 2),
            "line_items": line_items,
            "status": random.choice(["fulfilled", "fulfilled", "fulfilled", "pending", "shipped"]),
            "created_at": order_date.isoformat(),
            "date": order_date.strftime("%Y-%m-%d")
        })
    return sorted(orders, key=lambda x: x["created_at"], reverse=True)

def generate_mock_customers(store_id: str, orders: List[Dict]) -> List[Dict]:
    customer_map = {}
    for order in orders:
        email = order["customer_email"]
        if email not in customer_map:
            customer_map[email] = {
                "id": f"cust_{uuid.uuid4().hex[:8]}",
                "email": email,
                "name": order["customer_name"],
                "total_orders": 0,
                "total_spent": 0,
                "first_order_date": order["created_at"],
                "last_order_date": order["created_at"]
            }
        customer_map[email]["total_orders"] += 1
        customer_map[email]["total_spent"] = round(customer_map[email]["total_spent"] + order["total_price"], 2)
        if order["created_at"] < customer_map[email]["first_order_date"]:
            customer_map[email]["first_order_date"] = order["created_at"]
        if order["created_at"] > customer_map[email]["last_order_date"]:
            customer_map[email]["last_order_date"] = order["created_at"]
    
    return list(customer_map.values())

# ============== AI Agent Service ==============

class ShopifyAIAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def analyze_question(self, question: str, store_data: Dict) -> Dict:
        """Use LLM to analyze question and generate insights"""
        try:
            # Create context from store data
            products_summary = f"Total products: {len(store_data.get('products', []))}"
            low_stock = [p for p in store_data.get('products', []) if p.get('days_of_stock', 999) < 7]
            orders_summary = f"Total orders (90 days): {len(store_data.get('orders', []))}"
            
            total_revenue = sum(o.get('total_price', 0) for o in store_data.get('orders', []))
            avg_order = total_revenue / len(store_data.get('orders', [])) if store_data.get('orders') else 0
            
            # Build product details for context
            product_details = []
            for p in store_data.get('products', [])[:10]:
                product_details.append(f"- {p['title']}: ${p['price']}, Stock: {p['inventory_quantity']}, Daily Sales: {p['avg_daily_sales']}")
            
            # Calculate repeat customers
            customers = store_data.get('customers', [])
            repeat_customers = [c for c in customers if c.get('total_orders', 0) > 1]
            
            # Sales by day analysis
            orders_by_day = {}
            for order in store_data.get('orders', []):
                day = order.get('date', '')
                if day:
                    orders_by_day[day] = orders_by_day.get(day, 0) + order.get('total_price', 0)
            
            context = f"""
You are an AI analytics assistant for a Shopify store. Analyze the following store data and answer the user's question in simple, business-friendly language.

STORE DATA:
- {products_summary}
- {orders_summary}
- Total Revenue (90 days): ${total_revenue:,.2f}
- Average Order Value: ${avg_order:,.2f}
- Products with low stock (< 7 days): {len(low_stock)}
- Total customers: {len(customers)}
- Repeat customers: {len(repeat_customers)}

TOP PRODUCTS BY DAILY SALES:
{chr(10).join(product_details)}

LOW STOCK ALERTS:
{chr(10).join([f"- {p['title']}: {p['inventory_quantity']} units, ~{p['days_of_stock']} days of stock" for p in low_stock[:5]]) if low_stock else "No immediate stock concerns"}

USER QUESTION: {question}

Please provide:
1. A clear, actionable answer to the question
2. Relevant data points to support your answer
3. Any recommendations for the store owner

Keep the response concise but informative. Use specific numbers when possible.
"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"shopify_analytics_{uuid.uuid4().hex[:8]}",
                system_message="You are a helpful Shopify analytics assistant that provides clear, actionable insights based on store data."
            ).with_model("openai", "gpt-5.2")
            
            user_message = UserMessage(text=context)
            response = await chat.send_message(user_message)
            
            # Determine intent and confidence
            question_lower = question.lower()
            if any(word in question_lower for word in ['inventory', 'stock', 'reorder', 'units']):
                intent = "inventory_analysis"
            elif any(word in question_lower for word in ['sales', 'revenue', 'selling', 'top']):
                intent = "sales_analysis"
            elif any(word in question_lower for word in ['customer', 'repeat', 'loyal']):
                intent = "customer_analysis"
            else:
                intent = "general_analysis"
            
            # Generate mock ShopifyQL
            shopify_ql = self._generate_shopify_ql(intent, question)
            
            return {
                "answer": response,
                "confidence": "high" if len(response) > 100 else "medium",
                "intent": intent,
                "shopify_ql": shopify_ql
            }
            
        except Exception as e:
            logger.error(f"AI analysis error: {str(e)}")
            # Fallback to rule-based response
            return self._fallback_analysis(question, store_data)
    
    def _generate_shopify_ql(self, intent: str, question: str) -> str:
        """Generate mock ShopifyQL query based on intent"""
        if intent == "inventory_analysis":
            return """
FROM products
SHOW product_title, inventory_quantity, variant_sku
WHERE inventory_quantity < 50
ORDER BY inventory_quantity ASC
LIMIT 10
"""
        elif intent == "sales_analysis":
            return """
FROM orders
SHOW order_id, total_price, created_at
WHERE created_at >= date_sub(now(), INTERVAL 30 DAY)
ORDER BY total_price DESC
LIMIT 10
"""
        elif intent == "customer_analysis":
            return """
FROM customers
SHOW customer_id, email, orders_count, total_spent
WHERE orders_count > 1
ORDER BY total_spent DESC
LIMIT 10
"""
        else:
            return """
FROM orders
SHOW SUM(total_price) AS revenue, COUNT(*) AS order_count
WHERE created_at >= date_sub(now(), INTERVAL 30 DAY)
GROUP BY date(created_at)
"""
    
    def _fallback_analysis(self, question: str, store_data: Dict) -> Dict:
        """Fallback rule-based analysis when LLM is unavailable"""
        products = store_data.get('products', [])
        orders = store_data.get('orders', [])
        customers = store_data.get('customers', [])
        
        question_lower = question.lower()
        
        if 'stock' in question_lower or 'inventory' in question_lower or 'reorder' in question_lower:
            low_stock = sorted([p for p in products if p.get('days_of_stock', 999) < 14], 
                             key=lambda x: x.get('days_of_stock', 999))[:5]
            if low_stock:
                items = ", ".join([f"{p['title']} ({p['inventory_quantity']} units, ~{p['days_of_stock']} days)" 
                                 for p in low_stock])
                answer = f"Based on current sales velocity, these products need attention: {items}. Consider reordering soon to avoid stockouts."
            else:
                answer = "All products currently have healthy stock levels (more than 14 days of inventory)."
            return {"answer": answer, "confidence": "high", "intent": "inventory_analysis", 
                    "shopify_ql": self._generate_shopify_ql("inventory_analysis", question)}
        
        elif 'top' in question_lower and ('sell' in question_lower or 'product' in question_lower):
            # Calculate top products by order frequency
            product_sales = {}
            for order in orders:
                for item in order.get('line_items', []):
                    pid = item.get('product_id')
                    if pid:
                        product_sales[pid] = product_sales.get(pid, 0) + item.get('quantity', 1)
            
            top_products = sorted(products, key=lambda p: product_sales.get(p['id'], 0), reverse=True)[:5]
            items = ", ".join([f"{p['title']} ({product_sales.get(p['id'], 0)} units sold)" for p in top_products])
            answer = f"Your top selling products are: {items}. These are driving most of your revenue."
            return {"answer": answer, "confidence": "high", "intent": "sales_analysis",
                    "shopify_ql": self._generate_shopify_ql("sales_analysis", question)}
        
        elif 'repeat' in question_lower or 'loyal' in question_lower:
            repeat = [c for c in customers if c.get('total_orders', 0) > 1]
            answer = f"You have {len(repeat)} repeat customers out of {len(customers)} total ({round(len(repeat)/len(customers)*100, 1)}% retention rate). Your top repeat customer has {max([c.get('total_orders', 0) for c in customers], default=0)} orders."
            return {"answer": answer, "confidence": "high", "intent": "customer_analysis",
                    "shopify_ql": self._generate_shopify_ql("customer_analysis", question)}
        
        else:
            total_revenue = sum(o.get('total_price', 0) for o in orders)
            avg_order = total_revenue / len(orders) if orders else 0
            answer = f"Your store has {len(orders)} orders totaling ${total_revenue:,.2f} in the last 90 days. Average order value is ${avg_order:,.2f}. You have {len(products)} products and {len(customers)} customers."
            return {"answer": answer, "confidence": "medium", "intent": "general_analysis",
                    "shopify_ql": self._generate_shopify_ql("general_analysis", question)}

# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "Shopify Analytics AI API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Store endpoints
@api_router.post("/stores/connect", response_model=Store)
async def connect_store(store_data: StoreCreate):
    """Mock OAuth flow - connect a Shopify store"""
    store = Store(
        shop_domain=store_data.shop_domain,
        shop_name=store_data.shop_name
    )
    
    store_dict = store.model_dump()
    await db.stores.insert_one(store_dict)
    
    # Generate mock data for this store
    products = generate_mock_products(store.id)
    orders = generate_mock_orders(store.id, products)
    customers = generate_mock_customers(store.id, orders)
    
    # Store mock data
    await db.mock_products.insert_many([{**p, "store_id": store.id} for p in products])
    await db.mock_orders.insert_many([{**o, "store_id": store.id} for o in orders])
    await db.mock_customers.insert_many([{**c, "store_id": store.id} for c in customers])
    
    return store

@api_router.get("/stores", response_model=List[Store])
async def get_stores():
    """Get all connected stores"""
    stores = await db.stores.find({}, {"_id": 0}).to_list(100)
    return stores

@api_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    """Get a specific store"""
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@api_router.delete("/stores/{store_id}")
async def disconnect_store(store_id: str):
    """Disconnect a store"""
    result = await db.stores.delete_one({"id": store_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Clean up mock data
    await db.mock_products.delete_many({"store_id": store_id})
    await db.mock_orders.delete_many({"store_id": store_id})
    await db.mock_customers.delete_many({"store_id": store_id})
    await db.questions.delete_many({"store_id": store_id})
    
    return {"message": "Store disconnected successfully"}

# Analytics endpoints
@api_router.get("/stores/{store_id}/analytics", response_model=AnalyticsSummary)
async def get_analytics(store_id: str):
    """Get analytics summary for a store"""
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    products = await db.mock_products.find({"store_id": store_id}, {"_id": 0}).to_list(1000)
    orders = await db.mock_orders.find({"store_id": store_id}, {"_id": 0}).to_list(1000)
    customers = await db.mock_customers.find({"store_id": store_id}, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(o.get('total_price', 0) for o in orders)
    avg_order = total_revenue / len(orders) if orders else 0
    
    # Top products by sales
    product_sales = {}
    for order in orders:
        for item in order.get('line_items', []):
            pid = item.get('product_id')
            if pid:
                if pid not in product_sales:
                    product_sales[pid] = {"quantity": 0, "revenue": 0}
                product_sales[pid]["quantity"] += item.get('quantity', 1)
                product_sales[pid]["revenue"] += item.get('price', 0) * item.get('quantity', 1)
    
    top_products = []
    for p in products:
        if p['id'] in product_sales:
            top_products.append({
                "id": p['id'],
                "title": p['title'],
                "quantity_sold": product_sales[p['id']]["quantity"],
                "revenue": round(product_sales[p['id']]["revenue"], 2)
            })
    top_products = sorted(top_products, key=lambda x: x["revenue"], reverse=True)[:5]
    
    # Low stock products
    low_stock = sorted([{
        "id": p['id'],
        "title": p['title'],
        "inventory": p['inventory_quantity'],
        "days_of_stock": p['days_of_stock']
    } for p in products if p.get('days_of_stock', 999) < 14], 
    key=lambda x: x['days_of_stock'])[:5]
    
    # Sales by day (last 14 days)
    sales_by_day = {}
    for order in orders:
        day = order.get('date', '')
        if day:
            if day not in sales_by_day:
                sales_by_day[day] = {"date": day, "orders": 0, "revenue": 0}
            sales_by_day[day]["orders"] += 1
            sales_by_day[day]["revenue"] += order.get('total_price', 0)
    
    sales_list = sorted(sales_by_day.values(), key=lambda x: x["date"], reverse=True)[:14]
    sales_list = sorted(sales_list, key=lambda x: x["date"])
    
    return AnalyticsSummary(
        total_orders=len(orders),
        total_revenue=round(total_revenue, 2),
        total_customers=len(customers),
        total_products=len(products),
        avg_order_value=round(avg_order, 2),
        top_products=top_products,
        recent_orders=[{
            "id": o['id'],
            "order_number": o['order_number'],
            "customer": o['customer_name'],
            "total": o['total_price'],
            "status": o['status'],
            "date": o['created_at']
        } for o in orders[:5]],
        low_stock_products=low_stock,
        sales_by_day=sales_list
    )

# Question/AI endpoint - Main feature
@api_router.post("/v1/questions", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Main AI endpoint - accepts natural language questions about store data.
    Uses LLM to understand intent, generate ShopifyQL, and provide insights.
    """
    store = await db.stores.find_one({"id": request.store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get store data
    products = await db.mock_products.find({"store_id": request.store_id}, {"_id": 0}).to_list(1000)
    orders = await db.mock_orders.find({"store_id": request.store_id}, {"_id": 0}).to_list(1000)
    customers = await db.mock_customers.find({"store_id": request.store_id}, {"_id": 0}).to_list(1000)
    
    store_data = {
        "products": products,
        "orders": orders,
        "customers": customers
    }
    
    # Use AI agent to analyze
    agent = ShopifyAIAgent(EMERGENT_LLM_KEY)
    result = await agent.analyze_question(request.question, store_data)
    
    # Create response
    response = QuestionResponse(
        store_id=request.store_id,
        question=request.question,
        answer=result["answer"],
        confidence=result["confidence"],
        shopify_ql=result.get("shopify_ql"),
        intent=result.get("intent")
    )
    
    # Save to history
    response_dict = response.model_dump()
    await db.questions.insert_one(response_dict)
    
    return response

@api_router.get("/stores/{store_id}/questions", response_model=List[QuestionResponse])
async def get_question_history(store_id: str, limit: int = Query(default=20, le=100)):
    """Get question history for a store"""
    questions = await db.questions.find(
        {"store_id": store_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return questions

# Products endpoint
@api_router.get("/stores/{store_id}/products")
async def get_products(store_id: str, limit: int = Query(default=50, le=200)):
    """Get products for a store"""
    products = await db.mock_products.find(
        {"store_id": store_id}, 
        {"_id": 0}
    ).to_list(limit)
    return products

# Orders endpoint
@api_router.get("/stores/{store_id}/orders")
async def get_orders(store_id: str, limit: int = Query(default=50, le=200)):
    """Get orders for a store"""
    orders = await db.mock_orders.find(
        {"store_id": store_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return orders

# Customers endpoint
@api_router.get("/stores/{store_id}/customers")
async def get_customers(store_id: str, limit: int = Query(default=50, le=200)):
    """Get customers for a store"""
    customers = await db.mock_customers.find(
        {"store_id": store_id}, 
        {"_id": 0}
    ).to_list(limit)
    return customers

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
