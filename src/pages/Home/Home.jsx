import { Link } from "react-router-dom";
import styles from "./Home.module.scss";
import Navbar from "../ComComponent/Navbar/Navbar";
import { useEffect, useState } from "react";

function Home() {
    const [activeTab, setActiveTab] = useState(0);
    const [eventList, setEventList] = useState(null);
    const [profShowList, setProfShowList] = useState(null);
    const eventContGap = 30;

    useEffect(() => {
        const dummyProfShows = [
            { id: 1, name: "Dummy Prof Show 1", description: "This is a dummy prof show." },
            { id: 2, name: "Dummy Prof Show 2", description: "This is another dummy prof show." },
        ];
        const dummyEvents = [
            { id: 1, name: "Dummy Event 1", description: "This is a dummy event." },
            { id: 2, name: "Dummy Event 2", description: "This is another dummy event." },
        ];

        setProfShowList(dummyProfShows);
        setEventList(dummyEvents);

        const eventContElem = document.getElementById("eventCont");
        eventContElem.addEventListener("scrollend", (event) => {
            setActiveTab(Math.round(eventContElem.scrollLeft/(eventContElem.clientWidth + eventContGap)))
        })
    }, [])

    useEffect(() => {
        const eventContElem = document.getElementById("eventCont");
        eventContElem.scrollTo({left: activeTab*(eventContElem.clientWidth + eventContGap), behavior: "smooth"});
    }, [activeTab])

    return (
        <div>
            <Navbar />
            <div className={styles.homeContent}>
                <h1 className={styles.pageTitle}>Available Events</h1>
                <p className={styles.pageDesc}>Browse our curated list of events and select the ones that spark your interest.</p>
                <div className={styles.tabContainer}>
                    <button onClick={() => setActiveTab(0)} className={`${styles.tab} ${activeTab == 0 ? styles.active : ''}`}>Prof Shows</button>
                    <button onClick={() => setActiveTab(1)} className={`${styles.tab} ${activeTab == 1 ? styles.active : ''}`}>Events</button>
                </div>
                <div id="eventCont" className={styles.eventContainer}>
                    <div className={styles.eventListContainer}>
                        {profShowList?.map((show, index) => (
                            <div className={styles.eventItem} key={index}>
                                <div className={styles.eventLeft}>
                                    <div className={styles.eventTitle}>{show.name}</div>
                                    <div className={styles.eventDesc}>{show.description}</div>
                                </div>
                                <div className={styles.eventRight}>
                                    <Link className={styles.eventLink} to={`/EventDetails/prof-show/${show.id}`}>
                                    View Details
                                    </Link>
                                </div>
                            </div>
                        )) || <div className={styles.emptyContentMessage}>No prof shows available.</div>}
                    </div>
                    <div className={styles.eventListContainer}>
                        {eventList?.map((event, index) => (
                            <div className={styles.eventItem} key={index}>
                                <div className={styles.eventLeft}>
                                    <div className={styles.eventTitle}>{event.name}</div>
                                    <div className={styles.eventDesc}>{event.description}</div>
                                </div>
                                <div className_={styles.eventRight}>
                                    <Link className={styles.eventLink} to={`/EventDetails/non-comp/${event.id}`}>
                                    View Details
                                    </Link>
                                </div>
                            </div>
                        )) || <div className={styles.emptyContentMessage}>No events available.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
