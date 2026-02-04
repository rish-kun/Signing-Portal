import React from "react";
import { Link, useSubmit, useLocation } from "react-router-dom";
import { getAccessToken, getUserDetails } from "../../assets/utils/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";
import {
  Calendar,
  ShoppingBag,
  Ticket,
  Phone,
  LogOut,
  User
} from "lucide-react";

const DesktopNavbar = () => {
  const submit = useSubmit();
  const location = useLocation();
  const { username, profilePicURL } = getUserDetails();
  const token = getAccessToken();

  const signOut = () => {
    submit({ token }, { method: "post", action: "/logout" });
  };

  const navLinks = [
    { to: "/", label: "Merch", icon: ShoppingBag },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/yoursignings", label: "Your Signings", icon: Ticket },
    { to: "/contact", label: "Contact", icon: Phone },
  ];

  const isSignInPage = location.pathname === "/signin";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-md shadow-sm hidden md:block">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="nav-brand flex items-center space-x-3 transition-all duration-300 hover:scale-105 hover:text-primary">
            <img src="https://res.cloudinary.com/dhrbeqvcw/image/upload/v1760900997/logo2_r7itzj.png" alt="Logo" className="h-8 w-8 transition-transform duration-300 hover:rotate-12" />
            <span className="nav-brand font-bold">Signing Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-6">
            {token ? (
              <>
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="nav-link relative px-3 py-2 rounded-md transition-all duration-300 hover:bg-primary/10 hover:shadow-sm hover:scale-105 flex items-center space-x-2"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <div className="relative">
                  <ThemeToggle />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-md hover:bg-primary/10 p-0">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={profilePicURL || "/default-profile.png"} alt={username} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-md border border-border/20 shadow-lg" align="end" forceMount>
                    <div className="flex items-center justify-start gap-3 p-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={profilePicURL || "/default-profile.png"} alt={username} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="text-sm font-medium">{username || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">User</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ThemeToggle />
                </div>
                {!isSignInPage && (
                  <Button asChild variant="default" className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <Link to="/signin">Sign In</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavbar;
