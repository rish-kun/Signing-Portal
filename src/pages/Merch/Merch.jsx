import { Link, useNavigate, useLoaderData } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, Search, Filter, ShoppingBag } from "lucide-react";
import { merchBaseURL } from "../../global";
import { handleApiErrorToast } from "../../assets/utils/toast.js";
import {
    getRefreshToken,
    UpdateAccessToken,
    logoutAction,
    accessTokenDuration,
    refreshTokenDuration,
    checkAccessToken,
    checkRefreshToken,
} from "../../assets/utils/auth.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function Merch() {
    const [merchList, setMerchList] = useState(null);
    const [merchLoading, setMerchLoading] = useState(true);
    const refreshToken = getRefreshToken();
    const accessToken = useLoaderData();
    const [emptyMerchMsg, setEmptyMerchMsg] = useState("Loading available merch...");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All Items");

    const navigate = useNavigate();
    
    useEffect(() => {
        if (!refreshToken || !accessToken) {
            logoutAction();
            navigate("/signin");
            return;
        }

        checkAccessToken();

        if (checkRefreshToken() === "EXPIRED") {
            logoutAction();
            navigate("/signin");
            return;
        }

        const accessTokenTimer = setTimeout(() => {
            UpdateAccessToken();
        }, accessTokenDuration());

        const refreshTokenTimer = setTimeout(() => {
            if (checkRefreshToken() === "EXPIRED") {
                logoutAction();
                navigate("/signin");
            }
        }, refreshTokenDuration());

        return () => {
            clearTimeout(accessTokenTimer);
            clearTimeout(refreshTokenTimer);
        };
    }, [refreshToken, accessToken, navigate]);

    useEffect(() => {
        setMerchLoading(true);
        axios.get(`${merchBaseURL}/merch_list`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
            }
        }).then((response) => {
            if (response.data.length === 0) {
                setEmptyMerchMsg("No merch available at this moment.");
            } else {
                setMerchList(response.data);
            }
            setMerchLoading(false);
        }).catch((errResponse) => {
            setEmptyMerchMsg("Something went wrong while fetching merch.");
            setMerchLoading(false);
            handleApiErrorToast(errResponse, "Failed to load merch. Please try again.");
            console.log(errResponse);
        });
    }, [accessToken]);

    // Filtering logic
    const filteredMerch = merchList?.filter(merch => {
        const matchesSearch = merch.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeCategory === "All Items") return true;

        const nameLower = merch.name.toLowerCase();
        if (activeCategory === "T-Shirts") {
            return nameLower.includes("t-shirt") || nameLower.includes("tee");
        }
        if (activeCategory === "Hoodies") {
            return nameLower.includes("hoodie") || nameLower.includes("sweatshirt") || nameLower.includes("jacket");
        }
        if (activeCategory === "Accessories") {
            // Fallback for accessories - if not tee or hoodie
            return !nameLower.includes("t-shirt") && !nameLower.includes("tee") &&
                   !nameLower.includes("hoodie") && !nameLower.includes("sweatshirt") &&
                   !nameLower.includes("jacket");
        }
        return true;
    });

    const MerchCard = ({ merch }) => {
        const [currentImageIndex, setCurrentImageIndex] = useState(0);
        const images = merch.extra_images_url 
            ? [merch.front_image_url, ...merch.extra_images_url] 
            : [merch.front_image_url];

        const nextImage = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        };

        const prevImage = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        };

        return (
            <Card className="group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50">
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                     <img
                        src={images[currentImageIndex]}
                        alt={merch.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute top-2 right-2 flex gap-2">
                         <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm font-semibold">
                            {merch.price === 0 ? 'Free' : `₹${merch.price}`}
                        </Badge>
                    </div>

                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                                onClick={nextImage}
                            >
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>
                    )}

                     {images.length > 1 && (
                         <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                             {images.map((_, idx) => (
                                 <div
                                     key={idx}
                                     className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                                         idx === currentImageIndex
                                             ? 'bg-white w-4'
                                             : 'bg-white/50 w-1.5 hover:bg-white/80'
                                     }`}
                                 />
                             ))}
                         </div>
                     )}
                </div>

                <CardContent className="flex-1 p-5 space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between items-start">
                             <h3 className="font-heading text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                {merch.name}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                             Limited Edition Merchandise
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="p-5 pt-0">
                    <Button
                        asChild
                        className="w-full font-semibold shadow-md group-hover:shadow-lg transition-all"
                    >
                        <Link to={`/EventDetails/merch/${merch.id}`}>
                            View Details
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    const LoadingSkeleton = () => (
        <Card className="h-full">
            <div className="aspect-square bg-muted/30 animate-pulse" />
            <CardContent className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </CardContent>
             <CardFooter className="p-5 pt-0">
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="rounded-full bg-muted p-4 mb-4 shadow-inner">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-heading-tertiary mb-2">No merchandise found</h3>
            <p className="text-body text-muted-foreground max-w-md">{message}</p>
            {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                </Button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-primary/5 py-12 md:py-20">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                <div className="container relative mx-auto px-4 text-center space-y-6">
                    <Badge variant="outline" className="animate-in fade-in slide-in-from-bottom-4 duration-700 border-primary/20 text-primary bg-primary/5">
                        Official Store
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                        Wear the <span className="text-primary">Vibe</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        Exclusive merchandise for the biggest cultural fest. Grab yours before they run out!
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-8 relative z-10">
                {/* Search and Filter */}
                <div className="bg-card/80 backdrop-blur-md border shadow-sm rounded-xl p-4 mb-8 sticky top-20 z-20 md:static">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                         <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search merch..."
                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            {["All Items", "T-Shirts", "Hoodies", "Accessories"].map((category) => (
                                <Button
                                    key={category}
                                    variant={activeCategory === category ? "secondary" : "ghost"}
                                    size="sm"
                                    className="whitespace-nowrap rounded-full"
                                    onClick={() => setActiveCategory(category)}
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {merchLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <LoadingSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredMerch && filteredMerch.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500">
                        {filteredMerch.map((merch, index) => (
                            <MerchCard
                                key={index}
                                merch={merch}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState message={searchQuery ? `No items match "${searchQuery}"` : emptyMerchMsg} />
                )}
            </div>
        </div>
    );
}

export default Merch;
