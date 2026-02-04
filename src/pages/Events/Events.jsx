import { Link, useNavigate, useLoaderData } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, Users, List, Grid, Search, MapPin, Clock } from "lucide-react";
import { apiBaseURL } from "../../global";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Events() {
    const [eventList, setEventList] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshToken = getRefreshToken();
    const accessToken = useLoaderData();
    const [emptyEventsMsg, setEmptyEventsMsg] = useState("Loading available events...");
    const [viewMode, setViewMode] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");

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
        setLoading(true);
        axios.get(`${apiBaseURL}/api/shows`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
            }
        }).then((response) => {
            if (response.data.non_comp_events.length === 0) {
                setEmptyEventsMsg("No events available at this moment.");
            } else {
                setEventList(response.data.non_comp_events.reverse());
            }
            setLoading(false);
        }).catch((errResponse) => {
            setEmptyEventsMsg("Something went wrong while fetching events.");
            setLoading(false);
            handleApiErrorToast(errResponse, "Failed to load events. Please try again.");
            console.log(errResponse);
        });
    }, [accessToken]);

    const filteredEvents = eventList?.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const EventCard = ({ event, view }) => {
        const isList = view === "list";

        return (
            <Card className={`group hover:shadow-lg transition-all duration-300 border hover:border-primary/30 flex ${isList ? 'flex-row items-center' : 'flex-col'} overflow-hidden`}>
                <div className={`${isList ? 'w-48 h-full shrink-0' : 'h-48 w-full'} bg-muted/50 relative overflow-hidden`}>
                    {/* Placeholder for event image if available, or a pattern */}
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-primary/20" />
                    </div>
                    {/* Date Badge overlay */}
                     <div className="absolute top-3 left-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-background/90">
                            Upcoming
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <CardHeader className={`${isList ? 'pb-2' : 'space-y-1'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                                {event.name}
                            </CardTitle>
                             {!isList && (
                                <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground border-secondary/20 shrink-0">
                                    Event
                                </Badge>
                             )}
                        </div>
                        <CardDescription className="text-sm line-clamp-2 mt-1">
                            {event.description || "No description available"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className={`flex-1 ${isList ? 'py-0' : 'space-y-4'}`}>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary/60" />
                                <span>Campus Venue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-primary/60" />
                                <span>Open for All</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary/60" />
                                <span>Check details</span>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className={`${isList ? 'justify-end' : 'pt-0'}`}>
                        <Button
                            asChild
                            className={`${isList ? '' : 'w-full'} font-medium transition-transform group-hover:scale-[1.02] active:scale-95`}
                        >
                            <Link to={`/EventDetails/non-comp/${event.id}`}>
                                View Details
                            </Link>
                        </Button>
                    </CardFooter>
                </div>
            </Card>
        );
    };

    const LoadingSkeleton = ({ view }) => (
        <Card className={`flex ${view === 'list' ? 'flex-row' : 'flex-col'}`}>
            <Skeleton className={`${view === 'list' ? 'w-48 h-40' : 'h-48 w-full'}`} />
            <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-4 pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </Card>
    );

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="rounded-full bg-muted p-4 mb-4 shadow-inner">
                <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-heading-tertiary mb-2">No events found</h3>
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
            <div className="pt-8 md:pt-12 pb-8">
                <div className="container mx-auto px-4">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                                    Events
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-2xl">
                                    Discover and register for upcoming events.
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search events..."
                                    className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
                                <TabsList className="grid w-full grid-cols-2 md:w-auto">
                                    <TabsTrigger value="grid" className="px-4">
                                        <Grid className="h-4 w-4 mr-2" />
                                        Grid
                                    </TabsTrigger>
                                    <TabsTrigger value="list" className="px-4">
                                        <List className="h-4 w-4 mr-2" />
                                        List
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        {/* Content */}
                        {loading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <LoadingSkeleton key={i} view={viewMode} />
                                ))}
                            </div>
                        ) : filteredEvents && filteredEvents.length > 0 ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} animate-in fade-in duration-500`}>
                                {filteredEvents.map((event, index) => (
                                    <EventCard 
                                        key={index} 
                                        event={event} 
                                        view={viewMode}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState message={searchQuery ? `No events match "${searchQuery}"` : emptyEventsMsg} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Events;
