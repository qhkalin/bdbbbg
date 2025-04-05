FROM python:3.11-slim

# Install necessary system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container
COPY . /app/

# Install the required Python packages
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Command to run your app
CMD ["python", "app.py"]  # Change this to the command that runs your app
