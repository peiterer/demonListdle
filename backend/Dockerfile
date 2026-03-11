FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends gcc pkg-config libmariadb-dev libmariadb-dev-compat \
	&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["flask", "--app", "main.py", "run", "--debug", "--host=0.0.0.0", "--port=5000"]
