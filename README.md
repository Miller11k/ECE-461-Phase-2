
# ECE 461 Software Engineering Project Phase 2

## Table of Contents
- [ECE 461 Software Engineering Project Phase 2](#ece-461-software-engineering-project-phase-2)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Client Overview](#client-overview)
    - [File Structure](#file-structure)
    - [Features](#features)
  - [Server Overview](#server-overview)
    - [File Structure](#file-structure-1)
    - [API Routes](#api-routes)
      - [**Users**:](#users)
      - [**Packages**:](#packages)
      - [**Other**:](#other)
    - [Metrics Calculation](#metrics-calculation)
  - [Setup and Installation](#setup-and-installation)
    - [Client Setup](#client-setup)
    - [Server Setup](#server-setup)
  - [Building and Testing](#building-and-testing)
    - [Building](#building)
    - [Running Tests](#running-tests)
  - [Usage](#usage)
    - [Starting the Client](#starting-the-client)
    - [Starting the Server](#starting-the-server)
    - [Interacting with the Application](#interacting-with-the-application)
  - [Known Limitations](#known-limitations)
  - [License](#license)

---

## Description
The purpose of this repository is to provide a comprehensive solution for evaluating and managing software packages. It consists of a **ReactJS client** (located within the `client` directory) and a **TypeScript server** (located within the `server` directory) working together to handle package evaluations, user management, and visualization of package metrics.

---

## Client Overview
### File Structure
```
client/
├── src/
│   ├── components/      # Reusable UI components (e.g., Header, Footer)
│   ├── pages/           # Core application pages (e.g., Dashboard, UploadPackage)
│   ├── helpers/         # Helper functions for UI logic
├── public/              # Static files (e.g., index.html, favicon)
├── package.json         # Client dependencies and scripts
```

### Features
- **Dashboard**: Main home page where user can access all functionality
- **Upload Package**: Upload package to package registry
- **Search Page**: Search for package based on RegEx in package and READMEs
- **View Database**: View paginated result of all packages in database
- **Account Page**: Change own user's username or password
- **Admin Page**: Admin-Only privileges, such as creating a new user or resetting the registry

---

## Server Overview
### File Structure
```
server/
├── src/
│   ├── API/                  # Core API logic
│   │   ├── config/           # Configuration files (e.g., CORS, database)
│   │   ├── helpers/          # Utility modules for API operations
│   │   ├── routes/           # API route handlers
│   ├── metricsCalculation/   # Metric evaluation logic
│   ├── types/                # Type definitions
├── package.json              # Server dependencies and scripts
```

### API Routes
#### **Users**:
- `POST /create-user`: Creates a new user account.
- `POST /login`: Authenticates user through username and password.
- `GET /get-user`: Retrieves user details through JWT.
- `PUT /change-username`: Updates the username of a user.
- `POST /clear-tokens`: Clears all active web-tokens for a user.
- `PUT /change-password`: Changes the password for a user.
- `DELETE /delete-token`: Deletes a specific web-token for a user.

#### **Packages**:
- `GET /package`: Gets packages that follow the RegEx specified.
- `POST /package`: Creates a new package.
- `GET /package/:id`: Retrieves package details and content for a specific package.
- `POST /package/:id`: Updates details for a specific package.
- `GET /package/:id/rate`: Retrieves the rating for a specific package.
- `GET /package/:id/cost`: Retrieves the cost associated with a specific package.
- `POST /package/byRegEx`: Searches for packages based on a regular expression.

#### **Other**:
- `POST /reset`: Resets system configurations.
- `POST /authenticate`: Verifies user authentication and session validity.
- `GET /tracks`: Fetches or updates track-related information.


### Metrics Calculation
- **Ramp-Up Time**: Measures time required for new contributors to adapt.
- **Correctness**: Evaluates the ratio of open bugs to total issues.
- **Bus Factor**: Assesses the risk of project collapse if key developers leave.
- **License Compatibility**: Analyzes dependency licenses for conflicts.
- **Net Score**: Aggregates all metrics into a final comprehensive score.

---

## Setup and Installation
### Client Setup
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` (empty samples is provided as `.env.example`) file in the `client/` directory with required configurations (e.g., `REACT_APP_API_URL`, `REACT_APP_API_PORT`).

### Server Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` (empty samples is provided as `.env.example`) file in the `server/` directory with required configurations (e.g., `DB_CONNECTION`, `S3_BUCKET`).

---

## Building and Testing
### Building
- **Client**: Run `npm run build` in the `client/` directory to generate production-ready files.
- **Server**: Run `npm run build` in the `server/` directory to compile TypeScript into JavaScript.

### Running Tests
- **Client**: Use `npm test` for running React component tests.
- **Server**: Run the test suite:
  ```bash
  npm run test
  ```

---

## Usage
### Starting the Client
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Start the development server:
   ```bash
   npm run start
   ```

### Starting the Server
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Start the API server:
   ```bash
   npm run start-server
   ```

### Interacting with the Application
- Open the client in your browser at `http://localhost:3000`.
- Use the client interface to interact with the backend API.

---

## Known Limitations
- **Compatability**: Relies on an NPM package having a GitHub URL (if external)


---

## License
This project is licensed under the [MIT License](LICENSE).

