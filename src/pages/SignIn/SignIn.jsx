import { React, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { apiBaseURL } from "../../global";
import axios from "axios";
import { handleApiErrorToast, showLoadingToast, dismissToast } from "../../assets/utils/toast.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShieldCheck, Calendar, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirectTo") || "/";
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLoginSuccess = (credentialResponse) => {
    setIsLoading(true);
    const loadingToastId = showLoadingToast("Signing you in...");

    axios
      .post(
        `${apiBaseURL}/api/auth/`,
        {
          token: credentialResponse.credential,
        },
        {
          headers: {
            accept: "application/json",
          },
        }
      )
        .then((response) => {
        setIsLoading(false);
        dismissToast(loadingToastId);

        localStorage.setItem(
          "username",
          jwtDecode(credentialResponse.credential).name
        );
        localStorage.setItem(
          "profilePicURL",
          jwtDecode(credentialResponse.credential).picture
        );

        localStorage.setItem("accessToken", response.data.tokens.access);
        localStorage.setItem("refreshToken", response.data.tokens.refresh);
        const accessTokenExpiry = new Date();
        accessTokenExpiry.setDate(accessTokenExpiry.getDate() + 1);
        localStorage.setItem(
          "accessTokenExpiry",
          accessTokenExpiry.toISOString()
        );
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
        localStorage.setItem(
          "refreshTokenExpiry",
          refreshTokenExpiry.toISOString()
        );
        navigate(redirectTo, { replace: true });
      })
      .catch((error) => {
        setIsLoading(false);
        dismissToast(loadingToastId);
        handleError(error);
      });
  };

  const handleError = (error) => {
    handleApiErrorToast(error, "Please use your BITS email ID to sign in. If your BITS email ID is not working, please contact support.");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-2 w-full max-w-5xl gap-8 lg:gap-16 items-center">

        {/* Left Column: Branding (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col space-y-6">
           <div className="space-y-2">
                <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary">Official Portal</Badge>
                <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">
                    Experience the <span className="text-primary">Oasis</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                    Your gateway to exclusive events, merchandise, and unforgettable memories at BITS Pilani.
                </p>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-card/50 backdrop-blur border rounded-xl p-4 space-y-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Event Registration</h3>
                    <p className="text-sm text-muted-foreground">Seamless signup for pro shows and events.</p>
                </div>
                <div className="bg-card/50 backdrop-blur border rounded-xl p-4 space-y-2">
                    <Ticket className="h-6 w-6 text-secondary" />
                    <h3 className="font-semibold">Merch Store</h3>
                    <p className="text-sm text-muted-foreground">Grab exclusive hoodies, tees and more.</p>
                </div>
           </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="w-full max-w-md mx-auto">
             <div className="text-center mb-6 lg:hidden">
                <h1 className="text-3xl font-bold mb-2">Signings Portal</h1>
                <p className="text-muted-foreground">Sign in to access events</p>
             </div>

            <Card className="border-border/50 shadow-2xl bg-card/90 backdrop-blur-xl relative overflow-hidden">
                {/* Decorative background accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="space-y-1 text-center pb-8">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">
                    Welcome Back
                </CardTitle>
                <CardDescription>
                    Use your BITS Pilani Google Account
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-full" />
                        <div className="text-center">
                            <Skeleton className="h-4 w-32 mx-auto" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center transform transition-transform hover:scale-105 duration-200">
                            <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={handleError}
                            auto_select={false}
                            shape="pill"
                            theme="filled_black"
                            text="continue_with"
                            size="large"
                            width="100%"
                            />
                        </div>

                        <Alert className="border-primary/20 bg-primary/5">
                            <AlertDescription className="text-xs text-muted-foreground text-center">
                            By continuing, you agree to the Terms of Service and Privacy Policy of DVM, BITS Pilani.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                </CardContent>
            </Card>

             <div className="mt-8 text-center lg:text-left">
                <p className="text-caption flex items-center justify-center lg:justify-start gap-1.5 text-muted-foreground/60">
                Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by DVM
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SignIn;
