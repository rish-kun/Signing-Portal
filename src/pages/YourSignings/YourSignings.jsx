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
} from "react-router";
import { useState, useEffect } from "react";
import { getAccessToken, getRefreshToken } from "../../assets/utils/auth.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ticket, Calendar, IndianRupee, AlertCircle, CheckCircle, XCircle, MapPin, ShoppingBag, Clock, QrCode, Clipboard } from "lucide-react";

function YourSignings() {
  const eventData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null); // { type: 'ticket'|'merch', id: string, index: number }

  // Show toast notifications for action results
  useEffect(() => {
    if (actionData?.isError) {
      showErrorToast(actionData.message);
    } else if (actionData && !actionData.isError) {
      showSuccessToast(actionData.message);
      setCancelDialogOpen(false);
      setItemToCancel(null);
    }
  }, [actionData]);

  const confirmCancellation = () => {
    if (!itemToCancel) return;

    const formData = new FormData();
    if (itemToCancel.type === 'ticket') {
        formData.append(`non_comp_ticket_id`, itemToCancel.id);
    } else {
        formData.append(`merch_ticket_id`, itemToCancel.id);
    }

    submit(formData, {
      method: "post",
      action: "/yoursignings",
    });
  };

  const getStatusBadge = (cancelled) => {
    if (cancelled) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle className="h-3 w-3" />
        Confirmed
      </Badge>
    );
  };

  const TicketCard = ({ ticket, index }) => {
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
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 border-l-primary">
        <div className="absolute top-0 right-0 p-4">
             {getStatusBadge(ticket.cancelled)}
        </div>

        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
               <Badge variant="outline" className="mb-2 w-fit">Event Ticket</Badge>
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                {ticket.non_comp_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                 <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ID: {ticket.ticket_id}</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                     navigator.clipboard.writeText(ticket.ticket_id);
                     showSuccessToast("Copied Ticket ID");
                 }}>
                     <Clipboard className="h-3 w-3" />
                 </Button>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</p>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{ticket.time_slot ? formatTimeSlot(ticket.time_slot) : "Time TBD"}</span>
                    </div>
                </div>

                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Venue</p>
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{ticket.venue || "Venue TBD"}</span>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{ticket.price > 0 ? ticket.price : "Free"}</span>
                 </div>

                 {/* QR Code Placeholder (if applicable) */}
                 <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
                     <QrCode className="h-3 w-3" />
                     Show QR
                 </Button>
            </div>
        </CardContent>

        <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
             <div className="text-xs text-muted-foreground">
                Purchased: {formatTimestamp(ticket.timestamp)}
             </div>
             {canCancel && (
                 <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        setItemToCancel({ type: 'ticket', id: ticket.ticket_id, index });
                        setCancelDialogOpen(true);
                    }}
                >
                    Cancel Ticket
                </Button>
             )}
        </CardFooter>
      </Card>
    );
  };

  const MerchCard = ({ merch, index }) => {
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
      <Card className="group flex flex-col md:flex-row overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 border-l-secondary">
         {/* Image Section */}
         <div className="w-full md:w-48 h-48 md:h-auto bg-muted shrink-0 relative">
             {merch.merch_image_url ? (
                 <img
                    src={merch.merch_image_url}
                    alt={merch.merch_name}
                    className="w-full h-full object-cover"
                 />
             ) : (
                 <div className="w-full h-full flex items-center justify-center">
                     <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                 </div>
             )}
              <div className="absolute top-2 right-2 md:hidden">
                {getStatusBadge(merch.cancelled)}
            </div>
         </div>

        <div className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className="w-fit">Merchandise</Badge>
                             <div className="hidden md:block">
                                 {getStatusBadge(merch.cancelled)}
                             </div>
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-secondary transition-colors">
                            {merch.merch_name}
                        </CardTitle>
                        <CardDescription>
                            Order ID: {merch.id}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-4">
                    {displaySize && (
                        <div className="bg-muted px-3 py-1 rounded-md text-sm">
                            <span className="text-muted-foreground mr-1">Size:</span>
                            <span className="font-medium">{displaySize}</span>
                        </div>
                    )}
                    {merch.quantity && (
                         <div className="bg-muted px-3 py-1 rounded-md text-sm">
                            <span className="text-muted-foreground mr-1">Qty:</span>
                            <span className="font-medium">{merch.quantity}</span>
                        </div>
                    )}
                </div>

                {merch.is_customised && (
                    <div className="text-sm bg-secondary/10 p-2 rounded border border-secondary/20">
                        <span className="font-medium text-secondary-foreground">Customization: </span>
                        {merch.customisation_text}
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/30 p-4 flex justify-between items-center mt-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ordered: {formatTimestamp(merch.timestamp)}</span>
                    <div className="flex items-center gap-1 font-bold">
                        <IndianRupee className="h-3 w-3" />
                        {merch.price}
                    </div>
                </div>
                {canCancel && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            setItemToCancel({ type: 'merch', id: merch.id, index });
                            setCancelDialogOpen(true);
                        }}
                    >
                        Cancel Order
                    </Button>
                )}
            </CardFooter>
        </div>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
      <div className="rounded-full bg-muted p-4 mb-6">
        <Ticket className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-heading-tertiary mb-2">No Signings Found</h3>
      <p className="text-body text-muted-foreground max-w-md mb-8">
        You haven't signed up for any events or purchased merch yet.
      </p>
      <div className="flex gap-4">
          <Button asChild variant="default">
            <a href="/events">Browse Events</a>
          </Button>
           <Button asChild variant="outline">
            <a href="/">Shop Merch</a>
          </Button>
      </div>
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
        <Alert className="border-destructive/30 bg-destructive/10 max-w-lg w-full">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription className="text-destructive-foreground/80">
            {message || "An error occurred while fetching your signings."}
        </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="link" className="mt-4">
            Try Again
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-app-gradient pb-20 md:pb-8 pt-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground">Manage your tickets and orders</p>
          </div>

          {/* Content */}
          {eventData?.isError ? (
            <ErrorState message={eventData.message} />
          ) : (
            <>
                {(!eventData.data.non_comp_tickets?.length && !eventData.data.merch_tickets?.length) ? (
                    <EmptyState />
                ) : (
                    <Tabs defaultValue="tickets" className="space-y-6">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                            <TabsTrigger value="tickets">
                                Events ({eventData.data.non_comp_tickets?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="merch">
                                Merchandise ({eventData.data.merch_tickets?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="tickets" className="space-y-4 animate-in slide-in-from-left-4 duration-500">
                             {eventData.data.non_comp_tickets?.length > 0 ? (
                                 <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                     {eventData.data.non_comp_tickets.map((ticket, index) => (
                                        <TicketCard key={index} ticket={ticket} index={index} />
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                     <p className="text-muted-foreground">No active event tickets</p>
                                      <Button variant="link" asChild className="mt-2"><a href="/events">Browse Events</a></Button>
                                 </div>
                             )}
                        </TabsContent>

                        <TabsContent value="merch" className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                             {eventData.data.merch_tickets?.length > 0 ? (
                                 <div className="space-y-4">
                                     {[...eventData.data.merch_tickets]
                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                        .map((merch, index) => (
                                            <MerchCard key={index} merch={merch} index={index} />
                                     ))}
                                 </div>
                             ) : (
                                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                     <p className="text-muted-foreground">No merchandise orders</p>
                                     <Button variant="link" asChild className="mt-2"><a href="/">Shop Merch</a></Button>
                                 </div>
                             )}
                        </TabsContent>
                    </Tabs>
                )}
            </>
          )}
        </div>

        {/* Cancellation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Cancellation</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this {itemToCancel?.type === 'ticket' ? 'ticket' : 'order'}?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>Keep it</Button>
                    <Button variant="destructive" onClick={confirmCancellation} disabled={isSubmitting}>
                        {isSubmitting ? "Cancelling..." : "Yes, Cancel"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
      }).catch(() => ({ data: [] }))
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
