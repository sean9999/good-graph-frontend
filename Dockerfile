FROM node:22

COPY . /app
WORKDIR /app
RUN make install
RUN make build

FROM nginx
COPY --from=0 /app/dist /usr/share/nginx/html
