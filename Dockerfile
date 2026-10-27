FROM python:3.12-slim-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
# Map data is built here from the public sources. It is not stored in git.
# Chinese place-name files stay on a local disk and are not part of this image.
RUN python scripts/build-all.py --with-de \
 && test -s data/sys-stanton.json \
 && test -s data/galaxy.json

ENV PYTHONUNBUFFERED=1
EXPOSE 10000
CMD ["sh", "-c", "python server/room_server.py --host 0.0.0.0 --port ${PORT:-10000}"]
