import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import {
  ShoppingBag,
  BarChart3,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Send,
  Loader2,
  MessageSquare,
  History,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const chatInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, [storeId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storeRes, analyticsRes, historyRes] = await Promise.all([
        axios.get(`${API}/stores/${storeId}`),
        axios.get(`${API}/stores/${storeId}/analytics`),
        axios.get(`${API}/stores/${storeId}/questions?limit=10`)
      ]);
      
      setStore(storeRes.data);
      setAnalytics(analyticsRes.data);
      setQuestionHistory(historyRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load store data");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || asking) return;

    const userQuestion = question.trim();
    setQuestion("");
    setAsking(true);
    
    // Add user message
    setConversation(prev => [...prev, { type: "user", text: userQuestion }]);

    try {
      const response = await axios.post(`${API}/v1/questions`, {
        store_id: storeId,
        question: userQuestion
      });
      
      // Add AI response
      setConversation(prev => [...prev, { 
        type: "ai", 
        text: response.data.answer,
        confidence: response.data.confidence,
        intent: response.data.intent
      }]);
      
      // Update history
      setQuestionHistory(prev => [response.data, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error("Failed to get answer:", error);
      setConversation(prev => [...prev, { 
        type: "ai", 
        text: "Sorry, I couldn't process your question. Please try again.",
        confidence: "low"
      }]);
      toast.error("Failed to get AI response");
    } finally {
      setAsking(false);
      chatInputRef.current?.focus();
    }
  };

  const handleSampleQuestion = (q) => {
    setQuestion(q);
    chatInputRef.current?.focus();
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect this store?")) return;
    
    try {
      await axios.delete(`${API}/stores/${storeId}`);
      toast.success("Store disconnected");
      navigate('/');
    } catch (error) {
      toast.error("Failed to disconnect store");
    }
  };

  const sampleQuestions = [
    "What were my top 5 selling products last week?",
    "Which products are likely to go out of stock in 7 days?",
    "How much inventory should I reorder based on last 30 days sales?",
    "Which customers placed repeat orders in the last 90 days?"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
        <div className="p-4 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-900">ShopifyAI</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Connected Store</p>
          <p className="font-medium text-slate-900 truncate">{store?.shop_name}</p>
          <p className="text-sm text-slate-500 truncate">{store?.shop_domain}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`nav-item w-full ${activeTab === "overview" ? "active" : ""}`}
            data-testid="nav-overview"
          >
            <BarChart3 className="w-5 h-5" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`nav-item w-full ${activeTab === "chat" ? "active" : ""}`}
            data-testid="nav-chat"
          >
            <MessageSquare className="w-5 h-5" />
            AI Assistant
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`nav-item w-full ${activeTab === "history" ? "active" : ""}`}
            data-testid="nav-history"
          >
            <History className="w-5 h-5" />
            Query History
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={fetchData}
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDisconnect}
            data-testid="disconnect-btn"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Disconnect Store
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-slate-900">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "chat" && "AI Assistant"}
                {activeTab === "history" && "Query History"}
              </h1>
              <p className="text-sm text-slate-500">{store?.shop_name}</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && analytics && (
            <div className="space-y-6 animate-fade-in" data-testid="overview-content">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="stats-card" data-testid="stat-orders">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total Orders</p>
                        <p className="text-3xl font-heading font-bold text-slate-900 tabular-nums">
                          {analytics.total_orders}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card" data-testid="stat-revenue">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                        <p className="text-3xl font-heading font-bold text-slate-900 tabular-nums">
                          ${analytics.total_revenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card" data-testid="stat-customers">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Customers</p>
                        <p className="text-3xl font-heading font-bold text-slate-900 tabular-nums">
                          {analytics.total_customers}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card" data-testid="stat-aov">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Avg Order Value</p>
                        <p className="text-3xl font-heading font-bold text-slate-900 tabular-nums">
                          ${analytics.avg_order_value.toFixed(2)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <Card className="lg:col-span-2" data-testid="sales-chart">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Sales Trend (Last 14 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.sales_by_day}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(value) => value.slice(5)}
                            stroke="#94a3b8"
                          />
                          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip 
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#6366f1" 
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card data-testid="low-stock-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-heading text-lg">Low Stock Alert</CardTitle>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-56">
                      {analytics.low_stock_products.length > 0 ? (
                        <div className="space-y-3">
                          {analytics.low_stock_products.map((product, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{product.title}</p>
                                <p className="text-xs text-slate-500">{product.inventory} units left</p>
                              </div>
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-0">
                                ~{product.days_of_stock}d
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-slate-500 text-sm">All products have healthy stock levels</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="top-products-card">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Top Products by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.top_products} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis 
                            type="category" 
                            dataKey="title" 
                            width={120} 
                            tick={{ fontSize: 11 }} 
                            stroke="#94a3b8"
                            tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="recent-orders-card">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recent_orders.map((order, i) => (
                            <tr key={i}>
                              <td className="font-mono text-sm">#{order.order_number}</td>
                              <td>{order.customer}</td>
                              <td className="tabular-nums">${order.total.toFixed(2)}</td>
                              <td>
                                <span className={`badge-${order.status === 'fulfilled' ? 'success' : order.status === 'pending' ? 'warning' : 'success'}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick AI Question */}
              <Card className="ai-glow" data-testid="quick-ai-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-slate-900">Ask AI Assistant</p>
                      <p className="text-sm text-slate-500">Get instant insights about your store</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask a question about your store..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      className="flex-1"
                      data-testid="quick-question-input"
                    />
                    <Button 
                      onClick={handleAskQuestion}
                      disabled={asking || !question.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      data-testid="quick-ask-btn"
                    >
                      {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto space-y-4 animate-fade-in" data-testid="chat-content">
              {/* Sample Questions */}
              {conversation.length === 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      Try asking...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSampleQuestion(q)}
                        className="p-3 text-left text-sm bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                        data-testid={`sample-question-${i}`}
                      >
                        "{q}"
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Conversation */}
              <Card className="border-slate-200">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {conversation.map((msg, i) => (
                      <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={msg.type === 'user' ? 'message-user' : 'message-ai'}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          {msg.confidence && (
                            <p className={`text-xs mt-2 confidence-${msg.confidence}`}>
                              Confidence: {msg.confidence}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {asking && (
                      <div className="flex justify-start">
                        <div className="message-ai flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing your question...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t border-slate-200">
                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <Input 
                      ref={chatInputRef}
                      placeholder="Ask anything about your store..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1"
                      disabled={asking}
                      data-testid="chat-input"
                    />
                    <Button 
                      type="submit"
                      disabled={asking || !question.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      data-testid="chat-send-btn"
                    >
                      {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="max-w-3xl mx-auto animate-fade-in" data-testid="history-content">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Recent Questions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {questionHistory.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {questionHistory.map((item, i) => (
                        <div key={i} className="question-item" data-testid={`history-item-${i}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 mb-1">{item.question}</p>
                              <p className="text-sm text-slate-600 line-clamp-2">{item.answer}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <Badge variant="outline" className={`confidence-${item.confidence}`}>
                                {item.confidence}
                              </Badge>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No questions asked yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab("chat")}
                        className="text-indigo-600"
                      >
                        Start asking questions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
