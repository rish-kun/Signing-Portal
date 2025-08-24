import { Link, useNavigate, useLoaderData } from "react-router-dom";
import Navbar from "../ComComponent/Navbar/NewNavbar";
import axios from "axios";
import { useEffect, useState } from "react";
import { apiBaseURL } from "../../global";
import {
    getRefreshToken,
    UpdateAccessToken,
    logoutAction,
    accessTokenDuration,
    refreshTokenDuration,
    checkAccessToken,
    checkRefreshToken,
} from "../../assets/utils/auth.js";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Home() {
    const [eventList, setEventList] = useState(null);
    const [profShowList, setProfShowList] = useState(null);
    const refreshToken = getRefreshToken();
    const accessToken = useLoaderData();
    const [emptyEventsMsg, setEmptyEventsMsg] = useState("Please wait while we load the list of available events.");
    const [emptyProfShowMsg, setEmptyProfShowMsg] = useState("Please wait while we load the list of available prof shows.");

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
    }, [refreshToken, accessToken]);

    useEffect(() => {
        axios.get(`${apiBaseURL}/api/shows`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
            }}
        ).then((response) => {
            if (response.data.non_comp_events.length === 0) setEmptyEventsMsg("Looks like there are no available events at this moment.")
            else setEventList(response.data.non_comp_events.reverse());

            if (response.data.prof_shows.length === 0) setEmptyProfShowMsg("Looks like there are no available prof shows at this moment")
            else setProfShowList(response.data.prof_shows.reverse());

        }).catch((errResponse) => {
            setEmptyEventsMsg(`Something went wrong in recieveing the available events.`);
            setEmptyProfShowMsg(`Something went wrong in recieving the available prof shows.`);
            console.log(errResponse)
        })
    }, [])

    return (
        <div>
            <Navbar />
            <div className="container mx-auto px-4 md:px-6 py-8">
                <h1 className="text-3xl font-bold">Available Events</h1>
                <p className="text-muted-foreground">Browse our curated list of events and select the ones that spark your interest.</p>
                <Tabs defaultValue="prof-shows" className="mt-6">
                    <TabsList>
                        <TabsTrigger value="prof-shows">Prof Shows</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                    </TabsList>
                    <TabsContent value="prof-shows">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {profShowList ? profShowList.map((show) => (
                                <Card key={show.id}>
                                    <CardHeader>
                                        <CardTitle>{show.name}</CardTitle>
                                        <CardDescription>{show.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Link to={`/EventDetails/prof-show/${show.id}`} className="w-full">
                                            <Button className="w-full">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )) : <div>{emptyProfShowMsg}</div>}
                        </div>
                    </TabsContent>
                    <TabsContent value="events">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {eventList ? eventList.map((event) => (
                                <Card key={event.id}>
                                    <CardHeader>
                                        <CardTitle>{event.name}</CardTitle>
                                        <CardDescription>{event.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Link to={`/EventDetails/non-comp/${event.id}`} className="w-full">
                                            <Button className="w-full">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )) : <div>{emptyEventsMsg}</div>}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default Home;
