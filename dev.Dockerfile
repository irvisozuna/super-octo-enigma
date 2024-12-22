FROM node:lts

WORKDIR /app

# Enable Corepack
RUN corepack enable

# Copy package manager files and the rest of the project
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY . .

# Install dependencies using pnpm
RUN corepack prepare pnpm@latest --activate && pnpm install

# Generate the icon bundle
RUN pnpm run build:icons

# Note: Don't expose ports here, Compose will handle that for us

# Start Vue.js in development mode using pnpm
CMD pnpm dev --host
