# Use the official lightweight Nginx image
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the static web app files to the Nginx HTML directory
COPY . /usr/share/nginx/html

# Expose port 80 for GCP Cloud Run
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
