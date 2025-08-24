import Navbar from "../ComComponent/Navbar/NewNavbar";
import ErrorModal from "../ComComponent/ErrorModal/ErrorModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import axios from "axios";
import { apiBaseURL } from "../../global";
import {
  useLoaderData,
  redirect,
  useSubmit,
  useActionData,
  useNavigation,
} from "react-router";
import { useState } from "react";
import { getAccessToken, getRefreshToken } from "../../assets/utils/auth.js";

function YourSignings() {
  const [errorModal, setErrorModal] = useState(true);
  const [currentEvent, setcurrentEvent] = useState("A-1");
  const eventData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return (
    <div>
      {actionData && actionData.isError && errorModal && (
        <ErrorModal onClick={() => setErrorModal(false)}>
          <p>{actionData.message}</p>
        </ErrorModal>
      )}
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold">Your Signings</h1>
        {eventData?.isError && (
          <div className="text-red-500 mt-4">
            <h2 className="font-bold text-xl">WHOOPS!</h2>
            <p>
              {eventData.message ||
                "An error occurred while fetching signings."}
            </p>
          </div>
        )}
        {!eventData?.isError &&
          (eventData.data.prof_show_tickets ||
            eventData.data.non_comp_tickets) && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventData.data.prof_show_tickets?.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.show_name}</TableCell>
                    <TableCell>&#x20B9;{event.price}</TableCell>
                    <TableCell>
                      <Badge variant={event.cancelled ? "destructive" : "default"}>
                        {event.cancelled ? "Cancelled" : "Confirmed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        disabled={
                          event.cancelled || !event.cancellable || isSubmitting
                        }
                        onClick={() => {
                          if (event.cancelled) return;
                          setErrorModal(true);
                          setcurrentEvent(`A-${index}`);
                          const formData = new FormData();
                          formData.append(
                            "prof_show_ticket_id",
                            event.ticket_id
                          );
                          submit(formData, {
                            method: "post",
                            action: "/yoursignings",
                          });
                        }}
                      >
                        {event.cancellable
                          ? isSubmitting && currentEvent === `A-${index}`
                            ? "Cancelling"
                            : "Cancel"
                          : "Can't Cancel"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {eventData.data.non_comp_tickets?.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.non_comp_name}</TableCell>
                    <TableCell>&#x20B9;{event.price}</TableCell>
                    <TableCell>
                      <Badge variant={event.cancelled ? "destructive" : "default"}>
                        {event.cancelled ? "Cancelled" : "Confirmed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        disabled={
                          event.cancelled || !event.cancellable || isSubmitting
                        }
                        onClick={() => {
                          if (event.cancelled) return;
                          setErrorModal(true);
                          setcurrentEvent(`B-${index}`);
                          const formData = new FormData();
                          formData.append(
                            "non_comp_ticket_id",
                            event.ticket_id
                          );
                          submit(formData, {
                            method: "post",
                            action: "/yoursignings",
                          });
                        }}
                      >
                        {event.cancellable
                          ? isSubmitting && currentEvent === `B-${index}`
                            ? "Cancelling"
                            : "Cancel"
                          : "Can't Cancel"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        {!eventData?.isError &&
          !eventData.data.prof_show_tickets &&
          !eventData.data.non_comp_tickets && (
            <div className="text-center mt-8">
              <h2 className="text-2xl font-bold">No Signings Found</h2>
              <p className="text-muted-foreground">You have not signed up for any events yet.</p>
            </div>
          )}
      </div>
    </div>
  );
}

export default YourSignings;

export async function loader() {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  if (!refreshToken || !accessToken) {
    redirect("/signin");
    return { isError: true, message: "Token is missing" };
  }

  try {
    const response = await axios.get(`${apiBaseURL}/api/tickets`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return {
      isError: false,
      data: response.data,
      message: "Signings fetched successfully",
    };
  } catch (error) {
    return {
      isError: true,
      message:
        error.response?.data || "An error occurred while fetching signings",
    };
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  if (!refreshToken || !accessToken) {
    redirect("/signin");
    return { isError: true, message: "Token is missing" };
  }

  try {
    if (formData.has("prof_show_ticket_id")) {
      const response = await axios.post(
        `${apiBaseURL}/api/prof-show-cancel/${formData.get(
          "prof_show_ticket_id"
        )}/`,
        {
          access_token: accessToken,
          prof_show_ticket_id: formData.get("prof_show_ticket_id"),
        },
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } else {
      const response = await axios.post(
        `${apiBaseURL}/api/non-comp-cancel/${formData.get(
          "non_comp_ticket_id"
        )}/`,
        {
          access_token: accessToken,
          non_comp_ticket_id: formData.get("non_comp_ticket_id"),
        },
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
    return {
      isError: false,
      message: "Ticket cancelled successfully",
    };
  } catch (error) {
    return {
      isError: true,
      message:
        error.response?.data || "An error occurred while cancelling the ticket",
    };
  }
}
