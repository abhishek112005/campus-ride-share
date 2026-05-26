import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Car, Users, Leaf, MapPin, PlusCircle, List, ArrowRight, Shield, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ totalRides: 0, pendingRequests: 0, completedRides: 0 });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      await Promise.all([fetchProfile(session.user.id), fetchStats(session.user.id), checkAdmin(session.user.id)]);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchStats = async (userId: string) => {
    const [ridesRes, requestsRes, completedRes] = await Promise.all([
      supabase.from("rides").select("id", { count: "exact" }).eq("driver_id", userId),
      supabase.from("ride_requests").select("id", { count: "exact" }).eq("passenger_id", userId).eq("status", "pending"),
      supabase.from("ride_requests").select("id", { count: "exact" }).eq("passenger_id", userId).eq("status", "accepted"),
    ]);
    setStats({
      totalRides: ridesRes.count || 0,
      pendingRequests: requestsRes.count || 0,
      completedRides: completedRes.count || 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.30)" }}>
            <Car className="h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isDriver = profile?.is_driver && profile?.approval_status === "approved";
  const isApproved = profile?.approval_status === "approved";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickActions = [
    { title: "Find a Ride",     desc: "Browse rides to your destination",       icon: Car,        gradient: "from-blue-500 to-blue-600",     path: "/find-rides",    show: isApproved },
    { title: "My Requests",     desc: "View ride requests and OTP codes",        icon: List,       gradient: "from-violet-500 to-violet-600", path: "/passenger-rides", show: isApproved },
    { title: "Create Ride",     desc: "Offer a ride to fellow students",         icon: PlusCircle, gradient: "from-emerald-500 to-teal-500",  path: "/create-ride",   show: isDriver },
    { title: "My Rides",        desc: "Manage passengers and requests",          icon: MapPin,     gradient: "from-orange-500 to-red-500",    path: "/my-rides",      show: isDriver },
    { title: "Eco Impact",      desc: "Your carbon & fuel savings",              icon: Leaf,       gradient: "from-green-500 to-emerald-500", path: "/eco-impact",    show: isApproved },
    { title: "Admin Panel",     desc: "Manage users, drivers and approvals",     icon: Shield,     gradient: "from-red-500 to-rose-600",      path: "/admin",         show: isAdmin },
  ].filter(a => a.show);

  const statItems = [
    ...(isDriver ? [{ label: "Rides Created", value: stats.totalRides, icon: Car, color: "text-blue-600", bg: "bg-blue-50" }] : []),
    { label: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Accepted Rides",   value: stats.completedRides,  icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-0.5">{greeting} 👋</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Welcome back, <span className="gradient-text">{firstName}!</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? "You have admin access to the platform." : isDriver ? "Ready to offer rides today?" : "Looking for a ride? Let's go."}
              </p>
            </div>

            {/* Quick stat chips */}
            <div className="flex gap-3 flex-wrap">
              {statItems.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-gray-900 leading-none">{value}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Status Alerts ── */}
        {profile?.approval_status === "pending" && (
          <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Account Pending Approval</p>
              <p className="text-amber-600 text-xs mt-0.5">Your profile is being reviewed by our admin team. You'll be notified once approved — usually within 24 hours.</p>
            </div>
          </div>
        )}

        {profile?.approval_status === "rejected" && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">Profile Not Approved</p>
              <p className="text-red-600 text-xs mt-0.5">Your profile was not approved. Please contact campus administration for assistance.</p>
            </div>
          </div>
        )}

        {/* ── Quick Actions Grid ── */}
        {quickActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map(({ title, desc, icon: Icon, gradient, path }, i) => (
                <div
                  key={path}
                  className={`action-card p-5 stagger-${i+1} animate-fadeInUp`}
                  onClick={() => navigate(path)}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Getting Started / Checklist ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isApproved ? "Quick Links" : "Getting Started"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isApproved ? "Jump to where you need to go" : "Complete your setup to start sharing rides"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {!profile?.primary_location_address && (
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Set your primary location</p>
                    <p className="text-xs text-muted-foreground">Used for accurate fare calculation</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary hover:text-primary" onClick={() => navigate("/profile")}>
                  Set up <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}

            {!profile?.is_driver && isApproved && (
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Become a Driver</p>
                    <p className="text-xs text-muted-foreground">Upload license and earn by sharing rides</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={() => navigate("/become-driver")}>
                  Apply <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}

            {isApproved && (
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Check your Eco Impact</p>
                    <p className="text-xs text-muted-foreground">See your carbon & fuel savings</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => navigate("/eco-impact")}>
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}

            {!isApproved && profile?.approval_status !== "pending" && (
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Complete your profile</p>
                    <p className="text-xs text-muted-foreground">Add your details for admin review</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary" onClick={() => navigate("/profile")}>
                  Go <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
