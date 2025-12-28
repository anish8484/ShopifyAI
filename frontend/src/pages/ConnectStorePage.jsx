import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ShoppingBag, ArrowLeft, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConnectStorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopDomain: "",
    shopName: ""
  });

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!formData.shopDomain || !formData.shopName) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      // Simulate OAuth delay
      setStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Connect store
      const response = await axios.post(`${API}/stores/connect`, {
        shop_domain: formData.shopDomain.includes('.myshopify.com') 
          ? formData.shopDomain 
          : `${formData.shopDomain}.myshopify.com`,
        shop_name: formData.shopName
      });
      
      setStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Store connected successfully!");
      navigate(`/dashboard/${response.data.id}`);
      
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect store. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">ShopifyAI</span>
          </Link>
          
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-16">
        <Card className="border-slate-200 shadow-lg" data-testid="connect-card">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="font-heading text-2xl">Connect Your Store</CardTitle>
            <CardDescription>
              Link your Shopify store to start getting AI-powered insights
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {step === 1 && (
              <form onSubmit={handleConnect} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="shopDomain">Store Domain</Label>
                  <div className="flex">
                    <Input
                      id="shopDomain"
                      placeholder="your-store"
                      value={formData.shopDomain}
                      onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                      className="rounded-r-none"
                      data-testid="shop-domain-input"
                    />
                    <span className="inline-flex items-center px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-slate-500 text-sm">
                      .myshopify.com
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shopName">Store Name</Label>
                  <Input
                    id="shopName"
                    placeholder="My Awesome Store"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    data-testid="shop-name-input"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                  disabled={loading}
                  data-testid="submit-connect-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect with Shopify
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                
                <p className="text-center text-sm text-slate-500">
                  This is a demo with mock data. In production, this would redirect to Shopify OAuth.
                </p>
              </form>
            )}
            
            {step === 2 && (
              <div className="text-center py-8" data-testid="oauth-step">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="font-medium text-slate-900">Authenticating with Shopify...</p>
                <p className="text-sm text-slate-500 mt-2">This simulates the OAuth flow</p>
              </div>
            )}
            
            {step === 3 && (
              <div className="text-center py-8" data-testid="success-step">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-medium text-slate-900">Store Connected!</p>
                <p className="text-sm text-slate-500 mt-2">Generating sample data...</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Secure OAuth Connection</p>
                <p className="text-sm text-slate-500">Your credentials are never stored. We use Shopify's secure OAuth 2.0 flow.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Read-Only Access</p>
                <p className="text-sm text-slate-500">We only request read permissions for orders, products, and customers.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
