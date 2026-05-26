import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Leaf, Droplet, TreeDeciduous, Car, ArrowRight, TrendingUp } from "lucide-react";

const EcoImpact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [impact, setImpact] = useState({ totalDistance: 0, fuelSaved: 0, carbonReduced: 0, ridesShared: 0, ridesAsDriver: 0, ridesAsPassenger: 0 });

  useEffect(() => { fetchEcoImpact(); }, []);

  const fetchEcoImpact = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    try {
      const { data: driverRides, error: driverError } = await supabase
        .from("rides")
        .select(`*, ride_requests!inner(distance_km, status)`)
        .eq("driver_id", session.user.id).eq("status", "completed").eq("ride_requests.status", "accepted");

      const { data: passengerRequests, error: passengerError } = await supabase
        .from("ride_requests")
        .select(`*, ride:rides!inner(status)`)
        .eq("passenger_id", session.user.id).eq("status", "accepted").eq("ride.status", "completed");

      if (driverError) console.error("Driver rides error:", driverError);
      if (passengerError) console.error("Passenger rides error:", passengerError);

      let totalDistance = 0, ridesAsDriver = 0, ridesAsPassenger = 0;

      if (driverRides?.length) {
        driverRides.forEach(ride => {
          if (ride.ride_requests?.length) {
            ride.ride_requests.forEach((req: any) => { if (req.distance_km) totalDistance += req.distance_km; });
            ridesAsDriver++;
          }
        });
      }

      if (passengerRequests?.length) {
        passengerRequests.forEach(req => {
          if (req.distance_km) totalDistance += req.distance_km;
          ridesAsPassenger++;
        });
      }

      const fuelSaved = totalDistance * 0.08 * 0.5;
      const carbonReduced = fuelSaved * 2.3;

      setImpact({ totalDistance, fuelSaved, carbonReduced, ridesShared: ridesAsDriver + ridesAsPassenger, ridesAsDriver, ridesAsPassenger });

      if (totalDistance === 0) {
        const { data: ecoData, error: ecoError } = await supabase.from("eco_impact").select("*").eq("user_id", session.user.id);
        if (!ecoError && ecoData?.length) {
          const totals = ecoData.reduce((acc, curr) => ({
            totalDistance: acc.totalDistance + (curr.distance_shared_km || 0),
            fuelSaved: acc.fuelSaved + (curr.fuel_saved_liters || 0),
            carbonReduced: acc.carbonReduced + (curr.carbon_reduced_kg || 0),
            ridesShared: acc.ridesShared + 1,
          }), { totalDistance: 0, fuelSaved: 0, carbonReduced: 0, ridesShared: 0 });
          setImpact({ ...totals, ridesAsDriver: 0, ridesAsPassenger: 0 });
        }
      }
    } catch (error) {
      console.error("Error calculating eco impact:", error);
      toast({ title: "Error", description: "Failed to calculate eco impact", variant: "destructive" });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = impact.ridesShared > 0;

  const statCards = [
    {
      icon: Droplet,
      value: `${impact.fuelSaved.toFixed(1)} L`,
      label: "Fuel Saved",
      sub: `₹${(impact.fuelSaved * 100).toFixed(0)} saved in fuel costs`,
      gradientClass: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      icon: TreeDeciduous,
      value: `${impact.carbonReduced.toFixed(1)} kg`,
      label: "CO₂ Reduced",
      sub: `≈ ${(impact.carbonReduced / 20).toFixed(1)} trees worth`,
      gradientClass: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      icon: Car,
      value: `${impact.totalDistance.toFixed(0)} km`,
      label: "Distance Shared",
      sub: `Across ${impact.ridesShared} shared rides`,
      gradientClass: "from-violet-500 to-violet-600",
      bg: "bg-violet-50",
      textColor: "text-violet-700",
    },
    {
      icon: TrendingUp,
      value: impact.ridesShared.toString(),
      label: "Total Rides",
      sub: "Building a sustainable campus",
      gradientClass: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero" style={{ background: "linear-gradient(135deg, hsl(152, 60%, 94%) 0%, white 55%)" }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-eco flex items-center justify-center shadow-md">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Your Eco Impact</h1>
              <p className="text-sm text-muted-foreground">Every shared ride makes a difference 🌱</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {!hasData ? (
          /* ── Empty State ── */
          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-eco" />
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-eco flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <Leaf className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Start Your Eco Journey</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                  Complete your first shared ride to see your environmental impact. Every kilometer counts!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="btn-primary font-semibold" onClick={() => navigate("/find-rides")}>
                    Find a Ride <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="font-semibold" onClick={() => navigate("/create-ride")}>
                    Offer a Ride
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Potential impact preview */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader>
                <CardTitle className="text-base font-bold text-emerald-800">🌍 Your Potential Impact</CardTitle>
                <CardDescription>If you share just 10 rides of 15 km each:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[{ v: "6 L", l: "Fuel saved" }, { v: "13.8 kg", l: "CO₂ reduced" }, { v: "0.7", l: "Trees equivalent" }].map(({ v, l }) => (
                    <div key={l} className="bg-white/70 rounded-2xl p-3 border border-emerald-100">
                      <p className="text-xl font-extrabold text-emerald-700">{v}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ── With Data ── */
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(145,78%,36%) 0%, hsl(158,79%,28%) 100%)" }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-5 w-5 text-emerald-200" />
                  <p className="font-bold text-emerald-100">Making a Difference</p>
                </div>
                <p className="text-3xl font-extrabold tracking-tight mb-1">
                  {impact.ridesShared} Shared Rides
                </p>
                <p className="text-emerald-200 text-sm">
                  🚗 {impact.ridesAsDriver} as driver · 👥 {impact.ridesAsPassenger} as passenger
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {statCards.map(({ icon: Icon, value, label, sub, gradientClass, bg, textColor }, i) => (
                <Card key={label} className={`border-0 shadow-sm overflow-hidden stagger-${i+1} animate-fadeInUp`}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-2xl font-extrabold tracking-tight ${textColor}`}>{value}</p>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Impact Breakdown</CardTitle>
                <CardDescription>Per-ride averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {[
                    { label: "Average distance per ride", value: `${impact.ridesShared > 0 ? (impact.totalDistance / impact.ridesShared).toFixed(1) : 0} km` },
                    { label: "CO₂ saved per ride",        value: `${impact.ridesShared > 0 ? (impact.carbonReduced / impact.ridesShared).toFixed(2) : 0} kg` },
                    { label: "Fuel saved per ride",       value: `${impact.ridesShared > 0 ? (impact.fuelSaved / impact.ridesShared).toFixed(2) : 0} L` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <span className="text-sm font-bold text-primary">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Keep It Up ── */}
        <Card className="mt-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Keep It Up! 🎯</CardTitle>
            <CardDescription>Every shared ride makes a difference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-sm font-semibold text-amber-800 mb-1">🎯 Your Next Goal</p>
              <p className="text-sm text-amber-700">
                {impact.ridesShared === 0 ? "Complete your first shared ride!" : `${10 - (impact.ridesShared % 10)} more rides to reach ${Math.ceil(impact.ridesShared / 10) * 10} total!`}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-1">🌍 Global Impact</p>
              <p className="text-sm text-blue-700">Join thousands of students reducing their carbon footprint through campus ride-sharing.</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-800 mb-1">💡 Did You Know?</p>
              <p className="text-sm text-emerald-700">If every student shared just one ride per week, campus carbon emissions could drop by 30%!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EcoImpact;
