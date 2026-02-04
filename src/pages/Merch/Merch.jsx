import { Link, useNavigate, useLoaderData } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, Search, Filter } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function Merch() {
    const [merchList, setMerchList] = useState(null);
    const [filteredMerchList, setFilteredMerchList] = useState(null);
    const [merchLoading, setMerchLoading] = useState(true);
    const [emptyMerchMsg, setEmptyMerchMsg] = useState("Loading available merch...");

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("default");

    const refreshToken = getRefreshToken();
    const accessToken = useLoaderData();
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
                setMerchList([]);
                setFilteredMerchList([]);
            } else {
                setMerchList(response.data);
                setFilteredMerchList(response.data);
            }
            setMerchLoading(false);
        }).catch((errResponse) => {
            setEmptyMerchMsg("Something went wrong while fetching merch.");
            setMerchLoading(false);
            handleApiErrorToast(errResponse, "Failed to load merch. Please try again.");
            console.log(errResponse);
        });
    }, [accessToken]);

    // Filtering Effect
    useEffect(() => {
        if (!merchList) return;
        let result = [...merchList];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(m => m.name.toLowerCase().includes(query));
        }

        if (sortOrder === "price_asc") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOrder === "price_desc") {
            result.sort((a, b) => b.price - a.price);
        }

        setFilteredMerchList(result);
    }, [merchList, searchQuery, sortOrder]);

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
            <Card className="group h-full overflow-hidden border bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                        src={images[currentImageIndex]}
                        alt={merch.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Image Controls */}
                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
                                onClick={nextImage}
                            >
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>
                    )}
                    {/* Dots */}
                    {images.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 w-1.5 rounded-full shadow-sm transition-all ${
                                        idx === currentImageIndex
                                            ? 'bg-white w-3'
                                            : 'bg-white/60'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-foreground backdrop-blur-md shadow-sm border-0 font-medium hover:bg-white/100">
                            {merch.price === 0 ? "Free" : `₹${merch.price}`}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-4">
                    <div className="mb-2">
                        <h3 className="font-heading font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {merch.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                         <Button
                            asChild 
                            className="w-full font-medium shadow-none group-hover:shadow-md transition-all"
                        >
                            <Link to={`/EventDetails/merch/${merch.id}`}>
                                View Details
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const LoadingSkeleton = () => (
        <Card className="h-full border-0 shadow-none bg-transparent">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-2 mt-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-4" />
            </div>
        </Card>
    );

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
            <div className="rounded-full bg-muted/50 p-6 mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-heading-tertiary mb-2">No merch found</h3>
            <p className="text-body text-muted-foreground max-w-md mx-auto">{message}</p>
            {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4">
                    Clear filters
                </Button>
            )}
        </div>
    );

    const Hero = () => (
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-12 sm:px-12 sm:py-20 mb-8 shadow-2xl isolate">
            <div className="relative z-10 max-w-2xl">
                <Badge variant="outline" className="mb-6 text-primary-foreground border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-sm px-3 py-1">
                    New Collection 2024
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 font-heading">
                    Official Merch Store
                </h1>
                <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-lg leading-relaxed">
                    Grab your limited edition gear before it's gone. Represent your campus with style.
                </p>
                <Button
                    size="lg"
                    variant="secondary"
                    asChild
                    className="font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                    <a href="#shop-section">Shop Now</a>
                </Button>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 right-20 -mb-20 w-64 h-64 bg-secondary/30 rounded-full blur-3xl -z-10 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl -z-10 mix-blend-overlay"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Hero />

                <div id="shop-section" className="space-y-6">
                    {/* Filters Bar */}
                    <div className="sticky top-16 sm:top-20 z-30 bg-background/80 backdrop-blur-xl p-4 rounded-xl shadow-sm border border-border/50 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search merchandise..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger className="w-full sm:w-[180px] bg-background/50 focus:bg-background">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Featured</SelectItem>
                                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    {merchLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <LoadingSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredMerchList && filteredMerchList.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredMerchList.map((merch, index) => (
                                <MerchCard
                                    key={index}
                                    merch={merch}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState message={searchQuery ? "No items match your search." : emptyMerchMsg} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Merch;
