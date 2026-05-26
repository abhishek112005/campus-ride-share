import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Calendar, Users, CheckCircle, XCircle, Play, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MyRides = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => { fetchMyRides(); }, []);

  const fetchMyRides = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: driverRides, error: ridesError } = await supabase
      .from("rides").select("*").eq("driver_id", session.user.id).order("scheduled_time", { ascending: false });

    if (ridesError) { console.error(ridesError); } else {
      setRides(driverRides || []);
      const rideIds = driverRides?.map(r => r.id) || [];
      if (rideIds.length > 0) {
        const { data: requests, error: reqErr } = await supabase
          .from("ride_requests")
          .select(`*, passenger:profiles!ride_requests_passenger_id_fkey(full_name, photo_url, phone_number, parent_phone_number)`)
          .in("ride_id", rideIds);
        if (!reqErr) setRideRequests(requests || []);
      }
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (requestId: string, rideId: string) => {
    const otp = Math.floor(10 + Math.random() * 90).toString();
    const { error } = await supabase.from("ride_requests").update({ status: "accepted", otp }).eq("id", requestId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const ride = rides.find(r => r.id === rideId);
    if (ride?.available_seats > 0) {
      await supabase.from("rides").update({ available_seats: ride.available_seats - 1 }).eq("id", rideId);
    }

    toast({ title: "Request accepted! ✅", description: "Passenger received their OTP. Verify before starting the ride." });
    fetchMyRides();
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase.from("ride_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request rejected" });
    fetchMyRides();
  };

  const handleStartRide = (ride: any) => {
    setSelectedRide(ride);
    setOtp("");
    setShowOtpDialog(true);
  };

  const handleOtpSubmit = async () => {
    const acceptedRequests = rideRequests.filter(r => r.ride_id === selectedRide.id && r.status === "accepted");
    const expectedOtp = acceptedRequests.map(r => r.otp).join("");
    if (otp === expectedOtp) {
      setShowOtpDialog(false);
      try {
        for (const request of acceptedRequests) {
          if (request.passenger?.parent_phone_number) {
            const trackingUrl = `${window.location.origin}/live-tracking/${selectedRide.id}`;
            await supabase.functions.invoke("send-location-sms", {
              body: { phoneNumber: request.passenger.parent_phone_number, rideId: selectedRide.id, driverName: "Driver", trackingUrl },
            });
          }
        }
      } catch (e) { console.error("SMS error:", e); }
      navigate(`/live-tracking/${selectedRide.id}`);
    } else {
      toast({ title: "Invalid OTP", description: `Please enter the correct ${expectedOtp.length}-digit OTP`, variant: "destructive" });
    }
  };

  const statusStyle = (s: string) =>
    s === "scheduled" ? "bg-blue-50 text-blue-700 border border-blue-200"
    : s === "active"  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-gray-100 text-gray-600 border border-gray-200";

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
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-2xl font-extrabold tracking-tight">My Rides</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your rides and passenger requests</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {rides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="empty-state-title">No rides yet</p>
            <p className="empty-state-desc text-muted-foreground mb-4">Create your first ride to start sharing and earning.</p>
            <Button className="btn-primary font-semibold" onClick={() => navigate("/create-ride")}>
              Create Your First Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {rides.map((ride, i) => {
              const requests = rideRequests.filter(r => r.ride_id === ride.id);
              const acceptedCount = requests.filter(r => r.status === "accepted").length;
              return (
                <Card key={ride.id} className={`border-0 shadow-sm overflow-hidden stagger-${Math.min(i+1,6)} animate-fadeInUp`}>
                  {/* Colored top border by status */}
                  <div className={`h-1 w-full ${ride.status === "active" ? "bg-gradient-eco" : ride.status === "scheduled" ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gray-200"}`} />

                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-foreground text-sm">
                            {ride.start_address} → {ride.end_address}
                          </h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${statusStyle(ride.status)}`}>
                            {ride.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(ride.scheduled_time), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {ride.available_seats} seats
                          </span>
                          {acceptedCount > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle className="h-3 w-3" />
                              {acceptedCount} accepted
                            </span>
                          )}
                        </div>
                      </div>

                      {ride.status === "scheduled" && acceptedCount > 0 && (
                        <Button
                          onClick={() => handleStartRide(ride)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm h-9 px-4 rounded-xl shadow-sm"
                        >
                          <Play className="h-3.5 w-3.5 mr-1.5" /> Start Ride
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {requests.length > 0 && (
                    <CardContent className="px-5 pb-5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Passenger Requests</p>
                      <div className="space-y-2.5">
                        {requests.map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              {req.passenger?.photo_url ? (
                                <img src={req.passenger.photo_url} alt={req.passenger.full_name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                                  {req.passenger?.full_name?.[0] || "?"}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm">{req.passenger?.full_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5" /> {req.pickup_address}
                                </p>
                                {req.passenger?.phone_number && (
                                  <a href={`tel:${req.passenger.phone_number}`} className="text-xs text-primary flex items-center gap-1 mt-0.5">
                                    <Phone className="h-2.5 w-2.5" /> {req.passenger.phone_number}
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {req.status === "pending" ? (
                                <>
                                  <Button size="sm" className="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold" onClick={() => handleAcceptRequest(req.id, ride.id)}>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold" onClick={() => handleRejectRequest(req.id)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              ) : (
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${req.status === "accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                  {req.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── OTP Verification Dialog ── */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="max-w-md rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-primary p-6 text-white">
            <DialogTitle className="text-xl font-extrabold text-white mb-1">🔐 Verify Passengers</DialogTitle>
            <DialogDescription className="text-white/75 text-sm">
              Ask each passenger for their 2-digit code and enter them in order
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            {/* Passenger list */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Accepted Passengers</p>
              <div className="space-y-2">
                {rideRequests
                  .filter(r => r.ride_id === selectedRide?.id && r.status === "accepted")
                  .map((req, idx) => (
                    <div key={req.id} className="flex items-center gap-2.5 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-foreground">{req.passenger?.full_name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">2-digit code</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* OTP input */}
            <div>
              {(() => {
                const count = rideRequests.filter(r => r.ride_id === selectedRide?.id && r.status === "accepted").length;
                return (
                  <>
                    <Label className="text-sm font-bold mb-2 block">Combined OTP ({count * 2} digits)</Label>
                    <Input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      type="text"
                      maxLength={count * 2}
                      className="otp-input h-16 text-2xl text-center tracking-[0.4em] font-bold rounded-2xl border-2 border-gray-200 focus:border-primary"
                      placeholder={"·".repeat(count * 2)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {count} passenger{count !== 1 ? "s" : ""} × 2 digits = {count * 2} total digits
                    </p>
                  </>
                );
              })()}
            </div>

            <Button
              onClick={handleOtpSubmit}
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base"
              disabled={otp.length !== rideRequests.filter(r => r.ride_id === selectedRide?.id && r.status === "accepted").length * 2}
            >
              Verify & Start Ride 🚗
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyRides;
