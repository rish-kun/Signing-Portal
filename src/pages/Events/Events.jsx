import { Link, useNavigate, useLoaderData } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, Users, LayoutGrid, List as ListIcon, MapPin, ArrowRight } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Events() {
    const [eventList, setEventList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid");
    const refreshToken = getRefreshToken();
    const accessToken = useLoaderData();
    const [emptyEventsMsg, setEmptyEventsMsg] = useState("Loading available events...");

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

    const EventCard = ({ event, viewMode }) => {
        if (viewMode === 'list') {
            return (
                <Card className="group hover:shadow-md transition-all duration-300 border hover:border-primary/30 flex flex-col sm:flex-row overflow-hidden">
                    <div className="h-32 sm:h-auto sm:w-48 bg-muted shrink-0 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-6">
                        <div className="space-y-2">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {event.name}
                                </CardTitle>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 whitespace-nowrap ml-2">
                                    Event
                                </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {event.description || "No description available for this event."}
                            </CardDescription>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>Registration Open</span>
                                </div>
                            </div>
                            <Button size="sm" asChild className="ml-4">
                                <Link to={`/EventDetails/non-comp/${event.id}`}>
                                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            );
        }

        return (
            <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 border hover:border-primary/30 hover:-translate-y-1 overflow-hidden">
                <div className="h-48 bg-muted relative flex items-center justify-center overflow-hidden">
                    {/* Placeholder for event image if available, else icon */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                    <Calendar className="h-12 w-12 text-muted-foreground/30 relative z-10" />
                    <div className="absolute top-3 right-3 z-20">
                         <Badge variant="secondary" className="bg-white/90 backdrop-blur text-foreground shadow-sm">
                            Event
                        </Badge>
                    </div>
                </div>

                <CardHeader className="space-y-2 pb-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                        {event.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                        {event.description || "No description available"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                   {/* Spacing filler */}
                </CardContent>

                <CardFooter className="pt-0 border-t bg-muted/20 p-4">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            <span>Open</span>
                        </div>
                        <Button
                            asChild
                            size="sm"
                            className="font-medium shadow-sm"
                        >
                            <Link to={`/EventDetails/non-comp/${event.id}`}>
                                View Details
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        );
    };

    const LoadingSkeleton = () => (
        <Card className="h-full">
            <Skeleton className="h-48 w-full rounded-t-xl" />
            <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
            <div className="rounded-full bg-muted p-4 mb-4">
                <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-heading-tertiary mb-2">No events found</h3>
            <p className="text-body text-muted-foreground max-w-md mx-auto">{message}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
            <div className="pt-8 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                            <div className="space-y-2">
                                <h1 className="text-heading-primary">
                                    Available Events
                                </h1>
                                <p className="text-body text-muted-foreground max-w-2xl">
                                    Browse our curated list of events and secure your spot.
                                </p>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="h-8 px-3"
                                >
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="h-8 px-3"
                                >
                                    <ListIcon className="h-4 w-4 mr-2" />
                                    List
                                </Button>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <LoadingSkeleton key={i} />
                                ))}
                            </div>
                        ) : eventList && eventList.length > 0 ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {eventList.map((event, index) => (
                                    <EventCard 
                                        key={index} 
                                        event={event} 
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState message={emptyEventsMsg} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Events;
