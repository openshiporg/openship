# Use the official Node.js 18 image as the base image
FROM node:18-alpine AS runner
 
RUN apk update && apk add --no-cache curl && apk add --no-cache ca-certificates

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock ./

# Install dependencies using yarn
RUN yarn install --verbose

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN yarn run build --verbose

# Expose the port on which the application will run
EXPOSE 3000

# Start the application
CMD ["yarn", "run", "start"]
