import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle, XCircle, Users, Car, Clock, Shield,
  UserCheck, AlertCircle, FileText, Search, Bell, MapPin,
  Calendar, TrendingUp, Activity, RotateCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allRides, setAllRides] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0, totalDrivers: 0, totalRides: 0, completedRides: 0, activeRides: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [approving, setApproving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAdminStatus();

    // Realtime: re-fetch on any profile change
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchPendingApprovals(); fetchAllUsers(); fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_details" }, () => {
        fetchPendingApprovals(); fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => {
        fetchAllRides(); fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    const { data: roles } = await supabase
      .from("user_roles").select("*").eq("user_id", session.user.id).eq("role", "admin").single();

    if (!roles) {
      toast({ title: "Access Denied", description: "You don't have admin permissions", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    await Promise.all([fetchPendingApprovals(), fetchAllUsers(), fetchStats(), fetchAllRides()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [usersRes, pendingRes, driversRes, ridesRes, completedRes, activeRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }).eq("approval_status", "pending"),
      supabase.from("profiles").select("id", { count: "exact" }).eq("is_driver", true).eq("approval_status", "approved"),
      supabase.from("rides").select("id", { count: "exact" }),
      supabase.from("rides").select("id", { count: "exact" }).eq("status", "completed"),
      supabase.from("rides").select("id", { count: "exact" }).eq("status", "active"),
    ]);
    setStats({
      totalUsers: usersRes.count || 0,
      pendingUsers: pendingRes.count || 0,
      totalDrivers: driversRes.count || 0,
      totalRides: ridesRes.count || 0,
      completedRides: completedRes.count || 0,
      activeRides: activeRes.count || 0,
    });
  };

  const fetchPendingApprovals = async () => {
    const { data: profiles } = await supabase
      .from("profiles").select("*").eq("approval_status", "pending").order("created_at", { ascending: false });
    setPendingProfiles(profiles || []);

    const { data: drivers } = await supabase
      .from("driver_details")
      .select(`*, profile:profiles(full_name, email, phone_number)`)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    setPendingDrivers(drivers || []);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setAllUsers(data || []);
  };

  const fetchAllRides = async () => {
    const { data } = await supabase
      .from("rides")
      .select(`*, driver:profiles!rides_driver_id_fkey(full_name, email)`)
      .order("scheduled_time", { ascending: false })
      .limit(50);
    setAllRides(data || []);
  };

  const handleProfileApproval = async (profileId: string, status: "approved" | "rejected") => {
    setApproving(profileId);
    const { error } = await supabase.from("profiles").update({ approval_status: status }).eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: status === "approved" ? "User approved ✅" : "User rejected",
        description: status === "approved" ? "They can now access the platform." : "User has been denied access.",
      });
      fetchPendingApprovals(); fetchAllUsers(); fetchStats();
    }
    setApproving(null);
  };

  const handleDriverApproval = async (driverId: string, userId: string, status: "approved" | "rejected") => {
    setApproving(driverId);
    const { error } = await supabase.from("driver_details").update({ approval_status: status }).eq("id", driverId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (status === "approved") {
        await supabase.from("profiles").update({ approval_status: "approved", is_driver: true }).eq("id", userId);
      }
      toast({
        title: status === "approved" ? "Driver approved ✅" : "Application rejected",
        description: status === "approved" ? "They can now create rides." : "Driver application has been declined.",
      });
      fetchPendingApprovals(); fetchAllUsers(); fetchStats();
    }
    setApproving(null);
  };

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !userSearch || [u.full_name, u.email, u.phone_number].some(f => f?.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesFilter = userFilter === "all" || u.approval_status === userFilter;
    return matchesSearch && matchesFilter;
  });

  const rideStatusStyle = (s: string) =>
    s === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    s === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
    s === "completed" ? "bg-gray-100 text-gray-600 border-gray-200" :
    "bg-red-50 text-red-600 border-red-200";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPending = pendingProfiles.length + pendingDrivers.length;

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero" style={{ background: "linear-gradient(135deg, hsl(222, 30%, 94%) 0%, white 60%)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage users, drivers and platform activity</p>
              </div>
            </div>
            {totalPending > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                <Bell className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="text-sm font-bold text-amber-700">{totalPending} item{totalPending !== 1 ? "s" : ""} need review</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Users",    value: stats.totalUsers,      icon: Users,      grad: "from-blue-500 to-blue-600",    text: "text-blue-700" },
            { label: "Pending",        value: stats.pendingUsers,    icon: Clock,      grad: "from-amber-500 to-orange-500", text: "text-amber-700" },
            { label: "Drivers",        value: stats.totalDrivers,    icon: Car,        grad: "from-emerald-500 to-green-600",text: "text-emerald-700" },
            { label: "Total Rides",    value: stats.totalRides,      icon: TrendingUp, grad: "from-violet-500 to-violet-600",text: "text-violet-700" },
            { label: "Active Now",     value: stats.activeRides,     icon: Activity,   grad: "from-rose-500 to-rose-600",    text: "text-rose-700" },
            { label: "Completed",      value: stats.completedRides,  icon: CheckCircle,grad: "from-teal-500 to-teal-600",   text: "text-teal-700" },
          ].map(({ label, value, icon: Icon, grad, text }, i) => (
            <Card key={label} className={`border-0 shadow-sm overflow-hidden stagger-${i+1} animate-fadeInUp`}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm mb-2`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className={`text-xl font-extrabold tracking-tight ${text}`}>{value}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-11 rounded-2xl bg-gray-100 p-1 w-full grid grid-cols-4">
            {[
              { value: "overview", label: "Overview",   icon: Shield,       badge: totalPending },
              { value: "users",    label: "Users",      icon: Users,        badge: 0 },
              { value: "drivers",  label: "Drivers",    icon: Car,          badge: pendingDrivers.length },
              { value: "rides",    label: "Rides",      icon: MapPin,       badge: 0 },
            ].map(({ value, label, icon: Icon, badge }) => (
              <TabsTrigger key={value} value={value}
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {badge > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ══════════════════════ OVERVIEW TAB ══════════════════════ */}
          <TabsContent value="overview" className="mt-5 space-y-6">

            {/* Urgent: pending users */}
            {pendingProfiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                    Pending User Approvals ({pendingProfiles.length})
                  </h2>
                  <button onClick={() => setActiveTab("users")} className="text-xs text-primary font-semibold hover:underline">View all →</button>
                </div>
                <div className="space-y-2.5">
                  {pendingProfiles.slice(0, 5).map(profile => (
                    <Card key={profile.id} className="border-0 shadow-sm overflow-hidden">
                      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                      <CardContent className="pt-3.5 pb-3.5 px-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {profile.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm">{profile.full_name || "—"}</p>
                                {profile.user_type && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold capitalize">{profile.user_type}</span>
                                )}
                                {profile.current_year && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Year {profile.current_year}</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{profile.email}</p>
                              {profile.phone_number && <p className="text-xs text-muted-foreground">📞 {profile.phone_number}</p>}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Registered {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm"
                              disabled={approving === profile.id}
                              className="h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                              onClick={() => handleProfileApproval(profile.id, "approved")}>
                              {approving === profile.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>}
                            </Button>
                            <Button size="sm" variant="outline"
                              disabled={approving === profile.id}
                              className="h-8 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                              onClick={() => handleProfileApproval(profile.id, "rejected")}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {pendingProfiles.length > 5 && (
                    <button onClick={() => setActiveTab("users")} className="w-full text-center text-sm text-primary font-semibold py-2 hover:underline">
                      + {pendingProfiles.length - 5} more pending users
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Urgent: pending drivers */}
            {pendingDrivers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                    Pending Driver Applications ({pendingDrivers.length})
                  </h2>
                  <button onClick={() => setActiveTab("drivers")} className="text-xs text-primary font-semibold hover:underline">View all →</button>
                </div>
                <div className="space-y-2.5">
                  {pendingDrivers.slice(0, 3).map(driver => (
                    <Card key={driver.id} className="border-0 shadow-sm overflow-hidden">
                      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" />
                      <CardContent className="pt-3.5 pb-3.5 px-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                              <Car className="h-4.5 w-4.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{driver.profile?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{driver.profile?.email}</p>
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                <span>License: <span className="font-medium text-foreground">{driver.license_number}</span></span>
                                {driver.vehicle_model && <span>· {driver.vehicle_model}</span>}
                              </div>
                              <div className="flex gap-2 mt-1.5">
                                {driver.license_photo_url && (
                                  <a href={driver.license_photo_url} target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-primary flex items-center gap-0.5 hover:underline">
                                    <FileText className="h-3 w-3" /> License
                                  </a>
                                )}
                                {driver.confirmation_letter_url && (
                                  <a href={driver.confirmation_letter_url} target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-primary flex items-center gap-0.5 hover:underline">
                                    <FileText className="h-3 w-3" /> Letter
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm"
                              disabled={approving === driver.id}
                              className="h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                              onClick={() => handleDriverApproval(driver.id, driver.user_id, "approved")}>
                              {approving === driver.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>}
                            </Button>
                            <Button size="sm" variant="outline"
                              disabled={approving === driver.id}
                              className="h-8 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                              onClick={() => handleDriverApproval(driver.id, driver.user_id, "rejected")}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {totalPending === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-14 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-base font-bold mb-1">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No pending approvals — you're on top of it.</p>
                </CardContent>
              </Card>
            )}

            {/* Recent rides snapshot */}
            {allRides.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold">Recent Rides</h2>
                  <button onClick={() => setActiveTab("rides")} className="text-xs text-primary font-semibold hover:underline">View all →</button>
                </div>
                <div className="space-y-2">
                  {allRides.slice(0, 4).map(ride => (
                    <div key={ride.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {ride.driver?.full_name?.[0] || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{ride.start_address} → {ride.end_address}</p>
                          <p className="text-[11px] text-muted-foreground">{ride.driver?.full_name} · {formatDistanceToNow(new Date(ride.scheduled_time), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ml-3 shrink-0 ${rideStatusStyle(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════ USERS TAB ══════════════════════ */}
          <TabsContent value="users" className="mt-5 space-y-4">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-gray-200"
                />
              </div>
              <div className="flex gap-1.5">
                {(["all", "pending", "approved", "rejected"] as const).map(f => (
                  <button key={f} onClick={() => setUserFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      userFilter === f
                        ? f === "pending" ? "bg-amber-500 text-white border-amber-500" :
                          f === "approved" ? "bg-emerald-500 text-white border-emerald-500" :
                          f === "rejected" ? "bg-red-500 text-white border-red-500" :
                          "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-muted-foreground border-gray-200 hover:border-gray-300"
                    }`}>
                    {f}
                    {f !== "all" && (
                      <span className="ml-1">
                        ({allUsers.filter(u => u.approval_status === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-medium">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</p>

            <div className="space-y-2.5">
              {filteredUsers.map((user, i) => (
                <Card key={user.id} className={`border-0 shadow-sm stagger-${Math.min(i+1, 6)} animate-fadeInUp`}>
                  <CardContent className="pt-3.5 pb-3.5 px-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {user.photo_url ? (
                          <img src={user.photo_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {user.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">{user.full_name || "—"}</p>
                            {user.user_type && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold capitalize">{user.user_type}</span>
                            )}
                            {user.is_driver && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-semibold">Driver</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.phone_number && <p className="text-xs text-muted-foreground">📞 {user.phone_number}</p>}
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Joined {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          user.approval_status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          user.approval_status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {user.approval_status}
                        </span>
                        {user.approval_status === "pending" && (
                          <>
                            <Button size="sm" disabled={approving === user.id}
                              className="h-7 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                              onClick={() => handleProfileApproval(user.id, "approved")}>
                              {approving === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserCheck className="h-3 w-3 mr-1" />Approve</>}
                            </Button>
                            <Button size="sm" variant="outline" disabled={approving === user.id}
                              className="h-7 px-2.5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                              onClick={() => handleProfileApproval(user.id, "rejected")}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {user.approval_status === "rejected" && (
                          <Button size="sm" variant="outline" disabled={approving === user.id}
                            className="h-7 px-3 rounded-xl text-xs font-bold"
                            onClick={() => handleProfileApproval(user.id, "approved")}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Restore
                          </Button>
                        )}
                        {user.approval_status === "approved" && (
                          <Button size="sm" variant="outline" disabled={approving === user.id}
                            className="h-7 px-3 rounded-xl text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleProfileApproval(user.id, "rejected")}>
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No users match your search or filter.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══════════════════════ DRIVERS TAB ══════════════════════ */}
          <TabsContent value="drivers" className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">
                {pendingDrivers.length > 0
                  ? `${pendingDrivers.length} application${pendingDrivers.length !== 1 ? "s" : ""} awaiting review`
                  : "Driver Applications"}
              </p>
            </div>

            {pendingDrivers.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-14 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-base font-bold mb-1">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No pending driver applications</p>
                </CardContent>
              </Card>
            ) : (
              pendingDrivers.map((driver, i) => (
                <Card key={driver.id} className={`border-0 shadow-sm overflow-hidden stagger-${Math.min(i+1,6)} animate-fadeInUp`}>
                  <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" />
                  <CardContent className="pt-4 pb-5 px-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{driver.profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground mb-3">{driver.profile?.email}</p>

                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-3">
                            <div><span className="font-semibold text-foreground">License #</span><br /><span className="text-muted-foreground">{driver.license_number}</span></div>
                            <div><span className="font-semibold text-foreground">Parent Phone</span><br /><span className="text-muted-foreground">{driver.parent_phone_number}</span></div>
                            {driver.vehicle_model && (
                              <div><span className="font-semibold text-foreground">Vehicle</span><br /><span className="text-muted-foreground">{driver.vehicle_model} {driver.vehicle_number && `· ${driver.vehicle_number}`}</span></div>
                            )}
                            {driver.vehicle_type && (
                              <div><span className="font-semibold text-foreground">Type</span><br /><span className="text-muted-foreground capitalize">{driver.vehicle_type.replace("_", " ")}</span></div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {driver.license_photo_url && (
                              <a href={driver.license_photo_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/15 transition-colors">
                                <FileText className="h-3.5 w-3.5" /> View License
                              </a>
                            )}
                            {driver.confirmation_letter_url && (
                              <a href={driver.confirmation_letter_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/15 transition-colors">
                                <FileText className="h-3.5 w-3.5" /> View Letter
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm"
                          disabled={approving === driver.id}
                          className="h-9 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                          onClick={() => handleDriverApproval(driver.id, driver.user_id, "approved")}>
                          {approving === driver.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve Driver</>}
                        </Button>
                        <Button size="sm" variant="outline"
                          disabled={approving === driver.id}
                          className="h-9 px-5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                          onClick={() => handleDriverApproval(driver.id, driver.user_id, "rejected")}>
                          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ══════════════════════ RIDES TAB ══════════════════════ */}
          <TabsContent value="rides" className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Last {allRides.length} rides</p>
            {allRides.map((ride, i) => (
              <Card key={ride.id} className={`border-0 shadow-sm overflow-hidden stagger-${Math.min(i+1,6)} animate-fadeInUp`}>
                <div className={`h-1 w-full ${
                  ride.status === "active" ? "bg-gradient-eco" :
                  ride.status === "scheduled" ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                  ride.status === "completed" ? "bg-gray-200" : "bg-red-200"
                }`} />
                <CardContent className="pt-3.5 pb-3.5 px-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {ride.driver?.full_name?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{ride.start_address} → {ride.end_address}</p>
                        <p className="text-xs text-muted-foreground">{ride.driver?.full_name || "Unknown driver"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ride.scheduled_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                          <span>{ride.available_seats} seats</span>
                          {ride.is_recurring && <span className="text-violet-600 font-medium">♻️ Recurring</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border capitalize shrink-0 ${rideStatusStyle(ride.status)}`}>
                      {ride.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {allRides.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No rides yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
