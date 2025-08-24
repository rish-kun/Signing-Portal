import styles from "./YourSignings.module.scss";
import Navbar from "../ComComponent/Navbar/Navbar";
import ErrorModal from "../ComComponent/ErrorModal/ErrorModal";

import {
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigation,
} from "react-router";
import { useState } from "react";

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
      <div className={styles.tableContainer}>
        <h1 className={styles.pageTitle}>Your Signings</h1>
        {eventData?.isError && (
          <div className={styles.errorMessage}>
            <h2>WHOOPS!</h2>
            <p>
              {eventData.message ||
                "An error occurred while fetching signings."}
            </p>
          </div>
        )}
        {!eventData?.isError &&
          (eventData.data.prof_show_tickets ||
            eventData.data.non_comp_tickets) && (
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Price</th>
                  {/* <th>Time Slot</th> */}
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {eventData.data.prof_show_tickets?.map((event, index) => (
                  <tr key={index}>
                    <td>{event.show_name}</td>
                    <td>&#x20B9;{event.price}</td>
                    {/* <td>{event.timeSlot}</td> */}
                    <td>
                      <button
                        className={`${styles.status} ${
                          event.cancelled ? styles.cancelled : styles.confirmed
                        }`}
                      >
                        {event.cancelled ? "Cancelled" : "Confirmed"}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`${styles.cancel} ${
                          event.cancelled ||
                          !event.cancellable ||
                          (isSubmitting && currentEvent === `A-${index}`)
                            ? styles.disabled
                            : ""
                        }`}
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
                      </button>
                    </td>
                  </tr>
                ))}
                {eventData.data.non_comp_tickets?.map((event, index) => (
                  <tr key={index}>
                    <td>{event.non_comp_name}</td>
                    <td>&#x20B9;{event.price}</td>
                    {/* <td>{event.timeSlot}</td> */}
                    <td>
                      <button
                        className={`${styles.status} ${
                          event.cancelled ? styles.cancelled : styles.confirmed
                        }`}
                      >
                        {event.cancelled ? "Cancelled" : "Confirmed"}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`${styles.cancel} ${
                          event.cancelled ||
                          !event.cancellable ||
                          (isSubmitting && currentEvent === `B-${index}`)
                            ? styles.disabled
                            : ""
                        }`}
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
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        {!eventData?.isError &&
          !eventData.data.prof_show_tickets &&
          !eventData.data.non_comp_tickets && (
            <div className={styles.errorMessage}>
              <h2>No Signings Found</h2>
              <p>You have not signed up for any events yet.</p>
            </div>
          )}
      </div>
    </div>
  );
}

export default YourSignings;

export async function loader() {
    const dummySignings = {
        prof_show_tickets: [
            { ticket_id: 1, show_name: "Dummy Prof Show 1", price: 500, cancelled: false, cancellable: true },
            { ticket_id: 2, show_name: "Dummy Prof Show 2", price: 600, cancelled: true, cancellable: false },
        ],
        non_comp_tickets: [
            { ticket_id: 3, non_comp_name: "Dummy Event 1", price: 100, cancelled: false, cancellable: true },
            { ticket_id: 4, non_comp_name: "Dummy Event 2", price: 150, cancelled: false, cancellable: false },
        ],
    };

    return {
        isError: false,
        data: dummySignings,
        message: "Dummy signings fetched successfully",
    };
}

export async function action({ request }) {
    console.log("Dummy action, not cancelling ticket.");
    return {
        isError: false,
        message: "This is a dummy action. Ticket not cancelled.",
    };
}
