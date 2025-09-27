# Healthcare Connect Platform

## Overview

Healthcare Connect is a web-based platform designed to address inefficiencies in South Africa's public healthcare system. The platform connects young and experienced healthcare professionals while providing robust patient data management capabilities. Built with modern web technologies, it features offline-first capabilities to handle poor internet connectivity common in rural healthcare settings.

The system enables young nurses and doctors to find job opportunities and practical placements while facilitating experienced doctors to contribute through remote volunteering and mentorship without requiring extensive travel. Additionally, it provides a centralized patient data management system that works offline and syncs when connectivity is available.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based UI framework providing type safety and developer experience
- **Shadcn/UI Component Library**: Accessible, customizable UI components built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design with CSS custom properties for theming
- **Wouter**: Lightweight client-side routing solution for single-page application navigation
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Vite**: Fast build tool and development server with hot module replacement

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with strong typing and middleware support
- **Service-Action Pattern**: Clean architecture separating business logic into services and orchestration into actions
- **Dependency Injection**: Services are injected through constructors for testability and modularity
- **Joi Validation**: Schema-based input validation for all API endpoints
- **JWT Authentication**: Stateless authentication with bcrypt password hashing (12 rounds minimum)
- **Rate Limiting**: Protection against abuse with configurable limits per endpoint

### Data Layer
- **PostgreSQL with Neon**: Cloud-hosted PostgreSQL database for production scalability
- **Drizzle ORM**: Type-safe database toolkit providing schema definitions and query building
- **Offline Storage**: IndexedDB and LocalStorage for client-side data persistence
- **Data Synchronization**: Automatic sync mechanism when connectivity is restored

### Security Implementation
- **Helmet.js**: Security headers for XSS protection and content security policy
- **CORS Configuration**: Cross-origin resource sharing with proper domain restrictions
- **Input Sanitization**: All user inputs validated and sanitized before processing
- **Role-based Access Control**: Granular permissions for doctors, nurses, and administrators
- **Audit Logging**: Comprehensive activity tracking for compliance and security monitoring

### Offline Capabilities
- **Progressive Web App**: Service worker implementation for offline functionality
- **Local Data Storage**: Critical data cached locally using IndexedDB
- **Sync Queue**: Pending operations stored locally and executed when online
- **Conflict Resolution**: Strategies for handling data conflicts during synchronization

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and branching
- **Replit Hosting**: Cloud-based development and deployment environment

### Authentication & Security
- **bcrypt**: Industry-standard password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **helmet**: Security middleware for Express applications
- **express-rate-limit**: Rate limiting middleware for API protection

### UI Framework & Components
- **Radix UI Primitives**: Unstyled, accessible UI components (@radix-ui/react-*)
- **Lucide React**: Comprehensive icon library with consistent design
- **class-variance-authority**: Utility for creating component variants
- **clsx & tailwind-merge**: Conditional CSS class management

### Development Tools
- **Drizzle Kit**: Database schema management and migration tools
- **TypeScript**: Static type checking for enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

### Data Management
- **TanStack React Query**: Server state management with intelligent caching
- **date-fns**: Date manipulation and formatting utilities
- **connect-pg-simple**: PostgreSQL session store for Express sessions

The architecture prioritizes offline functionality, security, and user experience while maintaining scalability for deployment across multiple healthcare facilities in South Africa.