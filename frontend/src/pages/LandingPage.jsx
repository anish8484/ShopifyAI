import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  BarChart3, 
  Brain, 
  ShoppingBag, 
  TrendingUp, 
  MessageSquare, 
  Package,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API}/stores`);
      setStores(response.data);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Insights",
      description: "Ask questions in plain English and get actionable business insights powered by GPT-5.2."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Automatic sales trends, inventory projections, and customer behavior analysis."
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Inventory Intelligence",
      description: "Know exactly when to reorder with AI-driven stock predictions."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Sales Forecasting",
      description: "Predict future sales based on historical data and market trends."
    }
  ];

  const exampleQuestions = [
    "How many units of Product X will I need next month?",
    "Which products are likely to go out of stock in 7 days?",
    "What were my top 5 selling products last week?",
    "Which customers placed repeat orders in the last 90 days?"
  ];

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">ShopifyAI</span>
          </div>
          
          <div className="flex items-center gap-4">
            {stores.length > 0 && (
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/dashboard/${stores[0].id}`)}
                data-testid="go-to-dashboard-btn"
              >
                Go to Dashboard
              </Button>
            )}
            <Button 
              onClick={() => navigate('/connect')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="connect-store-btn"
            >
              Connect Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by OpenAI GPT-5.2
          </div>
          
          <h1 className="font-heading text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            AI Analytics for Your{" "}
            <span className="text-indigo-600">Shopify Store</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Ask questions in plain English about your store's performance. Get instant insights 
            on inventory, sales trends, and customer behavior—no data science degree required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/connect')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 text-base"
              data-testid="hero-connect-btn"
            >
              Connect Your Store
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {stores.length > 0 && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate(`/dashboard/${stores[0].id}`)}
                className="px-8 h-12 text-base border-slate-300"
                data-testid="hero-dashboard-btn"
              >
                View Demo Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Example Questions Preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden ai-glow">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="font-medium text-slate-900">Ask anything about your store</span>
            </div>
            <div className="p-4 space-y-2">
              {exampleQuestions.map((q, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-slate-50 rounded-lg text-slate-600 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  "{q}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-t border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="overline mb-3">FEATURES</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything You Need to Understand Your Business
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-slate-200 card-hover" data-testid={`feature-card-${i}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="overline mb-3">HOW IT WORKS</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              From Question to Insight in Seconds
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect", desc: "Link your Shopify store with one click OAuth" },
              { step: "02", title: "Ask", desc: "Type any question about your store in plain English" },
              { step: "03", title: "Act", desc: "Get actionable insights backed by your real data" }
            ].map((item, i) => (
              <div key={i} className="text-center" data-testid={`step-${i}`}>
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="font-heading font-bold text-xl text-white">{item.step}</span>
                </div>
                <h3 className="font-heading font-semibold text-xl text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connected Stores */}
      {stores.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
              Connected Stores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <Card 
                  key={store.id} 
                  className="border-slate-200 card-hover cursor-pointer"
                  onClick={() => navigate(`/dashboard/${store.id}`)}
                  data-testid={`store-card-${store.id}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{store.shop_name}</p>
                        <p className="text-sm text-slate-500">{store.shop_domain}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">ShopifyAI</span>
            </div>
            <p className="text-slate-400 text-sm">
              AI-powered analytics for smarter e-commerce decisions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
