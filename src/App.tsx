import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import RideDemo from "./pages/RideDemo";
import Profile from "./pages/Profile";
import BecomeDriver from "./pages/BecomeDriver";
import FindRides from "./pages/FindRides";
import CreateRide from "./pages/CreateRide";
import AdminDashboard from "./pages/AdminDashboard";
import EcoImpact from "./pages/EcoImpact";
import NotFound from "./pages/NotFound";
import MyRides from "./pages/MyRides";
import LiveTracking from "./pages/LiveTracking";
import PassengerRides from "./pages/PassengerRides";
import ParentTracking from "./pages/ParentTracking";
import "./App.css";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public pages — no Navbar */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />

          {/* Full-screen map views — no Navbar */}
          <Route path="/live-tracking/:rideId" element={<LiveTracking />} />
          <Route path="/parent-tracking/:rideId" element={<ParentTracking />} />

          {/* App pages — wrapped with Navbar */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/become-driver" element={<Layout><BecomeDriver /></Layout>} />
          <Route path="/find-rides" element={<Layout><FindRides /></Layout>} />
          <Route path="/create-ride" element={<Layout><CreateRide /></Layout>} />
          <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/eco-impact" element={<Layout><EcoImpact /></Layout>} />
          <Route path="/ride-demo" element={<Layout><RideDemo /></Layout>} />
          <Route path="/my-rides" element={<Layout><MyRides /></Layout>} />
          <Route path="/passenger-rides" element={<Layout><PassengerRides /></Layout>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
