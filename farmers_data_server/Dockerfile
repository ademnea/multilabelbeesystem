FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Create a non-root user and set up directories
RUN useradd -m -u 1000 farmer && \
    mkdir -p /home/farmer/recordings /home/farmer/hive_conditions /data && \
    chown -R farmer:farmer /home/farmer /data /app

# Switch to non-root user
USER farmer

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
