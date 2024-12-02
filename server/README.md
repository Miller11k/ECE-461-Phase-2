# ECE 461 Software Engineering Project Phase 2

Created by:
Miller Kodish
Daniel Shkembi
Francisco Ramirez
Alfredo Barandearan

## Table of contents

- [ECE 461 Software Engineering Project Phase 2](#ece-461-software-engineering-project-phase-2)
  - [Table of contents](#table-of-contents)
  - [Description](#description)
    - [Purpose](#purpose)
    - [ACME Module Evaluator CLI](#acme-module-evaluator-cli)
  - [File Documentation](#file-documentation)
    - [Metrics](#metrics)
    - [Maintainability](#maintainability)
    - [RampUp](#rampup)
    - [Correctness](#correctness)
    - [BusFactor](#busfactor)
    - [Responsiveness](#responsiveness)
    - [License](#license)
    - [NetScore](#netscore)
    - [testUtils](#testutils)
  - [Install](#install)
  - [Usage](#usage)
    - [NOTE for WSL users:](#note-for-wsl-users)
    - [Initial Setup](#initial-setup)
    - [Building](#building)
    - [Cleaning](#cleaning)
    - [Test Bench](#test-bench)
    - [Run with text file of URLs](#run-with-text-file-of-urls)
    - [Run As Rest API Server](#run-as-rest-api-server)
    - [./test.sh](#testsh)
  - [Main API Routes](#main-api-routes)
      - [**List Packages**](#list-packages)
      - [**Retrieve Package**](#retrieve-package)
      - [**Upload or Ingest Package**](#upload-or-ingest-package)
      - [**Update Package**](#update-package)
      - [**Rate Package**](#rate-package)
      - [**Cost of Package**](#cost-of-package)
      - [**Search Packages by Regex**](#search-packages-by-regex)
      - [**Reset Registry**](#reset-registry)
      - [**Authenticate User**](#authenticate-user)
      - [**Planned Tracks**](#planned-tracks)
  - [Additional API Routes](#additional-api-routes)
      - [**Change Password**](#change-password)
      - [**Change Username**](#change-username)
      - [**Clear Tokens**](#clear-tokens)
      - [**Create User**](#create-user)
      - [**Delete Token**](#delete-token)
      - [**Get User**](#get-user)
      - [**Login**](#login)
  - [Known Limitations](#known-limitations)
  - [Contribution and License Agreement](#contribution-and-license-agreement)
  - [License](#license-1)

## Description

### Purpose

The purpose of this repository/project is to have a fair and comprehensive evaluation of other repositories/libraries/dependences/projects/etc... for which the evaluation is numerical and objective. 

### ACME Module Evaluator CLI

This repository contains a command-line tool designed to help ACME Corporation’s service engineering teams evaluate and select reliable open-source Node.js modules. The tool analyzes each module based on key metrics such as ramp-up time, correctness, bus factor, maintainer responsiveness, and license compatibility. Results are output in NDJSON format with detailed scores and latencies for each metric.

## File Documentation

### [Metrics](docs/metrics.md)

This code sets up a system for calculating metrics related to a GitHub repository, handling environment variables, logging, and making requests to the GitHub API. Below is an explanation of the key components:

### [Maintainability](docs/maintainability.md)

The `Maintainability` class calculates and evaluates the maintainability of a repository by analyzing its issue resolution time. This class extends the `Metrics` class and provides methods to assess maintainability based on the average time taken to resolve issues in the repository.

### [RampUp](docs/rampUp.md)

The `RampUp` class is responsible for evaluating how quickly a new contributor can ramp up on a repository. The ramp-up score is calculated based on the presence of key files and directories that are essential for understanding and contributing to the repository. This class extends the `Metrics` class.

### [Correctness](docs/correctness.md)

The `Correctness` class calculates the correctness of a repository based on its issues data. Correctness is evaluated by measuring the ratio of open bug issues to total open issues in the repository. This class extends the `Metrics` class and provides methods to evaluate the correctness.

### [BusFactor](docs/busFactor.md)

The `BusFactor` class calculates the bus factor of a repository. The bus factor is a measure of how many developers would need to leave a project before it becomes infeasible to maintain the codebase. This class extends the `Metrics` class and provides methods to evaluate the bus factor.

### [Responsiveness](docs/responsiveness.md)

The `Responsiveness` class evaluates the responsiveness of a repository by analyzing the time taken to respond to issues and pull requests. This class extends the `Metrics` class and provides methods to assess responsiveness based on the average response time to issues and pull requests.

### [License](docs/license.md)

The `License` class evaluates the license compatibility of a repository by analyzing the license types of its dependencies. This class extends the `Metrics` class and provides methods to assess license compatibility based on the license types of the repository’s dependencies.

### [NetScore](docs/netScore.md)

The `NetScore` class calculates the overall net score for a software project by combining several metrics such as BusFactor, Correctness, License, RampUp, and Maintainability. Each metric is weighted and contributes to the final score, which is computed as a weighted average. The score is clamped between 0 and 1, where 1 represents the best performance.

### [testUtils](docs/testUtils.md)

This module provides a set of assertion functions that compare actual values to expected values within specified thresholds. These functions log the results of the assertions, indicating whether they pass or fail.

## Install

```bash
git clone https://github.com/galaxybomb23/ECE461-Software-Engineering
```

## Usage

All usage for this project is through the `run` executable.

### NOTE for WSL users:

You may encounter the following error when trying to run the checker/run script

```bash
bad interpreter: /bin/bash^M: no such file or directory
```

This is because windows saves the file using CRLF format while WSL expects it to be a LF format. To fix this you need to change the line ending for the file to LF. This can be done in VScode or using `dos2unix` and running the following command:

```bash
dos2unix run test.sh test/URLS.txt checker/one-url.txt
```

### Initial Setup

`cd` into the cloned directory.

Create a new file titled `.env` in the root of the repo. Copy and paste the text below into the file. Paste your GitHub API token in the quotes after `GITHUB_TOKEN`. Type the desired log level into the quotes after `LOG_LEVEL`. Paste the path of your log file in the quotes after `LOG_FILE`.

Log levels include:
|Debug|Level|
|--|--|
|0|Error|
|1|Info|
|2|Debug|

```
GITHUB_TOKEN = "<github_token>"
LOG_LEVEL = "1"
LOG_FILE = "logs/run.log"
```

Run the following command in a terminal while in the root of the repo to install the dependencies:

```bash
./run install
```

### Building

To build the project run the following command:

```bash
./run build
```

### Cleaning

To clean the project run the following command:

```bash
./run clean
```

### Test Bench

To run the test bench run the following command:

```bash
./run test
```

### Run with text file of URLs

To run the project with a text file of URLs run the following command:

```bash
./run <path/to/file>
```

and replace the `<path/to/file>` with the path of the text file you are trying to process. Make sure that the text file contains **1 URL per line**.
Ex.)

```
https://github.com/mrdoob/three.js
https://github.com/cloudinary/cloudinary_npm
https://www.npmjs.com/package/express
```

### Run As Rest API Server

To run the project in server mode, run this command:

```bash 
npm run start-server
```


### ./test.sh

This script is used to evaluate the effectiveness of our metric equations. To run it use the following command:

```bash
./test.sh
```

## Main API Routes

#### **List Packages**
- **Endpoint:** `POST /packages`
- **Description:** Retrieves a list of packages based on the query parameters.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Body: An array of `PackageQuery` objects containing:
    - `Name`: Package name (or `*` for all packages).
    - `Version`: Semantic version range.
  - Optional Query Parameter: `offset` for pagination.
- **Responses:**
  - `200 OK`: List of packages with metadata.
  - `400 Bad Request`: Malformed or missing query fields.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `413 Payload Too Large`: Too many packages requested.

---

#### **Retrieve Package**
- **Endpoint:** `GET /package/{id}`
- **Description:** Fetches details of a specific package by ID.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Path Parameter: `id` (Package ID).
- **Responses:**
  - `200 OK`: Package metadata and data.
  - `400 Bad Request`: Malformed or missing ID.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: Package does not exist.

---

#### **Upload or Ingest Package**
- **Endpoint:** `POST /package`
- **Description:** Uploads or ingests a new package.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Body: `PackageData` object with either `Content` (Base64-encoded) or `URL` (repository URL).
- **Responses:**
  - `201 Created`: Package uploaded successfully.
  - `400 Bad Request`: Malformed or conflicting fields in request.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `409 Conflict`: Package already exists.
  - `424 Failed Dependency`: Package disqualified due to a rating issue.

---

#### **Update Package**
- **Endpoint:** `POST /package/{id}`
- **Description:** Updates an existing package with a new version.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Path Parameter: `id` (Package ID).
  - Body: `Package` object with new metadata and data.
- **Responses:**
  - `200 OK`: Package version updated.
  - `400 Bad Request`: Malformed or missing fields.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: Package does not exist.

---

#### **Rate Package**
- **Endpoint:** `GET /package/{id}/rate`
- **Description:** Retrieves the rating for a specific package.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Path Parameter: `id` (Package ID).
- **Responses:**
  - `200 OK`: Rating metrics for the package.
  - `400 Bad Request`: Malformed or missing ID.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: Package does not exist.
  - `500 Internal Server Error`: Metric calculation issue.

---

#### **Cost of Package**
- **Endpoint:** `GET /package/{id}/cost`
- **Description:** Computes the cost of a package, optionally including its dependencies.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Path Parameter: `id` (Package ID).
  - Query Parameter: `dependency` (boolean, default: `false`).
- **Responses:**
  - `200 OK`: Cost of the package and dependencies.
  - `400 Bad Request`: Malformed or missing ID.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: Package does not exist.
  - `500 Internal Server Error`: Metric calculation issue.

---

#### **Search Packages by Regex**
- **Endpoint:** `POST /package/byRegEx`
- **Description:** Retrieves packages matching a regular expression.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Body: `PackageRegEx` object with a `RegEx` string.
- **Responses:**
  - `200 OK`: List of packages matching the regex.
  - `400 Bad Request`: Malformed or invalid regex.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: No packages match the regex.

---

#### **Reset Registry**
- **Endpoint:** `DELETE /reset`
- **Description:** Resets the package registry to its default state.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
- **Responses:**
  - `200 OK`: Registry successfully reset.
  - `401 Unauthorized`: Insufficient permissions.
  - `403 Forbidden`: Invalid or missing authentication token.

---

#### **Authenticate User**
- **Endpoint:** `PUT /authenticate`
- **Description:** Authenticates a user and retrieves an access token.
- **Request:**
  - Body: `AuthenticationRequest` with `User` (username, admin status) and `Secret` (password).
- **Responses:**
  - `200 OK`: Authentication token returned.
  - `400 Bad Request`: Malformed or missing fields.
  - `401 Unauthorized`: Invalid credentials.
  - `501 Not Implemented`: Authentication not supported.

---

#### **Planned Tracks**
- **Endpoint:** `GET /tracks`
- **Description:** Retrieves the list of tracks planned for implementation.
- **Responses:**
  - `200 OK`: List of planned tracks.
  - `500 Internal Server Error`: Failed to retrieve track information.

## Additional API Routes

#### **Change Password**
- **Endpoint:** `POST /change-password`
- **Description:** Allows a user to change their password.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Body:
    - `newPassword` or `new_password`: The new password to set.
- **Responses:**
  - `200 OK`: Password changed successfully.
  - `400 Bad Request`: Missing or blank new password.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Change Username**
- **Endpoint:** `POST /change-username`
- **Description:** Allows a user to change their username.
- **Request:**
  - Headers: `X-Authorization` with an authentication token.
  - Body:
    - `newUsername` or `new_username`: The new username to set.
- **Responses:**
  - `200 OK`: Username changed successfully.
  - `400 Bad Request`: Missing or unchanged username.
  - `403 Forbidden`: Invalid or missing authentication token.
  - `404 Not Found`: User not found or update failed.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Clear Tokens**
- **Endpoint:** `POST /clear-tokens`
- **Description:** Clears all session tokens for a user.
- **Request:**
  - Body:
    - `username`: Username of the user.
    - `token`: Session token for authentication.
- **Responses:**
  - `200 OK`: Tokens cleared successfully.
  - `400 Bad Request`: Missing username or token.
  - `401 Unauthorized`: Invalid token.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Create User**
- **Endpoint:** `POST /create-user`
- **Description:** Creates a new user.
- **Request:**
  - Body:
    - `first_name`: User's first name.
    - `last_name`: User's last name.
    - `username`: Username for the account.
    - `plaintext_password`: Plaintext password for the account.
    - `is_admin`: Boolean indicating if the user has admin rights.
- **Responses:**
  - `200 OK`: User created successfully.
  - `400 Bad Request`: Username already in use.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Delete Token**
- **Endpoint:** `DELETE /delete-token`
- **Description:** Deletes a specific session token for a user.
- **Request:**
  - Body:
    - `username`: The username of the user.
    - `token`: The token to delete.
- **Responses:**
  - `200 OK`: Token deleted successfully.
  - `400 Bad Request`: Missing username or token.
  - `404 Not Found`: Token not found or user does not exist.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Get User**
- **Endpoint:** `POST /get-user`
- **Description:** Retrieves user details based on a token.
- **Request:**
  - Body:
    - `token`: Authentication token.
- **Responses:**
  - `200 OK`: User details returned successfully.
  - `400 Bad Request`: Missing token.
  - `401 Unauthorized`: Invalid token.
  - `500 Internal Server Error`: An error occurred while processing the request.

---

#### **Login**
- **Endpoint:** `POST /login`
- **Description:** Logs in a user.
- **Request:**
  - Body:
    - `username`: Username for authentication.
    - `password`: Password for authentication.
- **Responses:**
  - `200 OK`: Login successful with token.
  - `400 Bad Request`: Missing username or password.
  - `401 Unauthorized`: Invalid credentials.
  - `500 Internal Server Error`: An error occurred while processing the request.

---


## Known Limitations

- We do not utilize hermetic testing (i.e. mocking). As a result, the test bench will make API calls using your token. If external repositories change/receive pushes it's possible for our calculated metrics to change and fail some test cases.

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work.

## License
This project is licensed under the [MIT License](../LICENSE).