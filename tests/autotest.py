import requests
import base64
import zipfile
import io
import os
import tempfile

# Set global endpoint
BASE_URL = ""  # Leave blank as requested
auth_token = ""
package_ids = {}  # To store generated IDs for packages


def fetch_from_github(url, save_as):
    """Fetch a file from GitHub and save it locally."""
    print(f"Fetching {save_as} from {url}")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(save_as, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        print(f"Downloaded and saved as {save_as}.")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")


def ensure_zip_files(payloads):
    """Ensure required zip files exist locally or fetch from GitHub if missing."""
    for payload in payloads:
        file_name = f"{payload['Name']}.zip"
        if "Content" in payload and payload["Content"] is None:
            if not os.path.exists(file_name):
                if "URL" in payload:
                    fetch_from_github(payload["URL"], file_name)
                else:
                    print(f"Error: Missing file {file_name} and no URL to fetch it.")
            # Re-encode the content after download
            payload["Content"] = encode_zip_file(file_name)


def encode_zip_file(file_name):
    """Encodes the contents of a zip file as Base64."""
    if not os.path.exists(file_name):
        print(f"File not found: {file_name}")
        return None
    with open(file_name, "rb") as file:
        return base64.b64encode(file.read()).decode("utf-8")


def safe_request(method, url, **kwargs):
    """Wrapper to make requests and handle exceptions."""
    try:
        response = requests.request(method, url, **kwargs)
        if response.status_code in [200, 201]:
            response_json = response.json()
            
            # Function to recursively truncate 'Content' fields
            def truncate_content(data):
                if isinstance(data, dict):
                    for key, value in data.items():
                        if key == "Content" and isinstance(value, str):
                            data[key] = value[:10] + "... (truncated)"
                        else:
                            truncate_content(value)
                elif isinstance(data, list):
                    for item in data:
                        truncate_content(item)

            # Apply truncation to the entire response
            truncate_content(response_json)
            
            print(f"Response [{response.status_code}]: {response_json}")
        else:
            print(f"Response [{response.status_code}]: {response.json()}")
        return response
    except requests.exceptions.RequestException as e:
        print(f"Error during request to {url}: {e}")
        return None


def authenticate(user_payload):
    global auth_token
    response = safe_request("PUT", f"{BASE_URL}/authenticate", json=user_payload)
    if response and response.status_code == 200:
        raw_token = response.json()
        auth_token = raw_token.replace("bearer ", "")
        print("Authenticated successfully.")


def delete_reset():
    headers = {"X-Authorization": auth_token}
    safe_request("DELETE", f"{BASE_URL}/reset", headers=headers)


def post_packages(payload):
    headers = {"X-Authorization": auth_token}
    safe_request("POST", f"{BASE_URL}/packages", json=payload, headers=headers)


def post_package_create(payload):
    global package_ids
    headers = {"X-Authorization": auth_token}
    response = safe_request("POST", f"{BASE_URL}/package", json=payload, headers=headers)
    if response and response.status_code in [200, 201]:
        result = response.json()
        metadata = result.get("metadata", {})
        name = metadata.get("Name")
        package_id = metadata.get("ID")

        if name:
            print(f"Package '{name}' created successfully.")
            if package_id:
                package_ids[name] = package_id
                print(f"Package '{name}' has ID: {package_id}")
            else:
                print(f"Warning: Package '{name}' does not have an 'ID'.")
        else:
            print(f"Warning: Metadata missing 'Name' field in response: {metadata}")
    else:
        print(f"Failed to create package: {payload.get('Name')}")


def post_by_regex(payload):
    headers = {"X-Authorization": auth_token}
    safe_request("POST", f"{BASE_URL}/package/byRegEx", json=payload, headers=headers)


def get_packages_by_name(name):
    headers = {"X-Authorization": auth_token}
    payload = [{"Version": "", "Name": name}]
    safe_request("POST", f"{BASE_URL}/packages", json=payload, headers=headers)


def get_package_rate(package_id):
    headers = {"X-Authorization": auth_token}
    safe_request("GET", f"{BASE_URL}/package/{package_id}/rate", headers=headers)


def get_package_cost(package_id):
    headers = {"X-Authorization": auth_token}
    safe_request("GET", f"{BASE_URL}/package/{package_id}/cost", headers=headers)


def get_package_by_id(package_id, package_name):
    """Fetch details of a package by its ID."""
    headers = {"X-Authorization": auth_token}
    print(f"Fetching package details for '{package_name}' with ID: {package_id}")
    response = safe_request("GET", f"{BASE_URL}/package/{package_id}", headers=headers)
    if response:
        print(f"GET /package/{package_id} Response: {response.status_code}")
    else:
        print(f"Failed to fetch package details for '{package_name}'.")



def verify_zip_from_get_id(package_id, package_name):
    """
    Verifies that the Base64-encoded content of the package
    decodes to a valid ZIP file, extracts it temporarily,
    and checks the name of the root folder.
    """
    headers = {"X-Authorization": auth_token}
    response = requests.get(f"{BASE_URL}/package/{package_id}", headers=headers)

    if response.status_code == 200:
        response_data = response.json()
        base64_content = response_data.get("data", {}).get("Content", "")

        if not base64_content:
            print(f"Verification failed for package '{package_name}': Content is empty.")
            return

        try:
            # Decode Base64 content
            decoded_content = base64.b64decode(base64_content)

            # Check if decoded content is a valid ZIP file
            with zipfile.ZipFile(io.BytesIO(decoded_content)) as zf:
                if zf.testzip() is None:
                    print(f"Verification successful for package '{package_name}': Content is a valid ZIP file.")
                    
                    # Create a temporary directory to extract the ZIP
                    with tempfile.TemporaryDirectory() as temp_dir:
                        zf.extractall(temp_dir)

                        # Check the extracted contents
                        extracted_items = os.listdir(temp_dir)

                        if len(extracted_items) == 0:
                            print(f"Verification failed for package '{package_name}': ZIP file is empty.")
                        elif len(extracted_items) == 1 and os.path.isdir(os.path.join(temp_dir, extracted_items[0])):
                            root_folder = extracted_items[0]
                            print(f"Package '{package_name}' root folder: {root_folder}")
                        else:
                            print(f"Verification failed for package '{package_name}': ZIP file does not contain a single root folder.")
                else:
                    print(f"Verification failed for package '{package_name}': ZIP file is corrupted.")
        except (base64.binascii.Error, zipfile.BadZipFile) as e:
            print(f"Verification failed for package '{package_name}': Decoded content is not a valid ZIP file. Error: {e}")
    else:
        print(f"Failed to fetch package details for '{package_name}'. Status code: {response.status_code}")

# Payloads
auth_payload = {
    "User": {"name": "ece30861defaultadminuser", "isAdmin": True},
    "Secret": {"password": "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"}
}

# Encoded zip contents for the relevant packages
create_payloads = [
    {"Version": "4.2.3", "Name": "fecha", "URL": "https://github.com/taylorhakes/fecha.git", "Content": None, "debloat": False},
    {"Version": "2.0.3", "Name": "easy-math-module", "URL": "https://github.com/Verassitnh/easy-math-module.git", "Content": None, "debloat": False},
    {"Version": "1.3.5", "Name": "JSONStream", "URL": "https://github.com/dominictarr/JSONStream.git", "Content": None, "debloat": False},
    {"Version": "4.3.4", "Name": "debug", "URL": "https://github.com/debug-js/debug/archive/main.zip", "debloat": False},
    {"Version": "3.1.5", "Name": "cross-fetch", "URL": "https://github.com/lquixada/cross-fetch/archive/main.zip", "debloat": False},
    {"Version": "4.18.2", "Name": "express", "URL": "https://github.com/expressjs/express/archive/main.zip", "debloat": False},
    {"Version": "6.0.1", "Name": "inversify", "URL": "https://github.com/inversify/InversifyJS/archive/main.zip", "debloat": False},
]

# Ensure all zip files exist or fetch them
ensure_zip_files(create_payloads)

# The rest of your sequential steps
print("=== Step 1: Authenticate ===")
authenticate(auth_payload)

print("\n\n")
print("=== Step 2: Reset ===")
delete_reset()


print("\n\n\n")
print("=== Step 3: /packages (Name = *) ===")
post_packages([{"Version": "", "Name": "*"}])

print("\n\n\n")
print("=== Step 4: /package (POST fecha) ===")
post_package_create(create_payloads[0])


print("\n\n\n")
print("=== Step 5: /packages (Name = *) ===")
post_packages([{"Version": "", "Name": "*"}])

print("\n\n")
print("=== Step 6-12: Create other packages ===")
for payload in create_payloads[1:]:
    print("\n")
    print(f"Processing package: {payload['Name']}")
    post_package_create(payload)

print("\n\n\n")
print("=== Step 13: /packages (Name = *) ===")
post_packages([{"Version": "", "Name": "*"}])

print("\n\n")
print("=== Step 14-19: /package/byRegEx ===")
for regex in regex_payloads:
    print("\n")
    post_by_regex(regex)

print("\n\n")
print("=== Step 20-29: /packages by name ===")
for name in ["fecha", "easy-math-module", "JSONStream", "debug", "cross-fetch", "express", "inversify"]:
    print("\n")
    get_packages_by_name(name)


# Add ZIP verification and root folder checking step
print("\n\n")
print("=== Step 33-39: GET /package/:id, verify content is ZIP, and check root folder ===")
for package_name, package_id in package_ids.items():
    print("\n")
    verify_zip_from_get_id(package_id, package_name)


