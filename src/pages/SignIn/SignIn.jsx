import { React, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { apiBaseURL } from "../../global";
import axios from "axios";
import { handleApiErrorToast, showLoadingToast, dismissToast } from "../../assets/utils/toast.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";

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
    // Use the API error handling to show the actual error message from the server
    // If it's a BITS email validation error, the API should return the appropriate message
    handleApiErrorToast(error, "Please use your BITS email ID to sign in. If your BITS email ID is not working, please contact support.");
  };

  return (
    <div className="min-h-screen bg-app-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
             <img src="https://res.cloudinary.com/dhrbeqvcw/image/upload/v1760900997/logo2_r7itzj.png" alt="Signings Portal Logo" className="h-16 w-16 drop-shadow-md" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground font-heading tracking-tight">
          Signings Portal
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to access events and merchandise
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-xl font-semibold">
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
             {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <div className="text-center">
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </div>
             ) : (
                <div className="space-y-6">
                  <div className="flex justify-center w-full">
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={handleError}
                      auto_select={true}
                      shape="pill"
                      theme="filled_black"
                      text="continue_with"
                      size="large"
                      width="320"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Note
                      </span>
                    </div>
                  </div>

                  <Alert className="border-primary/20 bg-primary/5">
                    <AlertDescription className="text-primary text-xs text-center font-medium">
                      Please use your official BITS Pilani email address for authentication.
                    </AlertDescription>
                  </Alert>
                </div>
             )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by DVM, BITS Pilani
        </p>
      </footer>
    </div>
  );
};

export default SignIn;
