import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EventDetails.module.scss";
import Navbar from "../ComComponent/Navbar/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

function EventDetails() {
  const { eventType, eventIndex } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [openSlotIds, setOpenSlotIds] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState({});
  const [ticketCounts, setTicketCounts] = useState({});
  const [activeDateTab, setActiveDateTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let dummyEvent;
    if (eventType === "prof-show") {
      dummyEvent = {
        name: `Dummy Prof Show ${eventIndex}`,
        Artist: "Dummy Artist",
        description: "This is a dummy prof show description.",
        start_time: "2025-01-01T20:00:00Z",
        end_time: "2025-01-01T22:00:00Z",
        price: 500,
      };
    } else if (eventType === "non-comp") {
      dummyEvent = {
        non_comp_name: `Dummy Event ${eventIndex}`,
        description: "This is a dummy non-competitive event description.",
        dates: [
          {
            date: "2025-01-02",
            slots: [
              {
                slot_id: 1,
                venue: "Dummy Venue 1",
                start_time: "10:00:00",
                end_time: "12:00:00",
                is_openforsignings: true,
                ticket_types: [
                  { ticket_type_id: 1, ticket_type_name: "Type A", price: 100 },
                  { ticket_type_id: 2, ticket_type_name: "Type B", price: 150 },
                ],
              },
              {
                slot_id: 2,
                venue: "Dummy Venue 2",
                start_time: "14:00:00",
                end_time: "16:00:00",
                is_openforsignings: false,
                ticket_types: [],
              },
            ],
          },
        ],
      };
    } else {
      setError("Invalid event type.");
      setLoading(false);
      return;
    }

    setEvent(dummyEvent);
    setLoading(false);
  }, [eventType, eventIndex]);

  const handleSlotToggle = (slotId) => {
    setOpenSlotIds((prev) => (prev.includes(slotId) ? [] : [slotId]));
  };

  const handleTicketTypeChange = (slotId, ticketTypeId) => {
    setSelectedTicketType((prev) => ({
      ...prev,
      [slotId]: ticketTypeId,
    }));
    setTicketCounts((prev) => ({
      ...prev,
      [slotId]: 0,
    }));
  };

  const handleTicketCount = (slotId, delta) => {
    setTicketCounts((prev) => {
      const current = prev[slotId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [slotId]: next };
    });
  };

  const handleProfShowBuy = async () => {
    const count = ticketCounts["profshow"] || 0;
    if (count < 1) return alert("Select at least one ticket.");
    alert(`Dummy purchase of ${count} tickets for prof show. Navigating to Your Signings.`);
    navigate("/yoursignings");
  };

  const handleNonCompBuy = async (slot) => {
    const selectedTypeId = selectedTicketType[slot.slot_id];
    const count = ticketCounts[slot.slot_id] || 0;
    if (!selectedTypeId) return alert("Select a ticket type.");
    if (count < 1) return alert("Select at least one ticket.");
    alert(`Dummy purchase of ${count} tickets for slot ${slot.slot_id}. Navigating to Your Signings.`);
    navigate("/yoursignings");
  };

  if (loading) return <div>Loading...</div>;
  if (error || !event) return <div>{error || "Event not found."}</div>;

  // prof-show layout
  if (eventType === "prof-show") {
    const renderTickets = () => {
      const tickets = [
        {
          ticket_type_id: "profshow",
          ticket_type_name: "General Admission",
          price: event.price,
        },
      ];
      return (
        <div className={styles.ticketsContent}>
          {tickets.map((tt) => (
            <div className={styles.ticketItem} key={tt.ticket_type_id}>
              <div className={styles.ticketInfo}>
                <div>{tt.ticket_type_name}</div>
                <div className={styles.ticketPrice}>₹{tt.price}</div>
              </div>
              <div className={styles.ticketCounter}>
                <button
                  onClick={() =>
                    setTicketCounts((prev) => ({
                      ...prev,
                      [tt.ticket_type_id]: Math.max(
                        0,
                        (prev[tt.ticket_type_id] || 0) - 1
                      ),
                    }))
                  }
                  disabled={ticketCounts[tt.ticket_type_id] === 0}
                >
                  -
                </button>
                <span className={styles.counterValue}>
                  {ticketCounts[tt.ticket_type_id] || 0}
                </span>
                <button
                  onClick={() =>
                    setTicketCounts((prev) => ({
                      ...prev,
                      [tt.ticket_type_id]: (prev[tt.ticket_type_id] || 0) + 1,
                    }))
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <button
            className={styles.buyTicketsButton}
            onClick={handleProfShowBuy}
            disabled={ticketCounts["profshow"] === 0}
          >
            Buy Tickets
          </button>
        </div>
      );
    };

    const renderAbout = () => (
      <div className={styles.aboutContent}>
        <div className={styles.aboutSection}>
          <div className={styles.aboutLabel}>Artist:</div>
          <div className={styles.aboutValue}>{event.Artist}</div>
        </div>
        <div className={styles.aboutSection}>
          <div className={styles.aboutLabel}>Description:</div>
          <div className={styles.aboutValue}>{event.description}</div>
        </div>
        <div className={styles.aboutSection}>
          <div className={styles.aboutLabel}>Start Time:</div>
          <div className={styles.aboutValue}>{event.start_time}</div>
        </div>
        <div className={styles.aboutSection}>
          <div className={styles.aboutLabel}>End Time:</div>
          <div className={styles.aboutValue}>{event.end_time}</div>
        </div>
      </div>
    );

    return (
      <div style={{ position: "relative" }}>
        <Navbar />
        <div className={styles.eventDetailsContent}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            <FontAwesomeIcon
              icon={faChevronLeft}
              style={{ marginRight: "0.5em" }}
            />
            Go Back
          </button>
          <div className={styles.eventTitle}>{event.name}</div>
          <div className={styles.eventDateAndTime}>
            {event.start_time || ""}
          </div>
          <div className={styles.eventDetailsContainer}>
            <div className={styles.tabContainer}>
              <button
                className={activeTab === "about" ? styles.activeTab : ""}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
              <button
                className={activeTab === "tickets" ? styles.activeTab : ""}
                onClick={() => setActiveTab("tickets")}
              >
                Tickets
              </button>
            </div>
            <hr className={styles.separatorLine} />
            <div className={styles.tabContent}>
              {activeTab === "about" && renderAbout()}
              {activeTab === "tickets" && renderTickets()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // non-comp layout 
  return (
    <div style={{ position: "relative" }}>
      <Navbar />
      <div className={styles.eventDetailsContent}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          <FontAwesomeIcon
            icon={faChevronLeft}
            style={{ marginRight: "0.5em" }}
          />
          Go Back
        </button>
        <div className={styles.eventTitle}>{event.non_comp_name}</div>
        <div className={`${styles.eventDetailsContainer} ${styles.nonCompContainer}`}>
          <div className={styles.tabContainer}>
            {event.dates.map((dateObj, idx) => (
              <button
                key={dateObj.date}
                className={activeDateTab === idx ? styles.activeTab : ""}
                onClick={() => setActiveDateTab(idx)}
              >
                {dateObj.date}
              </button>
            ))}
          </div>
          <hr className={styles.separatorLine} />
          <div className={styles.tabContent} style={{ paddingTop: 0 }}>
            <div className={styles.aboutContent}>
              <div className={styles.aboutSection}>
                <div className={styles.aboutLabel}>Description</div>
                <div className={styles.aboutValue}>{event.description}</div>
              </div>
              <div className={styles.aboutSection}>
                <div className={styles.aboutLabel}>Slots</div>
                <div className={styles.aboutSlots}>
                  {event.dates[activeDateTab]?.slots.length > 0 ? (
                    event.dates[activeDateTab].slots.map((slot) => (
                      <div key={slot.slot_id} className={styles.slotBoxWrapper}>
                        <button
                          className={styles.slotBox}
                          style={{
                            opacity: slot.is_openforsignings ? 1 : 0.5,
                            cursor: slot.is_openforsignings
                              ? "pointer"
                              : "not-allowed",
                          }}
                          onClick={() => handleSlotToggle(slot.slot_id)}
                        >
                          <div>
                            <strong>Venue:</strong> {slot.venue}
                            <br />
                            <strong>Start:</strong> {slot.start_time}
                            <br />
                            <strong>End:</strong> {slot.end_time}
                          </div>
                          <FontAwesomeIcon
                            icon={
                              openSlotIds.includes(slot.slot_id)
                                ? faChevronUp
                                : faChevronDown
                            }
                            className={
                              openSlotIds.includes(slot.slot_id)
                                ? styles.chevronIconOpen
                                : styles.chevronIcon
                            }
                          />
                        </button>
                        {openSlotIds.includes(slot.slot_id) && (
                          <div className={styles.ticketsContent}>
                            {slot.is_openforsignings ? (
                              slot.ticket_types &&
                              slot.ticket_types.length > 0 ? (
                                <div>
                                  <select
                                    className={styles.ticketTypeDropdown}
                                    value={
                                      selectedTicketType[slot.slot_id] || ""
                                    }
                                    onChange={(e) =>
                                      handleTicketTypeChange(
                                        slot.slot_id,
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="" disabled>
                                      Select Ticket Type
                                    </option>
                                    {slot.ticket_types.map((tt) => (
                                      <option
                                        key={tt.ticket_type_id}
                                        value={tt.ticket_type_id}
                                      >
                                        {tt.ticket_type_name} (₹{tt.price})
                                      </option>
                                    ))}
                                  </select>
                                  {selectedTicketType[slot.slot_id] && (
                                    <>
                                      <div className={styles.ticketItem}>
                                        <div className={styles.ticketInfo}>
                                          <div>
                                            {
                                              slot.ticket_types.find(
                                                (t) =>
                                                  t.ticket_type_id ===
                                                  selectedTicketType[
                                                    slot.slot_id
                                                  ]
                                              )?.ticket_type_name
                                            }
                                          </div>
                                          <div className={styles.ticketPrice}>
                                            Quantity:
                                            {
                                              slot.ticket_types.find(
                                                (t) =>
                                                  t.ticket_type_id ===
                                                  selectedTicketType[
                                                    slot.slot_id
                                                  ]
                                              )?.price
                                            }
                                          </div>
                                        </div>
                                        <div className={styles.ticketCounter}>
                                          <button
                                            onClick={() =>
                                              handleTicketCount(
                                                slot.slot_id,
                                                -1
                                              )
                                            }
                                            disabled={
                                              ticketCounts[slot.slot_id] === 0
                                            }
                                          >
                                            -
                                          </button>
                                          <span className={styles.counterValue}>
                                            {ticketCounts[slot.slot_id] || 0}
                                          </span>
                                          <button
                                            onClick={() =>
                                              handleTicketCount(slot.slot_id, 1)
                                            }
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                      <div className={styles.buyButtonRow}>
                                        <button
                                          className={styles.buyTicketsButton}
                                          onClick={() => handleNonCompBuy(slot)}
                                          disabled={
                                            ticketCounts[slot.slot_id] === 0
                                          }
                                        >
                                          Buy Tickets
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div>No tickets available.</div>
                              )
                            ) : (
                              <div style={{ color: "#888", padding: "1rem 0" }}>
                                Signings not open for this slot.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div>No slots available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;