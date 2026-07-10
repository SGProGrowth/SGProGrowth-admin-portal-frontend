FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_USE_API=true
ARG VITE_JWT_SECRET
ARG VITE_JWT_ISSUER=sgprogrowth-admin
ARG VITE_JWT_AUDIENCE=sgprogrowth-portal
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_API=$VITE_USE_API
ENV VITE_JWT_SECRET=$VITE_JWT_SECRET
ENV VITE_JWT_ISSUER=$VITE_JWT_ISSUER
ENV VITE_JWT_AUDIENCE=$VITE_JWT_AUDIENCE
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
