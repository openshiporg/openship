# Openship

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenship-org%2Fopenship%2F&stores=[{"type"%3A"postgres"}])

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/openship)

Openship is an order router that connects the places where you're selling to the places where you're fulfilling. It automatically routes orders from your sales channels to your fulfillment partners, giving you complete control over your order flow.

## Demo Video

[![Watch Openship Demo](https://img.youtube.com/vi/C55wxCMAX8E/maxresdefault.jpg)](https://youtu.be/C55wxCMAX8E)

*Watch a complete demo of Openship's order routing capabilities*

Built on top of [next-keystone-starter](https://github.com/junaid33/next-keystone-starter), which provides the foundational architecture for modern full-stack applications with KeystoneJS and Next.js.

## Core Concepts

### Shops
Shops represent your online stores where your customers place orders (e.g. Shopify, WooCommerce, eBay, Amazon). Once connected, new orders can be routed to Openship to be fulfilled.

### Channels
Channels represent destinations where your orders can be routed and fulfilled. A channel could be an existing platform like your supplier's Shopify shop or a 3PL fulfillment service. It could also be something very simple like adding a row to a Google Sheet or sending an email with the order details.

### Links
Links represent a connection between a shop and a channel. Once linked, new shop orders are forwarded to the linked channel for fulfillment.

### Matches
For finer control over the fulfillment process, matches can be created on the product level. Matches represent a connection between your shop products and your channel products. When a match is created between a shop product and channel product, Openship will automatically process that order.

## Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: KeystoneJS 6 with GraphQL API
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Session-based with role-based permissions
- **Foundation**: Built on [next-keystone-starter](https://github.com/junaid33/next-keystone-starter)

### Application Structure
```
openship/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Admin interface
│   ├── (storefront)/      # Customer-facing pages
│   └── api/              # API endpoints and webhooks
├── features/
│   ├── keystone/         # Backend models and GraphQL schema
│   ├── platform/         # Admin platform components
│   ├── storefront/       # Frontend components and screens
│   └── integrations/     # Shop and channel integrations
└── components/           # Shared UI components
```

## Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL database
- npm, yarn, pnpm, or bun

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/openship-org/openship.git
   cd openship
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Required - Database Connection
   DATABASE_URL="postgresql://username:password@localhost:5432/openship"
   
   # Required - Session Security (must be at least 32 characters)
   SESSION_SECRET="your-very-long-session-secret-key-here-32-chars-minimum"
   
   # Optional - SMTP configuration for email notifications
   SMTP_FROM="no-reply@yourdomain.com"
   SMTP_HOST="your-smtp-host"
   SMTP_PASSWORD="your-smtp-password"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-user"
   
   # Optional - Shop Integrations
   SHOPIFY_APP_KEY="your-shopify-app-key"
   SHOPIFY_APP_SECRET="your-shopify-app-secret"
   
   # Optional - Channel Integrations
   SHIPPO_API_KEY="shippo_test_..."
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   This will:
   - Build KeystoneJS schema
   - Run database migrations
   - Start Next.js development server with Turbopack

4. **Access the application:**
   - **Dashboard**: [http://localhost:3000](http://localhost:3000) - Order routing interface
   - **GraphQL API**: [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql) - Interactive API explorer

5. **Create your first admin user:**
   On first visit to the dashboard, you'll be prompted to create an admin user account at `/init`

6. **Connect your first shop and channel:**
   After creating your admin account, start by connecting a shop (where orders come from) and a channel (where orders are fulfilled)

## Development Commands

- `npm run dev` - Build Keystone + migrate + start Next.js dev server
- `npm run build` - Build Keystone + migrate + build Next.js for production
- `npm run migrate:gen` - Generate and apply new database migrations
- `npm run migrate` - Deploy existing migrations to database
- `npm run lint` - Run ESLint

## Key Features

### Order Routing
- Automatic order routing from shops to channels
- Multi-channel fulfillment support
- Real-time order synchronization
- Flexible routing rules and conditions

### Shop Integrations
- **Shopify**: Native integration for order import
- **WooCommerce**: WordPress e-commerce support
- **Custom APIs**: Build custom shop connectors
- **Webhook Support**: Real-time order notifications

### Channel Integrations
- **Shopify**: Route orders to supplier Shopify stores
- **3PL Services**: Integration with fulfillment partners
- **Custom Channels**: Email, Google Sheets, webhooks
- **Dropshipping**: Direct supplier integrations

### Product Matching
- Intelligent product matching between shops and channels
- Bulk matching capabilities
- Variant-level matching support
- Flexible matching rules and exceptions

### Order Management
- Real-time order tracking and status updates
- Automated fulfillment workflows
- Error handling and retry mechanisms
- Comprehensive order history and analytics

## Documentation

For comprehensive technical documentation, see [docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce) which covers:
- Complete integration guides
- API reference and operations
- Custom shop and channel development
- Webhook configuration and security
- Advanced routing configurations

## Deployment

### Production Deployment
Openship is production-ready and can be deployed to:

- **Vercel**: One-click deployment with the button above
- **Railway**: One-click deployment with the button above
- **Docker**: Containerized deployment with included Dockerfile
- **Self-hosted**: Deploy to any Node.js hosting environment

### Scaling Considerations
- Database optimization for high-volume order processing
- Background job processing for order routing
- Webhook reliability and retry mechanisms
- Monitoring and alerting for failed orders

## Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code standards and conventions
- Testing requirements
- Pull request process
- Issue reporting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check our comprehensive documentation at [docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce)
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Community**: Join our community discussions
- **Enterprise**: Contact us for enterprise support and custom integrations

---

**Openship** - Order Routing Platform  
Built with Next.js 15 and KeystoneJS 6