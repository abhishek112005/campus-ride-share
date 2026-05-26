import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Car, User, LogOut, LayoutDashboard, Search, PlusCircle,
  List, Leaf, Shield, Menu, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(p);

      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setProfile(null);
        setIsAdmin(false);
      } else {
        load();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;
  const isDriver = profile?.is_driver && profile?.approval_status === "approved";
  const isApproved = profile?.approval_status === "approved";

  const navLinks = [
    { path: "/dashboard",      label: "Dashboard",   icon: LayoutDashboard, show: true },
    { path: "/find-rides",     label: "Find Ride",   icon: Search,          show: isApproved },
    { path: "/passenger-rides",label: "Requests",    icon: List,            show: isApproved },
    { path: "/create-ride",    label: "Create Ride", icon: PlusCircle,      show: isDriver },
    { path: "/my-rides",       label: "My Rides",    icon: Car,             show: isDriver },
    { path: "/eco-impact",     label: "Eco Impact",  icon: Leaf,            show: isApproved },
    { path: "/admin",          label: "Admin",       icon: Shield,          show: isAdmin },
  ].filter(l => l.show);

  const roleBadge = isAdmin
    ? { label: "Admin",     cls: "bg-red-50 text-red-700 border-red-200" }
    : isDriver
    ? { label: "Driver",    cls: "bg-blue-50 text-blue-700 border-blue-200" }
    : { label: "Passenger", cls: "bg-gray-100 text-gray-600 border-gray-200" };

  const initials = profile?.full_name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <nav className="sticky top-0 z-50 glass-header">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
              <Car className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="gradient-text hidden sm:block">RideMate</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive(path)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right: role badge + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role badge */}
            <span className={cn(
              "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
              roleBadge.cls
            )}>
              {roleBadge.label}
            </span>

            {/* Avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-1.5 h-9 rounded-xl hover:bg-accent">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt={profile.full_name} className="h-7 w-7 rounded-full object-cover ring-2 ring-primary/20" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {initials}
                    </div>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl border border-border/60 p-1.5">
                <DropdownMenuLabel className="font-normal py-2 px-2">
                  <p className="text-sm font-bold truncate">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl cursor-pointer text-sm font-medium">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" /> My Profile
                </DropdownMenuItem>

                {!profile?.is_driver && isApproved && (
                  <DropdownMenuItem onClick={() => navigate("/become-driver")} className="rounded-xl cursor-pointer text-sm font-medium">
                    <Car className="mr-2 h-4 w-4 text-muted-foreground" /> Become a Driver
                  </DropdownMenuItem>
                )}

                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="rounded-xl cursor-pointer text-sm font-medium">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Admin Panel
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl cursor-pointer text-sm font-medium text-destructive focus:text-destructive focus:bg-destructive/8"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-8 w-8 p-0 rounded-xl"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 py-3 pb-4 space-y-1 animate-fadeInUp">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive(path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border/50 mt-2 px-3">
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-destructive font-semibold py-1.5">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
