import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseURL, merchBaseURL } from "../../global";
import { getAccessToken } from "../../assets/utils/auth.js";
import { handleApiErrorToast, showSuccessToast, showLoadingToast, dismissToast, showErrorToast } from "../../assets/utils/toast.js";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  IndianRupee, 
  Plus, 
  Minus,
  Ticket,
  Info,
  CheckCircle,
  AlertCircle,
  Share2
} from "lucide-react";

function EventDetails() {
  const { eventType, eventIndex } = useParams();
  const accessToken = getAccessToken();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [merch, setMerch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSlotIds, setOpenSlotIds] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState({});
  const [ticketCounts, setTicketCounts] = useState({});
  const [activeDateTab, setActiveDateTab] = useState(0);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [merchQuantity, setMerchQuantity] = useState(1);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customizationText, setCustomizationText] = useState("");
  const [userTickets, setUserTickets] = useState([]);

  useEffect(() => {
    // Fetch user tickets for conflict detection
    if (accessToken) {
        axios.get(`${apiBaseURL}/api/tickets`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                accept: "application/json",
            }
        }).then(res => {
            if (res.data && res.data.non_comp_tickets) {
                setUserTickets(res.data.non_comp_tickets);
            }
        }).catch(err => console.error("Failed to fetch user tickets for conflict check", err));
    }

    if (eventType === "non-comp") {
      const endpoint = `/api/non-comp/${eventIndex}/`;

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
        .catch((err) => {
          console.error("Failed to load event details:", err);
          setError("Event not found or unauthorized.");
          setLoading(false);
          handleApiErrorToast(err, "Failed to load event details. Please try again.");
        });
    } else if (eventType === "merch") {
      axios
        .get(`${merchBaseURL}/merch/${eventIndex}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            accept: "application/json",
          },
        })
        .then((response) => {
          setMerch(response.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load merch details:", err);
          setError("Merch not found or unauthorized.");
          setLoading(false);
          handleApiErrorToast(err, "Failed to load merch details. Please try again.");
        });
    } else {
      setError("Invalid event type.");
      setLoading(false);
    }
  }, [eventType, eventIndex, accessToken]);

  // Preload size chart images for merch
  useEffect(() => {
    if (eventType === "merch" && merch) {
      const tshirtImg = new Image();
      const hoodieImg = new Image();
      tshirtImg.src = "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604896/tee_zmxxfx.jpg";
      hoodieImg.src = "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604890/hoodie_n8sah7.jpg";
    }
  }, [eventType, merch]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

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
      [slotId]: 1,
    }));
  };

  const handleTicketCount = (slotId, delta) => {
    setTicketCounts((prev) => {
      const current = prev[slotId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [slotId]: next };
    });
  };

  const checkForConflict = (slot) => {
      if (!userTickets.length) return false;
      const slotStart = new Date(slot.start_time).getTime();
      const slotEnd = new Date(slot.end_time).getTime();

      return userTickets.some(ticket => {
          if (!ticket.time_slot) return false;
          // Assuming ticket.time_slot is the start time
          const ticketStart = new Date(ticket.time_slot).getTime();
          // Assume 1 hour duration if end time not available, or just check for close proximity
          // Ideally backend provides end time or slot_id.
          // For now, check if start times are within 1 hour of each other
          return Math.abs(ticketStart - slotStart) < 3600000; // 1 hour
      });
  };

  const handleNonCompBuy = async (slot) => {
    const selectedTypeId = selectedTicketType[slot.slot_id];
    const count = ticketCounts[slot.slot_id] || 1;
    if (!selectedTypeId || count < 1) return;
    
    setPurchaseLoading(true);
    const loadingToastId = showLoadingToast("Processing your ticket purchase...");
    
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
      dismissToast(loadingToastId);
      showSuccessToast("Tickets purchased successfully! Redirecting to your signings...");
      setTimeout(() => navigate("/yoursignings"), 1500);
    } catch (err) {
      console.error("Purchase failed:", err);
      dismissToast(loadingToastId);
      handleApiErrorToast(err, "Failed to purchase tickets. Please try again.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleMerchBuy = async () => {
    if (merch.sizes && merch.sizes.length > 0 && !selectedSize) {
      showErrorToast("Please select a size");
      return;
    }
    if (merchQuantity < 1 || merchQuantity > 25) {
      showErrorToast("Quantity must be between 1 and 25");
      return;
    }
    if (customizationEnabled && merch.is_customisable && !customizationText.trim()) {
      showErrorToast(`Please enter ${merch.customisation_type || "customization text"}`);
      return;
    }
    
    setPurchaseLoading(true);
    const loadingToastId = showLoadingToast("Processing your merch purchase...");
    
    try {
      const purchaseData = [{
        id: merch.sizes && merch.sizes.length > 0 ? selectedSize : merch.id,
        quantity: merchQuantity,
        ...(merch.is_customisable && {
          is_customised: customizationEnabled && customizationText.trim() ? true : false,
          customisation_text: customizationEnabled && customizationText.trim() ? customizationText.trim() : ""
        })
      }];
      
      await axios.post(
        `${merchBaseURL}/buy_merch`,
        purchaseData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      dismissToast(loadingToastId);
      showSuccessToast("Merch purchased successfully! Redirecting to your signings...");
      setTimeout(() => navigate("/yoursignings"), 1500);
    } catch (err) {
      console.error("Merch purchase failed:", err);
      dismissToast(loadingToastId);
      handleApiErrorToast(err, "Failed to purchase merch. Please try again.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-gradient pb-20 md:pb-8 pt-6">
        <div className="container mx-auto px-4">
           <Skeleton className="h-10 w-32 mb-6" />
           <div className="grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
               </div>
               <div>
                    <Skeleton className="h-96 w-full rounded-xl" />
               </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || (!event && !merch)) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6 space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">Content Not Found</h2>
              <p className="text-muted-foreground">{error || "This item may have been removed or is unavailable."}</p>
              <Button onClick={() => navigate("/")} className="w-full">Back to Home</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // --- MERCH LAYOUT ---
  if (eventType === "merch" && merch) {
    const images = merch.extra_images_url 
      ? [merch.front_image_url, ...merch.extra_images_url] 
      : [merch.front_image_url];

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
      <div className="min-h-screen bg-app-gradient pb-20 md:pb-8 pt-6">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-transparent hover:text-primary pl-0">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Images & Details */}
            <div className="lg:col-span-7 space-y-8">
                <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-2xl overflow-hidden border shadow-sm">
                    <img src={images[currentImageIndex]} alt={merch.name} className="w-full h-full object-contain p-4" />
                    {images.length > 1 && (
                        <>
                            <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg" onClick={prevImage}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg" onClick={nextImage}>
                                <ChevronLeft className="h-5 w-5 rotate-180" />
                            </Button>
                        </>
                    )}
                    <Badge className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur shadow-sm pointer-events-none">
                         {currentImageIndex + 1} / {images.length}
                    </Badge>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Info & Action */}
            <div className="lg:col-span-5">
                <Card className="sticky top-24 border-none shadow-lg bg-card/80 backdrop-blur-md">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <Badge variant="secondary" className="mb-2 text-primary bg-primary/10 hover:bg-primary/20">Merchandise</Badge>
                                <CardTitle className="text-3xl font-bold">{merch.name}</CardTitle>
                             </div>
                             <div className="text-right">
                                <span className="text-3xl font-bold text-primary flex items-center justify-end">
                                    <IndianRupee className="w-6 h-6" /> {merch.price}
                                </span>
                                {merch.price === 0 && <span className="text-sm text-green-600 font-medium block">Free Item</span>}
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Size Selector */}
                        {merch.sizes?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Select Size</label>
                                    <Button variant="link" size="sm" onClick={() => setSizeChartOpen(true)} className="text-primary p-0 h-auto">
                                        Size Chart
                                    </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {merch.sizes.map((size) => (
                                        <button
                                            key={size.id}
                                            onClick={() => setSelectedSize(size.id.toString())}
                                            className={`py-2 text-sm font-medium rounded-md border transition-all ${selectedSize === size.id.toString() ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                        >
                                            {size.name === "A" ? "Univ" : size.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Customization */}
                        {merch.is_customisable && (
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Customization</label>
                                        <p className="text-xs text-muted-foreground">+₹{merch.customisation_price || 0}</p>
                                    </div>
                                    <Switch checked={customizationEnabled} onCheckedChange={setCustomizationEnabled} />
                                </div>
                                {customizationEnabled && (
                                    <Input
                                        placeholder={`Enter custom ${merch.customisation_type || "text"}`}
                                        value={customizationText}
                                        onChange={(e) => setCustomizationText(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Quantity</label>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" onClick={() => setMerchQuantity(Math.max(1, merchQuantity - 1))} disabled={merchQuantity <= 1}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-bold">{merchQuantity}</span>
                                <Button variant="outline" size="icon" onClick={() => setMerchQuantity(Math.min(25, merchQuantity + 1))} disabled={merchQuantity >= 25}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                             <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{(merch.price + (customizationEnabled && merch.is_customisable ? (merch.customisation_price || 0) : 0)) * merchQuantity}</span>
                             </div>
                             <Button size="lg" className="w-full text-lg font-semibold" onClick={handleMerchBuy} disabled={purchaseLoading}>
                                {purchaseLoading ? "Processing..." : "Add to Cart & Pay"}
                             </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>

        {/* Size Chart Dialog */}
        <Dialog open={sizeChartOpen} onOpenChange={setSizeChartOpen}>
            <DialogContent className="max-w-3xl">
                <img
                    src={merch.name.toLowerCase().includes('hoodie') || merch.name.toLowerCase().includes('sweatshirt')
                        ? "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604890/hoodie_n8sah7.jpg"
                        : "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604896/tee_zmxxfx.jpg"
                    }
                    alt="Size Chart"
                    className="w-full rounded-lg"
                />
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- EVENTS LAYOUT ---
  // Sort dates
  const sortedDates = event.dates ? [...event.dates].sort((a, b) => {
    const parseDate = (dateStr) => {
      const [day, month] = dateStr.split(' ');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      return new Date(new Date().getFullYear(), monthMap[month], parseInt(day));
    };
    return parseDate(a.date) - parseDate(b.date);
  }) : [];

  return (
    <div className="min-h-screen bg-app-gradient pb-20 md:pb-8 pt-6">
       <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-transparent hover:text-primary pl-0">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid lg:grid-cols-12 gap-8">
             {/* Left Column: Info */}
             <div className="lg:col-span-8 space-y-8">
                 <div className="space-y-4">
                     <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Event</Badge>
                     <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{event.non_comp_name}</h1>
                     <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
                 </div>

                 {/* Venue Map Placeholder */}
                 <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Venue Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="relative w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden group">
                             <div className="absolute inset-0 bg-primary/5 pattern-dots" />
                             <div className="text-center z-10">
                                 <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
                                 <p className="font-medium">Campus Location</p>
                                 <p className="text-sm text-muted-foreground">Detailed venue map not available</p>
                             </div>
                         </div>
                    </CardContent>
                 </Card>
             </div>

             {/* Right Column: Schedule & Booking */}
             <div className="lg:col-span-4">
                 <Card className="sticky top-24 border-none shadow-xl bg-card/80 backdrop-blur-md">
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                             <Calendar className="h-5 w-5 text-primary" /> Select Date & Slot
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-0">
                         <Tabs defaultValue="0" className="w-full">
                             <div className="px-6 pb-2">
                                <TabsList className="w-full grid grid-cols-3">
                                    {sortedDates.map((dateObj, idx) => (
                                        <TabsTrigger key={dateObj.date} value={idx.toString()}>{dateObj.date}</TabsTrigger>
                                    ))}
                                </TabsList>
                             </div>

                             {sortedDates.map((dateObj, idx) => (
                                 <TabsContent key={dateObj.date} value={idx.toString()} className="px-6 pb-6 pt-2 space-y-4 mt-0">
                                     {dateObj.slots.length > 0 ? (
                                         <div className="space-y-3">
                                             {dateObj.slots.map((slot) => (
                                                 <div key={slot.slot_id} className={`rounded-xl border transition-all ${slot.is_openforsignings ? 'bg-card hover:border-primary/50' : 'bg-muted/50 opacity-70'}`}>
                                                     <div
                                                        className="p-4 cursor-pointer flex justify-between items-center"
                                                        onClick={() => slot.is_openforsignings && handleSlotToggle(slot.slot_id)}
                                                     >
                                                         <div>
                                                             <div className="flex items-center gap-2 mb-1">
                                                                 <Badge variant={slot.is_openforsignings ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                                                                    {slot.is_openforsignings ? "Open" : "Closed"}
                                                                 </Badge>
                                                                 <span className="text-sm font-semibold">{formatTime(slot.start_time)}</span>
                                                             </div>
                                                             <p className="text-xs text-muted-foreground">{slot.venue}</p>
                                                         </div>
                                                         {slot.is_openforsignings && (
                                                             <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${openSlotIds.includes(slot.slot_id) ? '-rotate-90' : 'rotate-180'}`} />
                                                         )}
                                                     </div>

                                                     {/* Expanded Content */}
                                                     {openSlotIds.includes(slot.slot_id) && slot.is_openforsignings && (
                                                         <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                                             <Separator className="my-3" />

                                                             {checkForConflict(slot) && (
                                                                 <Alert variant="destructive" className="mb-4">
                                                                     <AlertCircle className="h-4 w-4" />
                                                                     <AlertTitle>Scheduling Conflict</AlertTitle>
                                                                     <AlertDescription>
                                                                         You have another event registered around this time.
                                                                     </AlertDescription>
                                                                 </Alert>
                                                             )}

                                                             {slot.ticket_types?.length > 0 ? (
                                                                 <div className="space-y-4">
                                                                     <Select
                                                                        value={selectedTicketType[slot.slot_id] || ""}
                                                                        onValueChange={(value) => handleTicketTypeChange(slot.slot_id, value)}
                                                                     >
                                                                         <SelectTrigger>
                                                                             <SelectValue placeholder="Choose Ticket Type" />
                                                                         </SelectTrigger>
                                                                         <SelectContent>
                                                                             {slot.ticket_types.map((tt) => (
                                                                                 <SelectItem key={tt.ticket_type_id} value={tt.ticket_type_id}>
                                                                                     {tt.ticket_type_name} - ₹{tt.price}
                                                                                 </SelectItem>
                                                                             ))}
                                                                         </SelectContent>
                                                                     </Select>

                                                                     {selectedTicketType[slot.slot_id] && (
                                                                         <div className="space-y-3">
                                                                             <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                                                                                 <span className="text-sm font-medium">Quantity</span>
                                                                                 <div className="flex items-center gap-2">
                                                                                     <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleTicketCount(slot.slot_id, -1)} disabled={(ticketCounts[slot.slot_id] || 1) <= 1}><Minus className="h-3 w-3" /></Button>
                                                                                     <span className="w-4 text-center text-sm font-bold">{ticketCounts[slot.slot_id] || 1}</span>
                                                                                     <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleTicketCount(slot.slot_id, 1)}><Plus className="h-3 w-3" /></Button>
                                                                                 </div>
                                                                             </div>
                                                                             <Button className="w-full font-semibold" onClick={() => handleNonCompBuy(slot)} disabled={purchaseLoading}>
                                                                                 {purchaseLoading ? "Processing..." : (
                                                                                     <>
                                                                                        Confirm & Pay
                                                                                        <span className="ml-2 bg-primary-foreground/20 px-1.5 rounded text-xs">
                                                                                            ₹{(ticketCounts[slot.slot_id] || 1) * (slot.ticket_types.find(t => t.ticket_type_id === selectedTicketType[slot.slot_id])?.price || 0)}
                                                                                        </span>
                                                                                     </>
                                                                                 )}
                                                                             </Button>
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             ) : (
                                                                 <p className="text-sm text-muted-foreground text-center py-2">No tickets available</p>
                                                             )}
                                                         </div>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                     ) : (
                                         <div className="text-center py-8 text-muted-foreground">
                                             <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                             <p>No slots for this date</p>
                                         </div>
                                     )}
                                 </TabsContent>
                             ))}
                         </Tabs>
                     </CardContent>
                 </Card>
             </div>
        </div>
       </div>
    </div>
  );
}

export default EventDetails;
