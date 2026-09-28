/* ============================================================
   js/data/roadmap.js
   The preloaded learning roadmap: 12 phases and their topics.

   This file is the single source of truth for the curriculum.
   Editing it and reloading the app will ADD any new topics to your
   saved data without touching the progress you already recorded.
   (See store.ensureRoadmap() for how the merge works.)
   ============================================================ */
window.App = window.App || {};

App.ROADMAP = [
  {
    id: 'fundamentals',
    name: 'C# Fundamentals',
    blurb: 'Syntax, data, control flow and the built-in collections.',
    color: '#8b5cf6',
    topics: [
      'Variables', 'Data Types', 'Type Conversion', 'Operators', 'Strings',
      'Conditions', 'Loops', 'Methods', 'Parameters', 'Return Values',
      'Arrays', 'Lists', 'Dictionaries', 'HashSet', 'Debugging'
    ]
  },
  {
    id: 'core',
    name: 'Core C#',
    blurb: 'Object-oriented modelling: types, inheritance and interfaces.',
    color: '#7c8cff',
    topics: [
      'Classes', 'Objects', 'Constructors', 'Properties', 'Fields',
      'Access Modifiers', 'Encapsulation', 'Inheritance', 'Polymorphism',
      'Abstraction', 'Interfaces', 'Structs', 'Enums', 'Records',
      'Nullable Reference Types', 'Value Types vs Reference Types'
    ]
  },
  {
    id: 'professional',
    name: 'Professional C#',
    blurb: 'The language features you use every day on a real team.',
    color: '#38bdf8',
    topics: [
      'Generics', 'Collections', 'Exceptions', 'File Handling', 'DateTime',
      'Delegates', 'Events', 'Lambda Expressions', 'LINQ', 'Extension Methods',
      'Pattern Matching', 'Iterators', 'Attributes', 'Reflection Basics'
    ]
  },
  {
    id: 'async',
    name: 'Async / Await',
    blurb: 'Asynchronous programming, threading and concurrency hazards.',
    color: '#22d3ee',
    topics: [
      'async', 'await', 'Task', 'CancellationToken', 'Parallelism',
      'Threading', 'Synchronization', 'Race Conditions', 'Deadlocks', 'Concurrency'
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced C#',
    blurb: 'Memory, allocations, performance and the deep end of the language.',
    color: '#2dd4bf',
    topics: [
      'Garbage Collection', 'Memory', 'IDisposable', 'using', 'await using',
      'Boxing', 'Allocations', 'Performance', 'Profiling',
      'Advanced Generics', 'Advanced LINQ', 'Advanced Async'
    ]
  },
  {
    id: 'testing',
    name: 'Testing',
    blurb: 'Software engineering craft: SOLID, clean code and all levels of testing.',
    color: '#34d399',
    topics: [
      'SOLID', 'Clean Code', 'Dependency Injection', 'Design Patterns',
      'Refactoring', 'Logging', 'Configuration', 'Error Handling',
      'Unit Testing', 'Integration Testing', 'Mocking', 'Code Review'
    ]
  },
  {
    id: 'aspnet',
    name: 'ASP.NET Core',
    blurb: 'Building and securing real web APIs.',
    color: '#a3e635',
    topics: [
      'HTTP', 'REST', 'Minimal APIs', 'Controllers', 'Routing', 'Model Binding',
      'DTOs', 'Validation', 'Middleware', 'Dependency Injection',
      'Authentication', 'Authorization', 'JWT', 'Entity Framework Core',
      'Transactions', 'Caching', 'Logging', 'Swagger/OpenAPI', 'API Testing',
      'Security', 'Performance', 'Background Services'
    ]
  },
  {
    id: 'sql',
    name: 'SQL',
    blurb: 'Querying, modelling and tuning relational data.',
    color: '#fbbf24',
    topics: [
      'SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'INSERT', 'UPDATE',
      'DELETE', 'JOINs', 'Subqueries', 'CTEs', 'CASE', 'Aggregations',
      'Primary Keys', 'Foreign Keys', 'Indexes', 'Transactions',
      'Normalization', 'Execution Plans', 'Query Optimization'
    ]
  },
  {
    id: 'angular',
    name: 'Angular',
    blurb: 'The front end of a full-stack .NET application.',
    color: '#fb923c',
    topics: [
      'Components', 'Templates', 'TypeScript', 'Services', 'Dependency Injection',
      'Routing', 'Forms', 'Reactive Forms', 'Validation', 'HTTP',
      'Interceptors', 'Guards', 'Observables', 'RxJS', 'State Management', 'Performance'
    ]
  },
  {
    id: 'azure',
    name: 'Azure / Cloud',
    blurb: 'Hosting, identity, monitoring and delivery in the cloud.',
    color: '#f87171',
    topics: [
      'Cloud Fundamentals', 'Azure Architecture', 'Resource Groups', 'Subscriptions',
      'Regions', 'App Service', 'Azure SQL', 'Storage', 'Key Vault', 'Entra ID',
      'Managed Identity', 'Application Insights', 'Azure Monitor', 'Networking',
      'Docker', 'CI/CD'
    ]
  },
  {
    id: 'system-design',
    name: 'System Design',
    blurb: 'Designing systems that stay up as they grow.',
    color: '#f472b6',
    topics: [
      'Requirements', 'Scalability', 'Availability', 'Reliability', 'Caching',
      'Load Balancing', 'Databases', 'Messaging', 'Queues',
      'Distributed Systems', 'CAP', 'Observability'
    ]
  },
  {
    id: 'ai',
    name: 'AI-assisted Development',
    blurb: 'Using AI tools well - and knowing when not to trust them.',
    color: '#c084fc',
    topics: [
      'Effective prompting', 'Code generation', 'Code review with AI',
      'Debugging with AI', 'Test generation', 'Refactoring with AI',
      'Architecture analysis', 'AI limitations',
      'Verification of AI-generated code', 'Using coding agents responsibly'
    ]
  }
];

/* Quick lookup: phase id -> phase object */
App.PHASE_BY_ID = App.ROADMAP.reduce(function (map, phase) {
  map[phase.id] = phase;
  return map;
}, {});

/* The five topic statuses, in learning order.
   `weight` drives every progress percentage in the app. */
App.STATUSES = [
  { id: 'not-started',  label: 'Not Started',  weight: 0.00, color: 'var(--st-not-started)' },
  { id: 'learning',     label: 'Learning',     weight: 0.25, color: 'var(--st-learning)' },
  { id: 'practicing',   label: 'Practicing',   weight: 0.50, color: 'var(--st-practicing)' },
  { id: 'comfortable',  label: 'Comfortable',  weight: 0.80, color: 'var(--st-comfortable)' },
  { id: 'mastered',     label: 'Mastered',     weight: 1.00, color: 'var(--st-mastered)' }
];

App.STATUS_BY_ID = App.STATUSES.reduce(function (map, s) { map[s.id] = s; return map; }, {});

/* A topic counts as "completed" once you are comfortable with it. */
App.COMPLETED_STATUSES = ['comfortable', 'mastered'];
