FROM golang:1.16 as builder

ENV GO111MODULE=on
ENV GOFLAGS=-mod=vendor

WORKDIR /app/server
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY vendor ./vendor
COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -o server


FROM alpine:latest

WORKDIR /app/server
COPY --from=builder /app/server/server .
EXPOSE 443
#CMD ["sh"]
CMD ["./server"]
