import axios from "axios";
import { apiBaseURL, merchBaseURL } from "../../global";
import { extractErrorMessage } from "../../assets/utils/errorHandling.js";
import { showErrorToast, showSuccessToast } from "../../assets/utils/toast.js";
import {
  useLoaderData,
  redirect,
  useSubmit,
  useActionData,
  useNavigation,
  Link,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { getAccessToken, getRefreshToken } from "../../assets/utils/auth.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Calendar, IndianRupee, AlertCircle, CheckCircle, XCircle, MapPin, ShoppingBag, Clock } from "lucide-react";

function YourSignings() {
  const [currentEvent, setcurrentEvent] = useState("A-1");
  const [currentMerch, setCurrentMerch] = useState("merch-1");
  const eventData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Show toast notifications for action results
  useEffect(() => {
    if (actionData?.isError) {
      showErrorToast(actionData.message);
    } else if (actionData && !actionData.isError) {
      showSuccessToast(actionData.message);
    }
  }, [actionData]);

  const getStatusBadge = (cancelled) => {
    if (cancelled) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
        <CheckCircle className="h-3 w-3" />
        Confirmed
      </Badge>
    );
  };

  const handleCancelTicket = (ticketId, index) => {
    setcurrentEvent(`non_comp-${index}`);
    const formData = new FormData();
    formData.append(`non_comp_ticket_id`, ticketId);
    submit(formData, {
      method: "post",
      action: "/yoursignings",
    });
  };

  const handleCancelMerch = (merchTicketId, index) => {
    setCurrentMerch(`merch-${index}`);
    const formData = new FormData();
    formData.append(`merch_ticket_id`, merchTicketId);
    submit(formData, {
      method: "post",
      action: "/yoursignings",
    });
  };

  const TicketCard = ({ ticket, index }) => {
    const isProcessing = isSubmitting && currentEvent === `non_comp-${index}`;
    const canCancel = ticket.cancellable && !ticket.cancelled;

    // Format timestamp
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    // Format time slot
    const formatTimeSlot = (timeSlot) => {
      if (!timeSlot) return '';
      const date = new Date(timeSlot);
      return date.toLocaleString('en-US', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border hover:border-primary/30">
        <div className={`h-2 w-full ${ticket.cancelled ? 'bg-destructive' : 'bg-primary'}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {ticket.non_comp_name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs font-normal">Event Ticket</Badge>
                <span>ID: {ticket.ticket_id}</span>
              </div>
            </div>
            {getStatusBadge(ticket.cancelled)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Time Slot */}
              {ticket.time_slot && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</p>
                        <p className="text-sm font-medium">{formatTimeSlot(ticket.time_slot)}</p>
                    </div>
                </div>
              )}

              {/* Venue */}
              {ticket.venue && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Venue</p>
                        <p className="text-sm font-medium">{ticket.venue}</p>
                    </div>
                </div>
              )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Price:</span>
                {ticket.price > 0 ? (
                    <span className="text-lg font-bold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {ticket.price}
                    </span>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Free</Badge>
                )}
             </div>

             {ticket.timestamp && (
                <div className="text-xs text-muted-foreground">
                  Purchased: {formatTimestamp(ticket.timestamp)}
                </div>
             )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t pt-4">
            <div className="w-full flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {canCancel ? "Cancellation available" : ticket.cancelled ? "Ticket cancelled" : "Cannot be cancelled"}
                </div>
                <Button
                  variant={canCancel ? "destructive" : "ghost"}
                  size="sm"
                  disabled={!canCancel || isSubmitting}
                  onClick={() => canCancel && handleCancelTicket(ticket.ticket_id, index)}
                  className={`min-w-[100px] transition-all ${!canCancel && !ticket.cancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Wait
                    </div>
                  ) : canCancel ? (
                    "Cancel Ticket"
                  ) : ticket.cancelled ? (
                    "Cancelled"
                  ) : (
                    "Locked"
                  )}
                </Button>
            </div>
        </CardFooter>
      </Card>
    );
  };

  const MerchCard = ({ merch, index }) => {
    const isProcessing = isSubmitting && currentMerch === `merch-${index}`;
    const canCancel = merch.cancellable && !merch.cancelled;
    const displaySize = merch.size === "A" ? "Universal" : merch.size;

    // Format timestamp
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border hover:border-purple-500/30">
        <div className={`h-2 w-full ${merch.cancelled ? 'bg-destructive' : 'bg-purple-600'}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                {merch.merch_name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-700 bg-purple-50">Merch Order</Badge>
                {merch.quantity && <span>Qty: {merch.quantity}</span>}
              </div>
            </div>
            {getStatusBadge(merch.cancelled)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
              {/* Merch Image */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg overflow-hidden shrink-0 border">
                {merch.merch_image_url ? (
                    <img
                        src={merch.merch_image_url}
                        alt={merch.merch_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" />
                    </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                  <div className="flex flex-col gap-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Size</p>
                      <p className="text-sm font-medium">{displaySize || "N/A"}</p>
                  </div>

                  {merch.is_customised && merch.customisation_text && (
                      <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Customization</p>
                          <p className="text-sm font-medium italic">"{merch.customisation_text}"</p>
                      </div>
                  )}
              </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                {merch.price > 0 ? (
                    <span className="text-lg font-bold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {merch.price}
                    </span>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Free</Badge>
                )}
             </div>

             {merch.timestamp && (
                <div className="text-xs text-muted-foreground">
                  Purchased: {formatTimestamp(merch.timestamp)}
                </div>
             )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t pt-4">
            <div className="w-full flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {canCancel ? "Cancellation available" : merch.cancelled ? "Order cancelled" : "Cannot be cancelled"}
                </div>
                <Button
                  variant={canCancel ? "destructive" : "ghost"}
                  size="sm"
                  disabled={!canCancel || isSubmitting}
                  onClick={() => canCancel && handleCancelMerch(merch.id, index)}
                  className={`min-w-[100px] transition-all ${!canCancel && !merch.cancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Wait
                    </div>
                  ) : canCancel ? (
                    "Cancel Order"
                  ) : merch.cancelled ? (
                    "Cancelled"
                  ) : (
                    "Locked"
                  )}
                </Button>
            </div>
        </CardFooter>
      </Card>
    );
  };

  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted rounded-xl bg-muted/10">
      <div className="rounded-full bg-muted p-4 mb-4">
        {type === 'merch' ? <ShoppingBag className="h-8 w-8 text-muted-foreground" /> : <Ticket className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-1">No {type === 'merch' ? 'Merch Orders' : 'Tickets'} Found</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {type === 'merch'
            ? "You haven't ordered any merchandise yet."
            : "You haven't signed up for any events yet."}
      </p>
      <Button asChild variant="outline">
        <Link to={type === 'merch' ? "/" : "/events"}>
            Browse {type === 'merch' ? "Store" : "Events"}
        </Link>
      </Button>
    </div>
  );

  const ErrorState = ({ message }) => (
    <Alert className="border-destructive/30 bg-destructive/10 max-w-2xl mx-auto">
      <AlertCircle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-destructive">
        <div className="space-y-2">
          <p className="font-semibold">Error Loading Signings</p>
          <p>{message || "An error occurred while fetching your data."}</p>
        </div>
      </AlertDescription>
    </Alert>
  );

  const hasTickets = eventData.data?.non_comp_tickets && eventData.data.non_comp_tickets.length > 0;
  const hasMerch = eventData.data?.merch_tickets && eventData.data.merch_tickets.length > 0;

  return (
    <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
      <div className="pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-heading-primary mb-4 flex items-center justify-center gap-3">
              <Ticket className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              Your Signings
            </h1>
            <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
              Track your tickets and orders in one place
            </p>
          </div>

          {/* Content */}
          {eventData?.isError ? (
            <ErrorState message={eventData.message} />
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              {actionData && !actionData.isError && (
                <Alert className="border-green-600/30 bg-green-600/10 max-w-2xl mx-auto mb-6">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {actionData.message}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue={hasTickets ? "tickets" : (hasMerch ? "merch" : "tickets")} className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Event Tickets
                            {hasTickets && <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-current h-5 px-1.5">{eventData.data.non_comp_tickets.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="merch" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            Merch Orders
                            {hasMerch && <Badge variant="secondary" className="ml-2 bg-white/20 text-current h-5 px-1.5">{eventData.data.merch_tickets.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="tickets" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                    {hasTickets ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {eventData.data.non_comp_tickets.map((ticket, index) => (
                            <TicketCard
                                key={index}
                                ticket={ticket}
                                index={index}
                            />
                            ))}
                        </div>
                    ) : (
                        <EmptyState type="tickets" />
                    )}
                </TabsContent>

                <TabsContent value="merch" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                    {hasMerch ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...eventData.data.merch_tickets]
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .map((merch, index) => (
                                <MerchCard
                                key={index}
                                merch={merch}
                                index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState type="merch" />
                    )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default YourSignings;

export async function loader({ request }) {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  if (!refreshToken || !accessToken) {
    const url = new URL(request.url);
    const from = url.pathname + url.search + url.hash;
    return redirect(`/signin?redirectTo=${encodeURIComponent(from)}`);
  }

  try {
    const [ticketsResponse, merchResponse] = await Promise.all([
      axios.get(`${apiBaseURL}/api/tickets`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(`${merchBaseURL}/user_merch`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => ({ data: [] })) // Handle if merch endpoint fails
    ]);
    
    return {
      isError: false,
      data: {
        ...ticketsResponse.data,
        merch_tickets: merchResponse.data
      },
      message: "Signings fetched successfully",
    };
  } catch (error) {
    return {
      isError: true,
      message: extractErrorMessage(error, "An error occurred while fetching signings"),
    };
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  if (!refreshToken || !accessToken) {
    const url = new URL(request.url);
    const from = url.pathname + url.search + url.hash;
    return redirect(`/signin?redirectTo=${encodeURIComponent(from)}`);
  }

  try {
    const nonCompTicketId = formData.get("non_comp_ticket_id");
    const merchTicketId = formData.get("merch_ticket_id");

    if (nonCompTicketId) {
      await axios.post(
        `${apiBaseURL}/api/non-comp-cancel/${nonCompTicketId}/`,
        {
          access_token: accessToken,
          non_comp_ticket_id: nonCompTicketId,
        },
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return {
        isError: false,
        message: "Ticket cancelled successfully",
      };
    } else if (merchTicketId) {
      await axios.post(
        `${apiBaseURL}/tickets-manager/cancel_merch/${merchTicketId}`,
        {},
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return {
        isError: false,
        message: "Merch cancelled successfully",
      };
    }

    return {
      isError: true,
      message: "Invalid cancellation request",
    };
  } catch (error) {
    return {
      isError: true,
      message: extractErrorMessage(error, "An error occurred while processing the cancellation"),
    };
  }
}
