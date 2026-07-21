// Static CV profile (Site Fase A — reframe-first). The SPA no longer fetches the profile from the BFF;
// it renders this versioned data directly (zero /profile request). Same shape as the BFF `Profile`
// entity (see ../types/profile), so `ProfileView` and `useProfile` consume it unchanged.
//
// ⚠️ CONTENT-TO-REFRESH: the values below are the CURRENT live data pulled verbatim from staging
// (2026-06-17), which is still the "Senior Software Engineer / Distributed Systems" positioning — NOT
// yet the "AI Engineer agentic" rewrite. Swap headline/summary/skills/experience for the new-positioning
// CV (the one already rewritten on LinkedIn) — that's an owner content decision, not an agent one.
import type { Profile } from '../types/profile';

export const profile: Profile = {
  profile_id: 'me',
  name: 'Luiz Tadeu Mendonça',
  headline: 'Senior Software Engineer · Distributed Systems | Cloud-Native Applications | Backend Engineering',
  summary:
    'Senior Software Engineer with experience designing and building distributed systems and cloud-native ' +
    'applications at scale. Strong background in backend engineering, system design and high-performance ' +
    'architectures, with hands-on experience delivering reliable systems in complex environments. Combines ' +
    'deep technical execution with a strong understanding of product impact and real-world system trade-offs.',
  location: 'São Paulo — Brazil',
  experience: [
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Senior Cloud Application Architect',
      start_date: '2021-01',
      end_date: null,
      description:
        'Led cloud-native architecture and application modernization engagements across financial services, ' +
        'energy, food-tech, aerospace and media — acting as hands-on technical lead from system design through ' +
        'implementation.',
      highlights: [
        'Built distributed backend systems with event-driven architectures (SQS/SNS), container orchestration ' +
          '(EKS, ECS) and serverless compute (Lambda/DynamoDB); contributed to React SPA and portal development.',
        'Established cloud enablement foundations through VPC design and reusable Terraform modules, ' +
          'standardizing AWS adoption across client development teams.',
        'Core services: S3, ECS, EKS, Lambda, SQS/SNS, API Gateway, CloudFront, Cognito, Route 53, WAF, ' +
          'DocumentDB, Amazon Verified Permissions, Terraform.',
      ],
    },
    {
      company: 'Globo.com',
      title: 'Senior DevOps Engineer',
      start_date: '2020-06',
      end_date: '2021-01',
      description:
        'Built an end-to-end observability platform for a large-scale D2C streaming launch — covering frontend ' +
        '(Angular), backend (Spring Boot) and infrastructure layers, integrating AppDynamics, Grafana, ' +
        'Prometheus and Zabbix into a unified monitoring solution.',
    },
    {
      company: 'Accenture',
      title: 'Digital Business Integration Consultant',
      start_date: '2008-03',
      end_date: '2020-06',
      description:
        'Acted as application architect for web and mobile products — React, Android and Ionic frontends with ' +
        'Node.js backends — designing distributed systems and integration layers connecting mobile apps, APIs ' +
        'and enterprise platforms.',
      highlights: [
        'Built and integrated large-scale distributed systems across batch and real-time processing using ' +
          'Informatica PowerCenter and SOA, connecting CRM, telecom and e-commerce platforms.',
      ],
    },
  ],
  education: [
    {
      institution: 'PUC-Rio',
      degree: "Bachelor's Degree",
      field: 'Information Technology',
      start_date: '',
      end_date: '2010',
    },
  ],
  certifications: [],
  skills: {
    Backend: ['Distributed Systems', 'Event-Driven (SQS/SNS)', 'DynamoDB', 'Node.js', 'Spring Boot'],
    'Cloud & Infra': ['AWS', 'Terraform', 'EKS', 'ECS', 'Lambda', 'API Gateway', 'CloudFront', 'Cognito', 'WAF'],
    Frontend: ['React', 'Angular', 'Ionic'],
    Idiomas: ['Português — Nativo', 'Inglês — Avançado', 'Espanhol — Intermediário'],
  },
  metadata: {
    github: 'https://github.com/tedeuxx',
    linkedin: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/',
    medium: 'https://tadeumendonca.medium.com',
  },
  updated_at: '2026-06-17T13:32:23.612Z',
};
