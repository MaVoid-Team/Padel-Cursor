# Use the official Nginx Alpine image for a smaller footprint
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy the website files to the Nginx html directory
COPY *.html /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/
COPY *.md /usr/share/nginx/html/

# Set proper permissions for the website files
RUN chmod -R 644 /usr/share/nginx/html/* && \
    chmod 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
