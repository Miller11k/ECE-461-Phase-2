import boto3
import os

def download_s3_folders(bucket_name, aws_access_key, aws_secret_key, aws_region=""):
    """
    Download all folders from an S3 bucket to the current directory as a folder named 'S3'.

    :param bucket_name: Name of the S3 bucket.
    :param aws_access_key: AWS access key.
    :param aws_secret_key: AWS secret key.
    :param aws_region: AWS region of the bucket (default: us-east-1).
    """
    # Setup the S3 client using provided credentials
    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )

    # Define the local path to store the S3 content
    local_path = os.path.join(os.getcwd(), "S3")
    os.makedirs(local_path, exist_ok=True)

    # List objects in the bucket
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        if "Contents" not in response:
            print(f"No objects found in bucket {bucket_name}.")
            return

        for obj in response["Contents"]:
            key = obj["Key"]

            if not key.endswith("/"):  # It's a file
                file_path = os.path.join(local_path, key)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                print(f"Downloading file: {key} to {file_path}")
                s3.download_file(bucket_name, key, file_path)
            else:  # It's a folder
                folder_path = os.path.join(local_path, key)
                os.makedirs(folder_path, exist_ok=True)
                print(f"Creating folder locally: {folder_path}")
    except Exception as e:
        print(f"Error accessing the bucket: {e}")

if __name__ == "__main__":
    # IAM User Configuration
    AWS_REGION = ""
    AWS_ACCESS_KEY_ID = ""
    AWS_SECRET_ACCESS_KEY = ""
    S3_BUCKET_NAME = ""

    # Call the function
    download_s3_folders(S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)

