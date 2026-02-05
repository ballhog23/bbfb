# Bleed Blue Fantasy Football

A fantasy football league management application built to track historical data and current state from the Sleeper API.

## Architecture

**Tech Stack:**
- **Frontend/Backend**: Express.js + Pug templates
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Styling**: Sass
- **Build**: TypeScript, esbuild

**Infrastructure** (AWS 3-tier architecture):
- **Reverse Proxy**: Nginx with SSL (Let's Encrypt) on EC2
- **App Server**: Node.js 24 application on EC2
- **Database**: PostgreSQL 16 on EC2 (isolated subnet)
- **Networking**: VPC with public, private, and isolated subnets
- **NAT Instance**: Provides outbound internet access for private subnet
- **Access**: AWS Systems Manager (SSM) Session Manager (no SSH keys)

## Development Setup

### Prerequisites
- Node.js 24+
- PostgreSQL 16
- npm

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```env
   PLATFORM=dev
   PORT=3000
   LEAGUE_ID=your_sleeper_league_id
   DB_URL=postgres://user:password@localhost:5432/bbfb
   TZ=America/Chicago
   ```

3. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb bbfb

   # Generate and run migrations
   npm run generate  # If schema changed
   npm run migrate
   ```

4. **Build and run:**
   ```bash
   # Development mode (with watch)
   npm run dev

   # Or build and start
   npm run build
   npm start
   ```

5. **Access the app:**
   ```
   http://localhost:3000
   ```

## Scripts

- `npm run build` - Build server and client code
- `npm run build:server` - Build TypeScript server code
- `npm run build:client` - Build client-side TypeScript with esbuild
- `npm run build:scss` - Compile Sass to CSS
- `npm run dev` - Development mode with watch
- `npm run start` - Start production server
- `npm run generate` - Generate Drizzle migrations
- `npm run migrate` - Run Drizzle migrations
- `npm test` - Run tests

## Project Goals

- Learn to manage 3rd party data (Sleeper API)
- Practice database design and data integrity
- Ensure incoming data validation with Zod
- Maintain historical league data even if Sleeper API changes
- Explore AWS services and infrastructure patterns

## Deployment

For AWS infrastructure deployment instructions, see [infra/DEPLOYMENT.md](infra/DEPLOYMENT.md).

## Data Source

Thanks to the [Sleeper API](https://docs.sleeper.app/) for providing free access to fantasy football league data.
