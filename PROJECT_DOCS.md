# Project Documentation

## 1. Project Description

This project is a web application for the BITS Pilani "Oasis" fest, serving as a signing portal for events. Students can sign in using their official BITS Google account to browse and register for various events, including professional shows and other non-competitive events. The application allows users to view event details, purchase tickets for different slots, and manage their existing registrations by viewing or canceling them.

The frontend is built with React and Vite, utilizing React Router for navigation. Authentication is handled via Google OAuth, which is then verified by a custom backend to issue JWT access and refresh tokens for API authorization.

## 2. APIs Used

The application interacts with a backend API hosted at `https://www.bits-oasis.org/2025/main/signings`. All API requests require an `Authorization: Bearer <accessToken>` header unless specified otherwise.

### Authentication

*   **`POST /api/auth/`**
    *   **Purpose:** Authenticates a user with the backend after a successful Google Sign-In.
    *   **Authentication:** None required.
    *   **Request Body:**
        ```json
        {
          "token": "<Google OAuth credential token>"
        }
        ```
    *   **Response Body:**
        ```json
        {
          "tokens": {
            "access": "<JWT access token>",
            "refresh": "<JWT refresh token>"
          }
        }
        ```

### Events & Shows

*   **`GET /api/shows`**
    *   **Purpose:** Fetches the list of all available professional shows and non-competitive events.
    *   **Authentication:** Required.
    *   **Response Body:**
        ```json
        {
          "prof_shows": [
            {
              "id": 1,
              "name": "Example Prof Show",
              "description": "A cool description."
            }
          ],
          "non_comp_events": [
            {
              "id": 1,
              "name": "Example Non-Comp Event",
              "description": "Another cool description."
            }
          ]
        }
        ```

*   **`GET /api/prof-show/{id}/`**
    *   **Purpose:** Fetches the details for a specific professional show.
    *   **Authentication:** Required.
    *   **Response Body:**
        ```json
        {
          "id": 1,
          "name": "Example Prof Show",
          "description": "...",
          "Artist": "Artist Name",
          "start_time": "...",
          "end_time": "...",
          "price": 500
        }
        ```

*   **`GET /api/non-comp/{id}/`**
    *   **Purpose:** Fetches the details for a specific non-competitive event.
    *   **Authentication:** Required.
    *   **Response Body:**
        ```json
        {
          "non_comp_name": "Example Non-Comp Event",
          "description": "...",
          "dates": [
            {
              "date": "2025-10-20",
              "slots": [
                {
                  "slot_id": 1,
                  "venue": "Auditorium",
                  "start_time": "18:00",
                  "end_time": "20:00",
                  "is_openforsignings": true,
                  "ticket_types": [
                    {
                      "ticket_type_id": 1,
                      "ticket_type_name": "Wave 1",
                      "price": 100
                    }
                  ]
                }
              ]
            }
          ]
        }
        ```

### Ticketing & Signings

*   **`POST /api/prof-show/{id}/buy/`**
    *   **Purpose:** Purchase tickets for a professional show.
    *   **Authentication:** Required.
    *   **Request Body:** `FormData` with a `ticket` field (e.g., `ticket=2`).
    *   **Response:** Success or error message.

*   **`POST /api/non-comp-ticket/{ticket_type_id}/buy/`**
    *   **Purpose:** Purchase tickets for a specific slot of a non-competitive event.
    *   **Authentication:** Required.
    *   **Request Body:** `FormData` with a `tickets` field (e.g., `tickets=1`).
    *   **Response:** Success or error message.

*   **`GET /api/tickets`**
    *   **Purpose:** Fetches all tickets purchased by the currently authenticated user.
    *   **Authentication:** Required.
    *   **Response Body:**
        ```json
        {
          "prof_show_tickets": [
            {
              "ticket_id": 1,
              "show_name": "Example Prof Show",
              "price": 500,
              "cancelled": false,
              "cancellable": true
            }
          ],
          "non_comp_tickets": [
            {
              "ticket_id": 2,
              "non_comp_name": "Example Non-Comp Event",
              "price": 100,
              "cancelled": false,
              "cancellable": false
            }
          ]
        }
        ```

*   **`POST /api/prof-show-cancel/{ticket_id}/`**
    *   **Purpose:** Cancel a purchased professional show ticket.
    *   **Authentication:** Required.
    *   **Request Body:**
        ```json
        {
          "access_token": "<JWT access token>",
          "prof_show_ticket_id": "<ticket_id>"
        }
        ```
    *   **Response:** Success or error message.

*   **`POST /api/non-comp-cancel/{ticket_id}/`**
    *   **Purpose:** Cancel a purchased non-competitive event ticket.
    *   **Authentication:** Required.
    *   **Request Body:**
        ```json
        {
          "access_token": "<JWT access token>",
          "non_comp_ticket_id": "<ticket_id>"
        }
        ```
    *   **Response:** Success or error message.

## 3. Pages & Components

### `/signin` - Sign In Page

*   **Purpose:** Allows users to authenticate into the application. It provides a single "Continue with Google" button. An error is shown if a non-BITS email is used.
*   **APIs Used:**
    *   `POST /api/auth/`: Sends the Google OAuth credential to the backend to get JWT tokens.

### `/` - Home Page

*   **Purpose:** The main landing page after logging in. It displays two categories of events—Prof Shows and Events—in a tabbed view. Users can click on any event to see more details.
*   **APIs Used:**
    *   `GET /api/shows`: Fetches the lists of events to display.

### `/EventDetails/:eventType/:eventIndex` - Event Details Page

*   **Purpose:** Shows detailed information about a selected event. The layout and functionality change based on the event type (`prof-show` or `non-comp`). Users can purchase tickets from this page.
*   **APIs Used:**
    *   `GET /api/prof-show/{id}/`: If the event is a prof-show.
    *   `GET /api/non-comp/{id}/`: If the event is non-competitive.
    *   `POST /api/prof-show/{id}/buy/`: To buy prof-show tickets.
    *   `POST /api/non-comp-ticket/{ticket_type_id}/buy/`: To buy non-comp event tickets.

### `/yoursignings` - Your Signings Page

*   **Purpose:** Displays a table of all tickets the user has purchased. It shows the event name, price, and status (Confirmed/Cancelled). It also provides an option to cancel the ticket if it is cancellable.
*   **APIs Used:**
    *   `GET /api/tickets`: Fetches all of the user's tickets.
    *   `POST /api/prof-show-cancel/{ticket_id}/`: To cancel a prof-show ticket.
    *   `POST /api/non-comp-cancel/{ticket_id}/`: To cancel a non-comp event ticket.
