import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Calendar, Users, Car, Star, Search, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const FindRides = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<any[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [driverRatings, setDriverRatings] = useState<Record<string, { average_rating: number; total_ratings: number }>>({});

  useEffect(() => { fetchRides(); }, []);
  useEffect(() => { if (rides.length > 0) fetchDriverRatings(); }, [rides]);

  const fetchDriverRatings = async () => {
    const driverIds = rides.map(r => r.driver_id).filter(Boolean);
    if (!driverIds.length) return;
    const { data, error } = await supabase.from("driver_ratings").select("*").in("driver_id", driverIds);
    if (!error && data) {
      const map: Record<string, any> = {};
      data.forEach((r: any) => { map[r.driver_id] = r; });
      setDriverRatings(map);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const fetchRides = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select(`*, driver:profiles!rides_driver_id_fkey(full_name, photo_url, phone_number)`)
      .eq("status", "scheduled")
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load rides", variant: "destructive" });
    } else {
      let processed = data || [];
      if (searchLat && searchLng) {
        processed = processed.map(r => ({ ...r, distance: calculateDistance(searchLat, searchLng, r.end_lat, r.end_lng) }))
          .sort((a, b) => a.distance - b.distance);
      }
      setRides(processed);
    }
    setLoading(false);
  };

  const handleSearchGeocode = async () => {
    if (!searchLocation.trim()) {
      toast({ title: "Enter a location", description: "Please enter a destination to search", variant: "destructive" });
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`);
      const data = await res.json();
      if (data?.length > 0) {
        setSearchLat(parseFloat(data[0].lat));
        setSearchLng(parseFloat(data[0].lon));
        toast({ title: "Location found!", description: `Searching rides near ${searchLocation}` });
        await fetchRides();
      } else {
        toast({ title: "Location not found", description: "Could not find coordinates for this location", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to search location", variant: "destructive" });
    } finally { setGeocoding(false); }
  };

  const handleRequestRide = async (rideId: string, rideStartLat: number, rideStartLng: number, rideEndLat: number, rideEndLng: number) => {
    setRequesting(rideId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profile } = await supabase.from("profiles").select("primary_location_lat, primary_location_lng, primary_location_address").eq("id", session.user.id).single();

    const pickupLat = profile?.primary_location_lat || searchLat || rideStartLat;
    const pickupLng = profile?.primary_location_lng || searchLng || rideStartLng;
    const distanceKm = calculateDistance(pickupLat, pickupLng, rideEndLat, rideEndLng);
    const fareAmount = Math.round(distanceKm * 8);

    const { error } = await supabase.from("ride_requests").insert({
      ride_id: rideId,
      passenger_id: session.user.id,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      pickup_address: profile?.primary_location_address || searchLocation || "To be set",
      distance_km: distanceKm,
      fare_amount: fareAmount,
      payment_status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Sent! 🎉", description: `Estimated fare: ₹${fareAmount} for ${distanceKm.toFixed(1)} km` });
      fetchRides();
    }
    setRequesting(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Finding available rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Find a Ride</h1>
          <p className="text-sm text-muted-foreground">Browse available rides from verified campus drivers</p>

          {/* Search Bar */}
          <div className="mt-4 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by destination..."
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearchGeocode()}
                className="pl-9 h-10 rounded-xl border-gray-200 bg-white focus:border-primary"
              />
            </div>
            <Button onClick={handleSearchGeocode} disabled={geocoding} className="h-10 px-4 rounded-xl btn-primary font-semibold">
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Search</>}
            </Button>
          </div>

          {searchLat && searchLng && (
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Sorted by distance from "{searchLocation}"
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {rides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="empty-state-title">No rides available right now</p>
            <p className="empty-state-desc text-muted-foreground">Check back soon — drivers post new rides regularly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">{rides.length} ride{rides.length !== 1 ? "s" : ""} available</p>

            {rides.map((ride, i) => {
              const rating = driverRatings[ride.driver_id];
              return (
                <div key={ride.id} className={`ride-card stagger-${Math.min(i+1,6)} animate-fadeInUp`}>
                  <div className="p-5">
                    {/* Driver row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {ride.driver?.photo_url ? (
                          <img src={ride.driver.photo_url} alt={ride.driver.full_name} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/15" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
                            {ride.driver?.full_name?.[0] || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-foreground">{ride.driver?.full_name || "Driver"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-semibold text-gray-700">{rating.average_rating}</span>
                                <span className="text-xs text-muted-foreground">({rating.total_ratings})</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">New driver</span>
                            )}
                            {ride.vehicle_model && (
                              <span className="text-xs text-muted-foreground">· {ride.vehicle_model}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="btn-primary h-9 px-4 font-semibold text-sm shrink-0"
                        onClick={() => handleRequestRide(ride.id, ride.start_lat, ride.start_lng, ride.end_lat, ride.end_lng)}
                        disabled={requesting === ride.id}
                      >
                        {requesting === ride.id
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Sending...</>
                          : <>Request <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>}
                      </Button>
                    </div>

                    {/* Route visualization */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <div className="flex gap-3 items-start">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <div className="route-dot-start" />
                          <div className="route-connector" style={{ minHeight: "20px" }} />
                          <div className="route-dot-end" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-foreground truncate pr-2">{ride.start_address}</p>
                            <span className="text-xs text-muted-foreground shrink-0">From</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground truncate pr-2">{ride.end_address}</p>
                            <span className="text-xs text-muted-foreground shrink-0">To</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDistanceToNow(new Date(ride.scheduled_time), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""} left
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(ride.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {ride.is_recurring && (
                        <div className="px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs font-semibold text-violet-700">
                          ♻️ Recurring
                        </div>
                      )}
                      {ride.distance && (
                        <div className="px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-xl text-xs font-semibold text-primary">
                          📍 {ride.distance.toFixed(1)} km away
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindRides;
