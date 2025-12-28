import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ConnectStorePage from "./pages/ConnectStorePage";
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/connect" element={<ConnectStorePage />} />
          <Route path="/dashboard/:storeId" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
