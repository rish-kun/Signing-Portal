import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../ComComponent/Navbar/NewNavbar";
import { apiBaseURL } from "../../global";
import { getAccessToken } from "../../assets/utils/auth.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Plus, Minus } from "lucide-react";

function EventDetails() {
  const { eventType, eventIndex } = useParams();
  const accessToken = getAccessToken();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState({});
  const [ticketCounts, setTicketCounts] = useState({});
  const [activeDateTab, setActiveDateTab] = useState(0);

  useEffect(() => {
    let endpoint = "";
    if (eventType === "prof-show") {
      endpoint = `/api/prof-show/${eventIndex}/`;
    } else if (eventType === "non-comp") {
      endpoint = `/api/non-comp/${eventIndex}/`;
    } else {
      setError("Invalid event type.");
      setLoading(false);
      return;
    }

    axios
      .get(`${apiBaseURL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
      })
      .then((response) => {
        setEvent(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Event not found or unauthorized.");
        setLoading(false);
      });
  }, [eventType, eventIndex, accessToken]);

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
    try {
      const formData = new FormData();
      formData.append("ticket", count);

      await axios.post(
        `${apiBaseURL}/api/prof-show/${eventIndex}/buy/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            accept: "application/json",
          },
        }
      );
      alert("Tickets purchased successfully!");
      navigate("/yoursignings");
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed.");
    }
  };

  const handleNonCompBuy = async (slot) => {
    const selectedTypeId = selectedTicketType[slot.slot_id];
    const count = ticketCounts[slot.slot_id] || 0;
    if (!selectedTypeId) return alert("Select a ticket type.");
    if (count < 1) return alert("Select at least one ticket.");
    try {
      const formData = new FormData();
      formData.append("tickets", count);
      await axios.post(
        `${apiBaseURL}/api/non-comp-ticket/${selectedTypeId}/buy/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            accept: "application/json",
          },
        }
      );
      alert("Tickets purchased successfully!");
      navigate("/yoursignings");
    } catch (err) {
      alert(
        `Failed for ${
          slot.ticket_types.find((t) => t.ticket_type_id === selectedTypeId)
            ?.ticket_type_name || "Ticket"
        }: ` + (err.response?.data?.error || "Purchase failed.")
      );
    }
  };

  if (loading) return <div className="container mx-auto px-4 md:px-6 py-8">Loading...</div>;
  if (error || !event) return <div className="container mx-auto px-4 md:px-6 py-8">{error || "Event not found."}</div>;

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
        <div className="space-y-4">
          {tickets.map((tt) => (
            <Card key={tt.ticket_type_id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">{tt.ticket_type_name}</div>
                  <div className="text-muted-foreground">₹{tt.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTicketCount(tt.ticket_type_id, -1)}
                    disabled={(ticketCounts[tt.ticket_type_id] || 0) === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span>{ticketCounts[tt.ticket_type_id] || 0}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTicketCount(tt.ticket_type_id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full"
            onClick={handleProfShowBuy}
            disabled={(ticketCounts["profshow"] || 0) === 0}
          >
            Buy Tickets
          </Button>
        </div>
      );
    };

    const renderAbout = () => (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-semibold">Artist</div>
          <div>{event.Artist}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-semibold">Description</div>
          <div>{event.description}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-semibold">Start Time</div>
          <div>{event.start_time}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-semibold">End Time</div>
          <div>{event.end_time}</div>
        </div>
      </div>
    );

    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{event.start_time || ""}</p>
          <Card className="mt-6">
            <CardHeader>
              <Tabs defaultValue="about">
                <TabsList>
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="pt-4">
                  {renderAbout()}
                </TabsContent>
                <TabsContent value="tickets" className="pt-4">
                  {renderTickets()}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // non-comp layout 
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <h1 className="text-3xl font-bold">{event.non_comp_name}</h1>
        <Card className="mt-6">
          <CardHeader>
            <Tabs
              defaultValue={event.dates[0].date}
              onValueChange={(value) =>
                setActiveDateTab(
                  event.dates.findIndex((d) => d.date === value)
                )
              }
            >
              <TabsList>
                {event.dates.map((dateObj) => (
                  <TabsTrigger key={dateObj.date} value={dateObj.date}>
                    {dateObj.date}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={event.dates[activeDateTab].date} className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Slots</h3>
                    {event.dates[activeDateTab]?.slots.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {event.dates[activeDateTab].slots.map((slot) => (
                          <AccordionItem key={slot.slot_id} value={slot.slot_id}>
                            <AccordionTrigger
                              disabled={!slot.is_openforsignings}
                            >
                              <div>
                                <strong>Venue:</strong> {slot.venue}
                                <br />
                                <strong>Start:</strong> {slot.start_time}
                                <br />
                                <strong>End:</strong> {slot.end_time}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {slot.is_openforsignings ? (
                                slot.ticket_types &&
                                slot.ticket_types.length > 0 ? (
                                  <div className="space-y-4">
                                    <Select
                                      onValueChange={(value) =>
                                        handleTicketTypeChange(
                                          slot.slot_id,
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Ticket Type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {slot.ticket_types.map((tt) => (
                                          <SelectItem
                                            key={tt.ticket_type_id}
                                            value={tt.ticket_type_id}
                                          >
                                            {tt.ticket_type_name} (₹{tt.price})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {selectedTicketType[slot.slot_id] && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                              handleTicketCount(
                                                slot.slot_id,
                                                -1
                                              )
                                            }
                                            disabled={
                                              (ticketCounts[slot.slot_id] || 0) === 0
                                            }
                                          >
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span>
                                            {ticketCounts[slot.slot_id] || 0}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                              handleTicketCount(slot.slot_id, 1)
                                            }
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <Button
                                          onClick={() => handleNonCompBuy(slot)}
                                          disabled={
                                            (ticketCounts[slot.slot_id] || 0) === 0
                                          }
                                        >
                                          Buy Tickets
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>No tickets available.</div>
                                )
                              ) : (
                                <div className="text-muted-foreground">
                                  Signings not open for this slot.
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div>No slots available.</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default EventDetails;