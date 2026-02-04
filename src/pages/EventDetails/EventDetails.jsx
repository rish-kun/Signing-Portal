import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseURL, merchBaseURL } from "../../global";
import { getAccessToken } from "../../assets/utils/auth.js";
import { handleApiErrorToast, showSuccessToast, showLoadingToast, dismissToast, showErrorToast } from "../../assets/utils/toast.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertCircle
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

  useEffect(() => {
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
    if (isNaN(date.getTime())) return isoString; // fallback to original if invalid
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

  const VenueMap = ({ venue }) => (
    <div className="w-full h-48 bg-muted rounded-lg overflow-hidden relative mb-4 border border-border/50 shadow-inner">
         <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
             <div className="text-center z-10">
                <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
                <span className="text-sm text-foreground font-medium">{venue || "Venue Location"}</span>
             </div>
         </div>
         {/* Decorative pattern to simulate map */}
         <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#444cf7_1px,transparent_1px)] [background-size:16px_16px]"></div>
         <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
        <div className="container mx-auto p-4 sm:p-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4 sm:mb-6 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-64 w-full md:col-span-2 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!event && !merch)) {
    return (
      <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
        <div className="container mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h3 className="text-xl font-bold mb-2">Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || "The item you're looking for doesn't exist or has been removed."}
              </p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Merch Layout
  if (eventType === "merch" && merch) {
    const images = merch.extra_images_url 
      ? [merch.front_image_url, ...merch.extra_images_url] 
      : [merch.front_image_url];

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Merch Store
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Images */}
            <div className="space-y-4">
                 <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden border shadow-sm">
                      <img 
                        src={images[currentImageIndex]} 
                        alt={merch.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                        onClick={() => setImageZoomOpen(true)}
                      />
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white/80 hover:bg-white"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white/80 hover:bg-white"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          >
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                          </Button>
                        </>
                      )}
                      <div className="absolute bottom-4 right-4">
                         <Button size="icon" variant="secondary" className="rounded-full shadow-md" onClick={() => setImageZoomOpen(true)}>
                            <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                 </div>
                 {/* Thumbnails if needed, or simple dots */}
                 {images.length > 1 && (
                    <div className="flex justify-center gap-2">
                         {images.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                         ))}
                    </div>
                 )}
            </div>

            {/* Right Column: Details */}
            <div className="space-y-8">
                <div>
                    <div className="flex items-start justify-between gap-4">
                         <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-heading">{merch.name}</h1>
                         <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            Merch
                        </Badge>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary flex items-center">
                            <IndianRupee className="h-6 w-6" />
                            {merch.price}
                        </span>
                        {merch.price === 0 && <span className="text-green-600 font-medium ml-2">Free</span>}
                    </div>
                </div>

                <Separator />

                <div className="space-y-6">
                    {/* Size Selector */}
                    {merch.sizes && merch.sizes.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Select Size</h3>
                                <Button variant="link" size="sm" onClick={() => setSizeChartOpen(true)} className="h-auto p-0 text-primary">
                                    Size Chart
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {merch.sizes.map((size) => (
                                    <div key={size.id} className="relative">
                                        <input
                                            type="radio"
                                            name="size"
                                            id={`size-${size.id}`}
                                            value={size.id}
                                            checked={selectedSize === String(size.id)}
                                            onChange={(e) => setSelectedSize(e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <label
                                            htmlFor={`size-${size.id}`}
                                            className="flex items-center justify-center rounded-md border border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary peer-checked:font-medium"
                                        >
                                            {size.name === "A" ? "Universal" : size.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-3">
                         <h3 className="text-sm font-medium">Quantity</h3>
                         <div className="flex items-center gap-4">
                             <div className="flex items-center border rounded-md">
                                 <Button variant="ghost" size="icon" onClick={() => setMerchQuantity(Math.max(1, merchQuantity - 1))} disabled={merchQuantity <= 1}>
                                    <Minus className="h-4 w-4" />
                                 </Button>
                                 <span className="w-12 text-center font-medium">{merchQuantity}</span>
                                 <Button variant="ghost" size="icon" onClick={() => setMerchQuantity(Math.min(25, merchQuantity + 1))} disabled={merchQuantity >= 25}>
                                    <Plus className="h-4 w-4" />
                                 </Button>
                             </div>
                             <span className="text-sm text-muted-foreground">Limit: 25</span>
                         </div>
                    </div>

                    {/* Customization */}
                    {merch.is_customisable && (
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium">Customization</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Personalize your item (+₹{merch.customisation_price || 0})
                                    </p>
                                </div>
                                <Switch checked={customizationEnabled} onCheckedChange={setCustomizationEnabled} />
                             </div>
                             {customizationEnabled && (
                                <Input
                                    placeholder={`Enter ${merch.customisation_type || "text"}...`}
                                    value={customizationText}
                                    onChange={(e) => setCustomizationText(e.target.value)}
                                    className="bg-background"
                                />
                             )}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 pt-4 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-t mt-8">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold flex items-center">
                             <IndianRupee className="h-5 w-5" />
                             {(merch.price + (customizationEnabled && merch.is_customisable ? (merch.customisation_price || 0) : 0)) * merchQuantity}
                        </span>
                     </div>
                     <Button
                        size="lg"
                        className="w-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        onClick={handleMerchBuy}
                        disabled={purchaseLoading || (merch.sizes && merch.sizes.length > 0 && !selectedSize)}
                     >
                         {purchaseLoading ? (
                            <>
                                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Processing...
                            </>
                         ) : "Buy Now"}
                     </Button>
                </div>

            </div>
          </div>

          {/* Zoom Dialog */}
          <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
             <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
                 <div className="relative w-full h-full flex items-center justify-center">
                      <img src={images[currentImageIndex]} alt={merch.name} className="max-w-full max-h-full object-contain" />
                      <Button variant="secondary" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setImageZoomOpen(false)}>
                          <CheckCircle className="h-4 w-4 rotate-45" /> {/* Using CheckCircle as fake close icon or X */}
                      </Button>
                 </div>
             </DialogContent>
          </Dialog>

          {/* Size Chart Dialog */}
          <Dialog open={sizeChartOpen} onOpenChange={setSizeChartOpen}>
             <DialogContent className="max-w-3xl">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Size Chart</h3>
                    <div className="rounded-lg overflow-hidden bg-muted">
                        <img
                          src={
                            merch.name.toLowerCase().includes('hoodie') ||
                            merch.name.toLowerCase().includes('sweatshirt')
                              ? "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604890/hoodie_n8sah7.jpg"
                              : "https://res.cloudinary.com/dmcy7qqn7/image/upload/v1760604896/tee_zmxxfx.jpg"
                          }
                          alt="Size Chart"
                          className="w-full h-auto"
                        />
                    </div>
                </div>
             </DialogContent>
          </Dialog>

        </div>
      </div>
    );
  }

  // Non-Comp Layout
  const sortedDates = [...event.dates].sort((a, b) => {
    // ... same sort logic ...
    const parseDate = (dateStr) => {
        const [day, month] = dateStr.split(' ');
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        return new Date(new Date().getFullYear(), monthMap[month], parseInt(day));
      };
      return parseDate(a.date) - parseDate(b.date);
  });

  return (
    <div className="min-h-screen bg-app-gradient pb-20 md:pb-8">
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
        
        <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-heading text-foreground">{event.non_comp_name}</h1>
                    <Badge variant="outline" className="w-fit text-sm px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                        Event
                    </Badge>
                 </div>
                 <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {event.description}
                 </p>
            </div>

            <Separator />

            {/* Content Tabs */}
            <Card className="border-none shadow-none bg-transparent">
                 <Tabs value={activeDateTab.toString()} onValueChange={(value) => setActiveDateTab(parseInt(value))} className="space-y-6">
                      <div className="flex items-center justify-between">
                           <h3 className="text-xl font-semibold">Select a Date</h3>
                      </div>
                      <div className="p-1 bg-muted rounded-xl inline-flex">
                           <TabsList className="bg-transparent h-auto p-0 gap-2">
                                {sortedDates.map((dateObj, idx) => (
                                     <TabsTrigger
                                        key={dateObj.date}
                                        value={idx.toString()}
                                        className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                                     >
                                        {dateObj.date}
                                     </TabsTrigger>
                                ))}
                           </TabsList>
                      </div>

                      {sortedDates.map((dateObj, idx) => (
                           <TabsContent key={dateObj.date} value={idx.toString()} className="mt-0">
                                <div className="grid gap-4">
                                     {dateObj.slots.length > 0 ? (
                                         dateObj.slots.map((slot) => (
                                             <Card key={slot.slot_id} className={`overflow-hidden transition-all duration-300 ${openSlotIds.includes(slot.slot_id) ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'} ${!slot.is_openforsignings ? 'opacity-75 bg-muted/50' : ''}`}>
                                                  <div
                                                    className="p-4 sm:p-6 cursor-pointer"
                                                    onClick={() => slot.is_openforsignings && handleSlotToggle(slot.slot_id)}
                                                  >
                                                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="space-y-1">
                                                                 <div className="flex items-center gap-2">
                                                                     <Clock className="h-4 w-4 text-primary" />
                                                                     <span className="font-semibold text-lg">
                                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                                     </span>
                                                                 </div>
                                                                 <div className="flex items-center gap-2 text-muted-foreground">
                                                                     <MapPin className="h-4 w-4" />
                                                                     <span>{slot.venue}</span>
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                 <Badge variant={slot.is_openforsignings ? "default" : "secondary"}>
                                                                     {slot.is_openforsignings ? "Open" : "Closed"}
                                                                 </Badge>
                                                                 {slot.is_openforsignings && (
                                                                     <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${openSlotIds.includes(slot.slot_id) ? '-rotate-90' : 'rotate-180'}`} />
                                                                 )}
                                                            </div>
                                                       </div>
                                                  </div>

                                                  {/* Expanded Content */}
                                                  {openSlotIds.includes(slot.slot_id) && slot.is_openforsignings && (
                                                       <div className="border-t bg-muted/10 p-4 sm:p-6 space-y-6 animate-in slide-in-from-top-2">
                                                            <VenueMap venue={slot.venue} />

                                                            <div className="space-y-4">
                                                                 <h4 className="font-medium">Ticket Options</h4>
                                                                 {slot.ticket_types && slot.ticket_types.length > 0 ? (
                                                                     <div className="space-y-4">
                                                                          <Select
                                                                              value={selectedTicketType[slot.slot_id] || ""}
                                                                              onValueChange={(value) => handleTicketTypeChange(slot.slot_id, value)}
                                                                          >
                                                                              <SelectTrigger className="w-full bg-background h-12">
                                                                                  <SelectValue placeholder="Select ticket category" />
                                                                              </SelectTrigger>
                                                                              <SelectContent>
                                                                                  {slot.ticket_types.map((tt) => (
                                                                                      <SelectItem key={tt.ticket_type_id} value={tt.ticket_type_id}>
                                                                                          {tt.ticket_type_name} {tt.price > 0 ? `- ₹${tt.price}` : '(Free)'}
                                                                                      </SelectItem>
                                                                                  ))}
                                                                              </SelectContent>
                                                                          </Select>

                                                                          {selectedTicketType[slot.slot_id] && (
                                                                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 p-4 bg-background rounded-lg border">
                                                                                   <div className="space-y-1">
                                                                                        <p className="text-sm font-medium">Quantity</p>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTicketCount(slot.slot_id, -1)} disabled={(ticketCounts[slot.slot_id] || 1) <= 1}>
                                                                                                <Minus className="h-3 w-3" />
                                                                                            </Button>
                                                                                            <span className="w-8 text-center font-bold">{ticketCounts[slot.slot_id] || 1}</span>
                                                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTicketCount(slot.slot_id, 1)}>
                                                                                                <Plus className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                   </div>

                                                                                   <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                                                                        <div className="flex items-baseline gap-1">
                                                                                            <span className="text-sm text-muted-foreground">Total:</span>
                                                                                            <span className="text-xl font-bold flex items-center">
                                                                                                <IndianRupee className="h-4 w-4" />
                                                                                                {(ticketCounts[slot.slot_id] || 1) * (slot.ticket_types.find(t => t.ticket_type_id === selectedTicketType[slot.slot_id])?.price || 0)}
                                                                                            </span>
                                                                                        </div>
                                                                                        <Button onClick={() => handleNonCompBuy(slot)} disabled={purchaseLoading} className="w-full sm:w-auto shadow-md">
                                                                                            {purchaseLoading ? "Processing..." : "Confirm Booking"}
                                                                                        </Button>
                                                                                   </div>
                                                                              </div>
                                                                          )}
                                                                     </div>
                                                                 ) : (
                                                                     <Alert>
                                                                         <Info className="h-4 w-4" />
                                                                         <AlertDescription>No tickets currently available.</AlertDescription>
                                                                     </Alert>
                                                                 )}
                                                            </div>
                                                       </div>
                                                  )}
                                             </Card>
                                         ))
                                     ) : (
                                          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                              <p className="text-muted-foreground">No slots available for this date.</p>
                                          </div>
                                     )}
                                </div>
                           </TabsContent>
                      ))}
                 </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
