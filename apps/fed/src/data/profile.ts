// Static CV profile (Site Fase A — reframe-first). The SPA renders this versioned data directly (zero
// /profile request). Same shape as `Profile` (../types/profile), consumed by ProfileView / useProfile.
//
// Positioning: AI Engineer (agentic development / applied GenAI), anchored in SDLC + distributed
// systems. Sourced from LinkedIn + the Canva CV (2026-07), reframed to the new positioning.
import type { Profile } from '../types/profile';

export const profile: Profile = {
  profile_id: 'me',
  name: 'Luiz Tadeu Mendonça',
  headline:
    'AI Engineer — Agentic Development & GenAI Apps | AI-DLC / Loop Engineering with Claude Code & Kiro | ' +
    'Python · TypeScript · AWS · Terraform | 17y across SDLC & Distributed Systems',
  summary:
    'AI Engineer applying AI-native development — Claude Code, Kiro, and AI-DLC / Loop Engineering — to ' +
    'design, build and ship production-ready systems, anchored in 17 years of software engineering across ' +
    'enterprise SDLC and distributed systems. My lane is applied GenAI and agentic development, not machine ' +
    'learning research: I build with agentic patterns — tool-calling, RAG, memory, evaluation loops, MCP — ' +
    'and bring the SDLC rigor that turns AI work into production software. Python for AI, agents and backend; ' +
    'TypeScript for the full-stack and web layer.',
  location: 'São Paulo — Brazil',
  experience: [
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Senior Cloud Application Architect',
      start_date: '2023-04',
      end_date: null,
      description:
        'Embedded in enterprise engineering teams delivering cloud-native, distributed systems end-to-end — ' +
        'from application code to infrastructure as code — while moving delivery into an AI-native loop with ' +
        'Claude Code, Kiro and AI-DLC / Loop Engineering practices.',
      highlights: [
        'Adopted AI-native development (Claude Code, Kiro, AI-DLC / Loop Engineering) to design, build and ' +
          'ship production-ready systems, and matured these practices for how engineering teams adopt them.',
        'Built an internal knowledge platform with a bidirectional MCP server and semantic search (vector ' +
          'embeddings on Amazon Bedrock), enabling AI agents to both search and create knowledge.',
        'Architected cloud-native distributed systems for enterprise programs in regulated industries — ' +
          'financial services, aerospace, energy — navigating compliance and data-sovereignty constraints.',
        'Developed reusable Terraform modules, deployment patterns and internal tooling that other ' +
          'engineering teams build on.',
        'Led engagements across LATAM, presenting architecture and delivery strategy to C-level and ' +
          'technical stakeholders in English, Spanish and Portuguese.',
      ],
    },
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Cloud Application Architect',
      start_date: '2021-01',
      end_date: '2023-03',
      description:
        'Architected and implemented cloud-native solutions embedded within enterprise client teams, ' +
        'operating under legacy, compliance and data-sovereignty constraints.',
      highlights: [
        'Designed and shipped cloud-native applications end-to-end, from ideation through production.',
        'Developed Terraform modules across basic and advanced infrastructure patterns for application ' +
          'deployments on AWS.',
        'Applied software engineering practices to infrastructure as code to standardize and accelerate ' +
          'cloud adoption across client development teams.',
        'Worked hands-on with serverless and container stacks: Lambda, ECS/EKS, API Gateway, DynamoDB, S3, SQS/SNS.',
      ],
    },
    {
      company: 'Globo.com',
      title: 'Senior DevOps Engineer',
      start_date: '2020-06',
      end_date: '2021-01',
      description:
        'Owned the observability foundation for a large-scale direct-to-consumer streaming launch, spanning ' +
        'frontend, backend and infrastructure layers.',
      highlights: [
        'Built an end-to-end observability platform integrating AppDynamics, Grafana, Prometheus and Zabbix ' +
          'into a unified monitoring solution.',
        'Instrumented frontend (Angular) and backend (Spring Boot) services alongside infrastructure to ' +
          'support a high-traffic launch.',
      ],
    },
    {
      company: 'Accenture',
      title: 'Digital Business Integration Consultant',
      start_date: '2008-03',
      end_date: '2020-06',
      description:
        'Application architect for web and mobile products, designing distributed systems and integration ' +
        'layers across large enterprise programs.',
      highlights: [
        'Architected web and mobile products (React, Angular, Android, iOS, Flutter frontends with Node.js ' +
          'backends), designing the integration layers connecting apps, APIs and enterprise platforms.',
        'Built and integrated large-scale distributed systems across batch and real-time processing, ' +
          'connecting enterprise platforms in retail, telecom and e-commerce.',
        'Delivered across the full SDLC for enterprise clients, from requirements through production.',
      ],
    },
  ],
  education: [
    {
      institution: 'Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)',
      degree: "Bachelor's Degree",
      field: 'Information Technology / Systems Analysis',
      start_date: '2006',
      end_date: '2010',
    },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services (AWS)' },
    { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services (AWS)' },
    { name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services (AWS)' },
    { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services (AWS)' },
    { name: 'AWS Well-Architected Proficient', issuer: 'Amazon Web Services (AWS)' },
  ],
  skills: {
    'AI & Agentic': [
      'Agentic AI Development',
      'Applied Generative AI',
      'Large Language Models (LLM)',
      'AI Agents & Tool-Calling',
      'RAG (Retrieval-Augmented Generation)',
      'MCP (Model Context Protocol)',
      'Context & Prompt Engineering',
      'Agent Evaluation (LLM-as-judge)',
    ],
    Languages: ['Python', 'TypeScript', 'JavaScript', 'Node.js', 'Java'],
    'Backend & Distributed Systems': [
      'Distributed Systems Architecture',
      'Microservices',
      'Event-Driven Architecture',
      'Backend-for-Frontend (BFF)',
      'API Design',
    ],
    'Cloud & Infra': [
      'AWS (Bedrock, Lambda, ECS, EKS, S3, DynamoDB, API Gateway)',
      'Terraform',
      'Infrastructure as Code',
      'CloudFormation',
    ],
    'Practices & Tooling': ['AI-DLC / Loop Engineering', 'Claude Code', 'Kiro', 'CI/CD', 'Automated Testing', 'Observability'],
    'Languages (spoken)': ['Portuguese (Native)', 'English (Advanced)', 'Spanish (Intermediate)'],
  },
  metadata: {
    github: 'https://github.com/tedeuxx',
    linkedin: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530',
  },
  updated_at: '2026-07-21',
};
