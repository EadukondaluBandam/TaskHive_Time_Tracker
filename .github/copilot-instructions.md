# Copilot Instructions for Worksight Codebase

## Overview
This document provides essential guidelines for AI coding agents to effectively navigate and contribute to the Worksight codebase. Understanding the architecture, workflows, and conventions is crucial for productivity.

## Architecture
- **Components**: The application is structured around several key components, including user management, project tracking, and task management. Each component is encapsulated within its own directory under `src/pages`.
- **Data Flow**: Data is managed through a centralized storage system (`lib/storage`), which handles CRUD operations for users, projects, and tasks. This promotes a clear separation of concerns and facilitates easier testing and debugging.
- **Service Boundaries**: Major services include `UserStorage`, `ProjectStorage`, and `TaskStorage`, which interact with the UI components to provide a seamless user experience.

## Developer Workflows
- **Building the Project**: Use the command `npm run build` to compile the project for production. For development, run `npm run dev` to start the Vite development server.
- **Testing**: Execute tests with `npm run test` or `npm run test:watch` for continuous testing during development. Tests are located in the `test` directory.
- **Debugging**: Utilize browser developer tools for debugging. Ensure to check console logs for any runtime errors or warnings.

## Project-Specific Conventions
- **State Management**: React's `useState` and `useEffect` hooks are extensively used for managing component state and side effects. Ensure to follow the established patterns for state updates and data fetching.
- **Styling**: Tailwind CSS is used for styling components. Familiarize yourself with the utility-first approach to apply styles effectively.
- **Component Structure**: UI components are organized under `src/components/ui`. Each component should be self-contained and reusable, following the naming convention of `PascalCase`.

## Integration Points
- **External Dependencies**: The project relies on several libraries, including `lucide-react` for icons and `sonner` for notifications. Ensure to check `package.json` for the complete list of dependencies.
- **Cross-Component Communication**: Use context providers (e.g., `AuthContext`, `NotificationContext`) for managing global state and facilitating communication between components.

## Key Files and Directories
- **Main Application Entry**: `src/main.tsx` - The entry point for the React application.
- **Routing**: `src/pages` - Contains all the page components, each representing a route in the application.
- **Mock Data**: `src/lib/mockData.ts` - Contains mock data used for development and testing purposes.

## Conclusion
This document serves as a foundational guide for AI agents working within the Worksight codebase. For further assistance, refer to the specific component files and existing documentation within the repository.