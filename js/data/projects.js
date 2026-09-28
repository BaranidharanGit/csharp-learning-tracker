/* ============================================================
   js/data/projects.js
   The six starter projects, seeded once on first run.
   Deleting a project here does NOT bring it back later
   (store.js remembers that projects were already seeded).
   ============================================================ */
window.App = window.App || {};

App.SEED_PROJECTS = [
  {
    name: 'C# Console Application',
    description: 'A first end-to-end console app: input, validation, collections and file output. Proves you can build something that runs without a framework doing the work for you.',
    technologies: ['C#', '.NET', 'Console'],
    status: 'Not Started',
    features: [
      'Menu-driven interface',
      'Input validation and error handling',
      'Store records in a List / Dictionary',
      'Save and load data from a file',
      'Unit tests for the core logic'
    ]
  },
  {
    name: 'C# Problem Solving Project',
    description: 'A repository of solved problems: arrays, strings, dictionaries, recursion and LINQ. Built to make problem solving automatic rather than looked-up.',
    technologies: ['C#', '.NET', 'LINQ', 'xUnit'],
    status: 'Not Started',
    features: [
      '25 array and string problems',
      '15 dictionary / set problems',
      '10 recursion problems',
      'LINQ rewrite of 20 solutions',
      'Test per solution',
      'Complexity notes in the README'
    ]
  },
  {
    name: 'Employee Management API',
    description: 'A REST API over an employee domain with EF Core, validation, DTOs and Swagger. The first real backend.',
    technologies: ['ASP.NET Core', 'EF Core', 'SQL Server', 'Swagger'],
    status: 'Not Started',
    features: [
      'CRUD endpoints for employees',
      'EF Core model and migrations',
      'DTOs and AutoMapper (or manual mapping)',
      'FluentValidation or data annotations',
      'Global error-handling middleware',
      'Swagger / OpenAPI documentation',
      'Integration tests with WebApplicationFactory'
    ]
  },
  {
    name: 'Full Stack Employee Management System',
    description: 'The Angular front end for the employee API: routing, reactive forms, interceptors and guards against a real backend.',
    technologies: ['Angular', 'TypeScript', 'RxJS', 'ASP.NET Core'],
    status: 'Not Started',
    features: [
      'Employee list with filtering and paging',
      'Reactive create / edit form with validation',
      'HTTP service layer and typed models',
      'Auth interceptor and route guard',
      'Loading and error states',
      'Deployed locally end to end'
    ]
  },
  {
    name: 'Production-style ASP.NET Core Application',
    description: 'The same domain built the way a team would ship it: layered, tested, observable, secured and configurable.',
    technologies: ['ASP.NET Core', 'EF Core', 'JWT', 'Serilog', 'xUnit'],
    status: 'Not Started',
    features: [
      'Clean layering and dependency injection',
      'JWT authentication and role-based authorization',
      'Structured logging with Serilog',
      'Configuration per environment + secrets',
      'Caching and pagination',
      'Background service for a recurring job',
      'Unit + integration test suite',
      'Health checks'
    ]
  },
  {
    name: 'Azure Cloud Deployment Project',
    description: 'Take the production-style app to Azure: App Service, Azure SQL, Key Vault, managed identity, App Insights and a CI/CD pipeline.',
    technologies: ['Azure', 'App Service', 'Azure SQL', 'Key Vault', 'GitHub Actions', 'Docker'],
    status: 'Not Started',
    features: [
      'Resource group and naming convention',
      'App Service deployment',
      'Azure SQL database + migrations on deploy',
      'Secrets in Key Vault via managed identity',
      'Application Insights dashboards and alerts',
      'CI/CD pipeline (build, test, deploy)',
      'Containerised build with Docker'
    ]
  }
];

/* ============================================================
   Mini-projects (schema v2)
   These unlock progressively as you master the topics they need.
   `requiredTopicIds` drives the unlock bar on the Projects page.
   ============================================================ */
App.SEED_MINI_PROJECTS = [
  {
    name: 'Personal Expense Tracker',
    description: 'The C# Fundamentals capstone. A console app that records expenses, categorises them and reports on them - using only what you have learned in phase one. Build it once you can write the fundamentals without looking things up.',
    technologies: ['C#', '.NET', 'Console'],
    status: 'Not Started',
    isMiniProject: true,
    requiredTopicIds: [
      'fundamentals:variables',
      'fundamentals:conditions',
      'fundamentals:loops',
      'fundamentals:methods',
      'fundamentals:lists',
      'fundamentals:dictionaries'
    ],
    features: [
      'Add an expense with an amount, category and date',
      'Validate every input - reject anything that will not parse',
      'List all expenses in a readable table',
      'Total spending per category (dictionary)',
      'Find the largest single expense and the busiest category',
      'Monthly summary with an average per day',
      'Reject duplicate entries (HashSet on a composite key)',
      'Split the program into named methods, none longer than 20 lines',
      'Handle an empty expense list everywhere without crashing'
    ],
    notes: 'Rules: no AI, no copying from the lessons. Use the topic notes you wrote yourself if you get stuck.'
  }
];
