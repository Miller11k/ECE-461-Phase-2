# How To Set Up

1. **Clone the Repository**: Start by pulling the repository to your local machine.

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2. **Install Dependencies**: Run the following command to install all necessary modules. This will create a `node_modules` directory containing all dependencies specified in the `package.json` file.

    ```bash
    npm install
    ```

3. **Environment Configuration**: Ensure that your `.env` file is properly configured. Refer to the provided `.env.example` file for the required environment variables.

After completing these steps, the base setup for this ReactJS application will be ready, and you can proceed to run the application.


# How To Run

1. **Start the Development Server**: To launch the application in development mode, run the following command in the terminal:

    ```bash
    npm start
    ```

    This command starts the local development server on port 3000.

2. **Expected Output**: If the application starts successfully, you should see output similar to the following in the terminal:

    ```
    Compiled successfully!

    You can now view web-ui in the browser.

      Local:            http://localhost:3000
      On Your Network:  http://10.0.0.46:3000

    Note that the development build is not optimized.
    To create a production build, use npm run build.

    webpack compiled successfully
    ```

3. **Access the Application**: Once compiled, the application will automatically open in your default web browser, displaying the homepage.

4. **Production Build**: For an optimized production build, you can run:

    ```bash
    npm run build
    ```

    This command will bundle and optimize the application for deployment.


# File Structure
```
webui/
├── node_modules/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
└── src/
    └── package-types/
        ├── ExternalPackage.css
        ├── ExternalPackage.js
        ├── InternalPackage.css
        ├── InternalPackage.js
        ├── App.js
        ├── DownloadPackage.js
        ├── index.js
        ├── MainPage.css
        ├── MainPage.js
        ├── Upload.css
        ├── Upload.js
        └── ViewDatabase.js
├── .env
├── .gitignore
├── LICENSE
├── package-lock.json
├── package.json
└── README.md
```

### Explanation of Directories and Files

- **node_modules/**: Contains all the dependencies and packages installed via npm. This folder is automatically generated and should not be modified manually.

- **public/**: This directory holds static assets that can be directly served to the client.
  - **favicon.ico**: The icon displayed in the browser tab.
  - **index.html**: The main HTML file for the application.
  - **logo192.png**: A logo used for display purposes, typically for Progressive Web Apps (PWAs).
  - **logo512.png**: Another logo used for different display contexts.
  - **manifest.json**: A configuration file for Progressive Web Apps (PWAs) that provides metadata about the app.
  - **robots.txt**: A file that instructs web crawlers and bots on how to interact with the site.

- **src/**: Contains the source code for the application.
  - **package-types/**: A folder that organizes different components and their associated styles.
    - **ExternalPackage.css**: Styles for the external package component.
    - **ExternalPackage.js**: JavaScript functionality for the external package component.
    - **InternalPackage.css**: Styles for the internal package component.
    - **InternalPackage.js**: JavaScript functionality for the internal package component.
    - **App.js**: The root component that initializes and holds the main application structure.
    - **DownloadPackage.js**: Handles the download functionality for packages.
    - **index.js**: The entry point for the `package-types` module, which may export components or functionalities.
    - **MainPage.css**: Styles specific to the main page of the application.
    - **MainPage.js**: The main page component that renders the primary user interface.
    - **Upload.css**: Styles for the upload functionality component.
    - **Upload.js**: Manages the upload functionality, allowing users to upload files or data.
    - **ViewDatabase.js**: Component responsible for displaying and interacting with the database content.

### Additional Files
- **.env**: Contains environment variables that may be used to configure the application without hardcoding values in the source code.
- **.gitignore**: Specifies files and directories that should be ignored by Git.
- **LICENSE**: The license under which the project is distributed.
- **package-lock.json**: Automatically generated file that locks the versions of installed packages.
- **package.json**: Defines the project's metadata, scripts, and dependencies.
- **README.md**: This file, which provides an overview of the project, setup instructions, and usage guidelines.

# Blank `.env` File

The `.env` file is essential for storing IAM credentials required for consistent access to the S3 bucket. A blank template is provided for easy setup.

## Setup Instructions

1. **Create the .env File**: In the root of the project directory, create a file named `.env`.

2. **Copy the Template**: Paste the following template into your `.env` file.

    ```
    REACT_APP_IAM_ACCESS_KEY_ID=
    REACT_APP_IAM_SECRET_KEY=

    REACT_APP_S3_BUCKET_NAME=
    REACT_APP_AWS_REGION=
    ```

3. **Input Credentials**: Replace the placeholders with the actual IAM credentials for your S3 bucket. These values allow secure and consistent access to AWS resources.

Ensure the `.env` file is not committed to version control by confirming its presence in the `.gitignore` file.