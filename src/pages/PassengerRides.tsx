import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Calendar, Key, Car, Phone, Clock, List, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RidePayment } from "@/components/RidePayment";
import FeedbackForm from "@/components/FeedbackForm";
import SimpleMap from "@/components/SimpleMap";

const PassengerRides = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rideRequests, setRideRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchPassengerRides();

    const channel = supabase
      .channel("ride-requests-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, () => {
        fetchPassengerRides();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPassengerRides = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: requests, error } = await supabase
      .from("ride_requests")
      .select(`*, ride:rides(*, driver:profiles!rides_driver_id_fkey(full_name, photo_url, phone_number))`)
      .eq("passenger_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ride requests:", error);
      toast({ title: "Error", description: "Failed to load your ride requests", variant: "destructive" });
    } else {
      setRideRequests(requests || []);
    }
    setLoading(false);
  };

  const statusConfig = (status: string) => {
    if (status === "accepted") return { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-gradient-eco" };
    if (status === "pending")  return { label: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200",   bar: "bg-gradient-to-r from-amber-400 to-amber-500" };
    if (status === "rejected") return { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200",         bar: "bg-red-300" };
    return { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200", bar: "bg-gray-200" };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
              <List className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">My Requests</h1>
              <p className="text-sm text-muted-foreground">Track your ride bookings in real-time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {rideRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="empty-state-title">No ride requests yet</p>
            <p className="empty-state-desc">Find and request rides to get started on your commute.</p>
            <Button className="btn-primary font-semibold mt-4" onClick={() => navigate("/find-rides")}>
              Find a Ride <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground font-medium">
              {rideRequests.length} request{rideRequests.length !== 1 ? "s" : ""}
            </p>

            {rideRequests.map((request, i) => {
              const { label, cls, bar } = statusConfig(request.status);
              const driver = request.ride?.driver;
              return (
                <Card key={request.id} className={`border-0 shadow-sm overflow-hidden stagger-${Math.min(i+1,6)} animate-fadeInUp`}>
                  {/* Status-colored top border */}
                  <div className={`h-1 w-full ${bar}`} />

                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm text-foreground truncate">
                            {request.ride?.start_address} → {request.ride?.end_address}
                          </h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${cls} shrink-0`}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </span>
                          {request.ride?.scheduled_time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.ride.scheduled_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          )}
                          {request.pickup_address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="h-3 w-3 shrink-0" /> {request.pickup_address}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fare chip */}
                      {request.fare_amount && (
                        <div className="shrink-0 px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-xl text-sm font-bold text-primary">
                          ₹{request.fare_amount}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 space-y-4">
                    {/* Driver info */}
                    {driver && (
                      <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        {driver.photo_url ? (
                          <img src={driver.photo_url} alt={driver.full_name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {driver.full_name?.[0] || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{driver.full_name}</p>
                          <p className="text-xs text-muted-foreground">Your driver</p>
                        </div>
                        {request.status === "accepted" && driver.phone_number && (
                          <a
                            href={`tel:${driver.phone_number}`}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/15 transition-colors"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        )}
                      </div>
                    )}

                    {/* OTP card */}
                    {request.status === "accepted" && request.otp && (
                      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-primary/4 p-5">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-primary" style={{ transform: "translate(30%, -30%)" }} />
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md shrink-0">
                            <Key className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Your Ride OTP</p>
                            <p className="text-4xl font-extrabold text-primary tracking-[0.2em]">{request.otp}</p>
                            <p className="text-xs text-muted-foreground mt-1">Show this to your driver when they arrive</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment */}
                    {request.distance_km && request.status === "accepted" && (
                      <RidePayment
                        rideRequestId={request.id}
                        distanceKm={request.distance_km}
                        onPaymentComplete={() => fetchPassengerRides()}
                      />
                    )}

                    {/* Map */}
                    {request.status === "accepted" && request.ride?.start_lat && request.ride?.end_lat && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary" /> Route Map
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-gray-100">
                          <SimpleMap
                            start={[request.ride.start_lat, request.ride.start_lng]}
                            end={[request.ride.end_lat, request.ride.end_lng]}
                            simulateMovement={false}
                            height={220}
                          />
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {request.ride?.status === "completed" && (
                      <div className="pt-1">
                        <FeedbackForm
                          rideId={request.ride.id}
                          onSubmitSuccess={() => {
                            toast({ title: "Thank you!", description: "Your feedback has been submitted" });
                            fetchPassengerRides();
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerRides;
