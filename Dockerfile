# ---- Base Node ----
FROM node:19-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY *env ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm ci

# ---- Build ----
FROM dependencies AS build
COPY . .
RUN npm run build

# ---- Production ----
FROM node:19-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=build /app/*env ./

# Create a user named "chat"
RUN adduser -D chat

# Change ownership of the app directory to the "chat" user
RUN chown -R chat:chat /app

# Switch to the "chat" user
USER chat

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
