import React, { useState } from "react";
import { Link, useLocation, useSubmit } from "react-router-dom";
import { getAccessToken, getUserDetails } from "../../assets/utils/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "../theme-toggle";
import {
  Calendar,
  ShoppingBag,
  Ticket,
  User,
  LogOut,
  Moon,
  Sun
} from "lucide-react";

const MobileBottomNav = () => {
  const token = getAccessToken();
  const location = useLocation();
  const { username, profilePicURL } = getUserDetails();
  const submit = useSubmit();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!token) return null;

  const signOut = () => {
    submit({ token }, { method: "post", action: "/logout" });
  };

  const navLinks = [
    { to: "/", label: "Merch", icon: ShoppingBag },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/yoursignings", label: "Signings", icon: Ticket },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/20 pb-safe md:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}

          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <button
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                  isProfileOpen
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all duration-300 ${isProfileOpen ? "bg-primary/10" : "bg-transparent"}`}>
                  <User className={`h-5 w-5 ${isProfileOpen ? "fill-primary/20" : ""}`} strokeWidth={isProfileOpen ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">Profile</span>
              </button>
            </DialogTrigger>
            <DialogContent className="w-[90%] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-6 py-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={profilePicURL || "/default-profile.png"} alt={username} />
                  <AvatarFallback className="text-2xl"><User /></AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">{username || "Guest"}</h3>
                  <p className="text-sm text-muted-foreground">User</p>
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Appearance</span>
                    <ThemeToggle />
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setIsProfileOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
