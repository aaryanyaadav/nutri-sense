# Deploying NutriSense to Google Cloud Platform (GCP)

We've completely Dockerized your app! It is now securely packaged inside an ultra-fast, lightweight `Nginx` web server container.

To deploy it on the open internet using Google Cloud Run (which is highly optimized and often practically free for small side projects):

## Prerequisites
1. **Google Cloud Account:** You must have a project created at [console.cloud.google.com](https://console.cloud.google.com/). Ensure **Billing** is enabled (Cloud Run requires billing on file, even for the generous free tier).
2. **Google Cloud CLI:** You must install the `gcloud` CLI tool on your computer. [Download it here](https://cloud.google.com/sdk/docs/install) if you don't have it.

## Deployment Steps

1. Open your terminal inside this direct folder (`d:\project\nutiri-sense app`).
2. Authenticate your terminal with your Google account by running:
   ```bash
   gcloud auth login
   ```
3. Set your active GCP project. (Find your `PROJECT_ID` on your Cloud Console homepage):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
4. Deploy instantly to Cloud Run using this single command!
   ```bash
   gcloud run deploy nutrisense \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 80
   ```
   *(Note: You can change the region to whichever Google Cloud region is closest to you if you prefer).*

5. When you run this command, Google Cloud automatically reads the `Dockerfile` we just created, builds the Nginx web container entirely in the cloud, and scales the server.
   * If it asks you to enable APIs (like Cloud Run or Cloud Build API), press **Y**.
   * If it asks to create an Artifact Registry repository to hold the docker image, press **Y**.

6. Once it finishes loading (usually takes around 1-2 minutes), the terminal will spit out a permanent, live **Service URL** starting with `https://...`! 

Congratulations, NutriSense is now live globally!
