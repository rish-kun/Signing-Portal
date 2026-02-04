import React from "react";
import { Link, useLocation, useSubmit } from "react-router-dom";
import { getAccessToken, getUserDetails } from "../assets/utils/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import {
  Calendar,
  ShoppingBag,
  Ticket,
  Phone,
  LogOut,
  User
} from "lucide-react";

const Navigation = () => {
  const submit = useSubmit();
  const location = useLocation();
  // Get user details only if token exists, otherwise they might be null/undefined
  const { username, profilePicURL } = getUserDetails() || {};
  const token = getAccessToken();

  const signOut = () => {
    submit({ token }, { method: "post", action: "/logout" });
  };

  const navLinks = [
    { to: "/", label: "Merch", icon: ShoppingBag },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/yoursignings", label: "Your Signings", icon: Ticket },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  // If we are on the SignIn page, we typically don't show the main navigation
  // But the existing app showed it. The layout is cleaner without it on signin.
  // However, `Layout` in App.jsx wraps everything.
  // We can check `location.pathname === '/signin'` and hide navigation or show minimal.
  if (location.pathname === "/signin") {
      return null; // SignIn page will have its own minimal header or none
  }

  if (!token) {
    // Visitor navigation
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 mx-auto">
            <Link to="/" className="flex items-center gap-2 font-bold">
            <img src="https://res.cloudinary.com/dhrbeqvcw/image/upload/v1760900997/logo2_r7itzj.png" alt="Logo" className="h-6 w-6" />
            <span>Signings Portal</span>
            </Link>
            <div className="flex items-center gap-2">
                 <ThemeToggle />
                 <Button asChild variant="ghost" size="sm">
                    <Link to="/contact">Contact</Link>
                 </Button>
            </div>
        </div>
        </nav>
    );
  }

  return (
    <>
      {/* Top Navigation (Desktop) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div className="container flex h-16 items-center px-4 mx-auto">
            <Link to="/" className="mr-6 flex items-center space-x-2">
                <img src="https://res.cloudinary.com/dhrbeqvcw/image/upload/v1760900997/logo2_r7itzj.png" alt="Logo" className="h-6 w-6" />
                <span className="font-bold hidden lg:inline-block">Signings Portal</span>
            </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
                <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-foreground/80 ${isActive(link.to) ? "text-primary" : "text-foreground/60"}`}
                >
                {link.label}
                </Link>
            ))}
             <Link
                to="/contact"
                className={`transition-colors hover:text-foreground/80 ${isActive("/contact") ? "text-primary" : "text-foreground/60"}`}
                >
                Contact
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePicURL || "/default-profile.png"} alt={username} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                    <p className="text-sm font-medium leading-none">{username || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        User
                    </p>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar (Logo + Profile/Theme) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden flex items-center justify-between px-4 h-14">
            <Link to="/" className="flex items-center space-x-2">
                <img src="https://res.cloudinary.com/dhrbeqvcw/image/upload/v1760900997/logo2_r7itzj.png" alt="Logo" className="h-6 w-6" />
                <span className="font-bold">Signings</span>
            </Link>
            <div className="flex items-center gap-2">
                 <ThemeToggle />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={profilePicURL || "/default-profile.png"} alt={username} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden pb-safe">
        <nav className="grid grid-cols-4 h-16">
            {navLinks.map((link) => {
                 const Icon = link.icon;
                 const active = isActive(link.to);
                 return (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Icon className={`h-5 w-5 ${active ? "stroke-primary" : "stroke-muted-foreground"}`} />
                        <span>{link.label}</span>
                    </Link>
                 );
            })}
             <Link
                to="/contact"
                className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive("/contact") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Phone className={`h-5 w-5 ${isActive("/contact") ? "stroke-primary" : "stroke-muted-foreground"}`} />
                <span>Contact</span>
            </Link>
        </nav>
      </div>
    </>
  );
};

export default Navigation;
