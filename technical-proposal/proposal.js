const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, TableOfContents
} = require('docx');
const fs = require('fs');

// ─── Color Palette ───────────────────────────────────────────────────────────
const BLUE_DARK   = "1B3A6B"; // deep navy
const BLUE_MID    = "2E6DB4"; // mid blue
const BLUE_LIGHT  = "D6E4F0"; // light blue cell fill
const BLUE_HEADER = "1B3A6B"; // table header fill
const GREY_LIGHT  = "F5F5F5";
const WHITE       = "FFFFFF";
const TEXT_DARK   = "1A1A1A";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const border = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (color = "CCCCCC") => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noAllBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 30, font: "Arial", color: BLUE_DARK })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BLUE_MID })]
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    alignment: opts.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_DARK, ...opts })]
  });
}
function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Arial", color: TEXT_DARK });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_DARK })]
  });
}
function space(before = 100) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
    children: [new TextRun("")]
  });
}

// ─── Cover Page helper ────────────────────────────────────────────────────────
function coverLine(label, value) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noAllBorders,
          width: { size: 3000, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 0, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, font: "Arial", color: BLUE_DARK })] })]
        }),
        new TableCell({
          borders: noAllBorders,
          width: { size: 6360, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 22, font: "Arial", color: TEXT_DARK })] })]
        })
      ]
    })]
  });
}

// ─── Standard 3-col table row ─────────────────────────────────────────────────
function tRow3(c1, c2, c3, header = false) {
  const fill = header ? BLUE_HEADER : WHITE;
  const textColor = header ? WHITE : TEXT_DARK;
  const bld = header;
  const cols = [3120, 3120, 3120];
  return new TableRow({
    children: [c1, c2, c3].map((txt, i) =>
      new TableCell({
        width: { size: cols[i], type: WidthType.DXA },
        borders: allBorders("CCCCCC"),
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: textColor, bold: bld })] })]
      })
    )
  });
}

// ─── 2-col table row ─────────────────────────────────────────────────────────
function tRow2(c1, c2, header = false, w1 = 3000, w2 = 6360) {
  const fill = header ? BLUE_HEADER : WHITE;
  const tc = header ? WHITE : TEXT_DARK;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: w1, type: WidthType.DXA },
        borders: allBorders("CCCCCC"),
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: c1, size: 20, font: "Arial", color: tc, bold: header })] })]
      }),
      new TableCell({
        width: { size: w2, type: WidthType.DXA },
        borders: allBorders("CCCCCC"),
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: c2, size: 20, font: "Arial", color: tc, bold: false })] })]
      })
    ]
  });
}

// ─── Timeline table row ───────────────────────────────────────────────────────
function tRowTimeline(phase, duration, activity, fillAlt = false) {
  const fill = fillAlt ? BLUE_LIGHT : WHITE;
  const widths = [2200, 1600, 5560];
  return new TableRow({
    children: [phase, duration, activity].map((txt, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        borders: allBorders("CCCCCC"),
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
      })
    )
  });
}

// ─── Main Document Build ─────────────────────────────────────────────────────
const children = [];

// ╔══════════════════════════════════════════════════════════╗
// ║                     COVER PAGE                          ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  space(1440),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "ENVELOPE A", size: 24, font: "Arial", color: BLUE_MID, bold: true, allCaps: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: "TECHNICAL PROPOSAL", size: 48, font: "Arial", color: BLUE_DARK, bold: true, allCaps: true })]
  }),
  divider(),
  space(120),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "Cloud-Native Application Orchestration & Deployment System", size: 28, font: "Arial", color: BLUE_MID, bold: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: "Mardan Smart City — Citizen Complaint Portal", size: 26, font: "Arial", color: TEXT_DARK, italics: true })]
  }),
  space(360),
  coverLine("Tender Reference:", "DESC-MRD-2026-CNC-088"),
  space(60),
  coverLine("Submitted To:", "DESC Digital Innovation Center, Mardan"),
  space(60),
  coverLine("Submitted By:", "CloudPeak Technologies, Peshawar, KPK"),
  space(60),
  coverLine("Lead Architect:", "Muhammad Shoaib Khan"),
  space(60),
  coverLine("Submission Date:", "June 14, 2026"),
  space(60),
  coverLine("Document Type:", "Envelope A — Technical Proposal (No Pricing)"),
  space(720),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID } },
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: "CONFIDENTIAL — FOR EVALUATION PURPOSES ONLY", size: 18, font: "Arial", color: BLUE_MID, bold: true })]
  }),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║               SECTION 1: EXECUTIVE SUMMARY             ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("1. Executive Summary"),
  divider(),
  space(80),
  body(
    "CloudPeak Technologies is pleased to submit this Technical Proposal in response to RFP reference DESC-MRD-2026-CNC-088, issued by the DESC Digital Innovation Center, Mardan. This proposal presents a complete, production-tested Cloud-Native architecture for the Mardan Smart City Citizen Complaint Portal — a high-traffic public service application built to replace the legacy monolithic infrastructure with a containerized, auto-scaling, and continuously delivered system.",
    { justify: true }
  ),
  space(80),
  body(
    "We have designed and fully implemented this solution from the ground up, covering containerization with Docker, container orchestration on K3s Kubernetes, a GitOps-based CI/CD pipeline using GitHub Actions and ArgoCD, automated cloud provisioning via Terraform, and a complete observability stack with Prometheus and Grafana. The system has been load-tested at 5,000 concurrent virtual users with a 100% success rate and an average response time of 239 milliseconds.",
    { justify: true }
  ),
  space(80),
  body(
    "Our architecture is designed around three core principles: reliability through self-healing pods and zero-downtime rolling updates, security through layered Kubernetes policies and hardened application code, and cost-efficiency through right-sized resource allocation that scales horizontally only when actually needed. The proposed system is capable of sustaining 99.99% uptime as required by the RFP and is fully ready for live demonstration before the evaluation board.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║           SECTION 2: UNDERSTANDING OF REQUIREMENTS     ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("2. Understanding of the Requirement"),
  divider(),
  space(80),
  body(
    "DESC Digital Innovation Center currently operates a citizen complaint portal that was built as a monolithic application. As the city's digital adoption has grown, this architecture has shown clear limitations — primarily the inability to handle load spikes without downtime, slow deployment cycles, and no clear separation between services. The RFP asks for a consulting firm that can modernize this infrastructure completely.",
    { justify: true }
  ),
  space(80),
  body("We understand the core objectives to be:", { justify: true }),
  space(40),
  bullet("Decompose the monolithic portal into isolated, independently deployable microservices using Docker containers, allowing each layer (frontend, backend, database, cache) to be updated and scaled without touching the others."),
  bullet("Deploy these containers on a Kubernetes cluster that automatically restarts failed pods, balances load across healthy instances, and scales the application up or down based on real-time CPU demand — without manual intervention."),
  bullet("Establish an automated CI/CD pipeline so that when a developer pushes code, the entire process from build to production deployment happens automatically and safely, without any service interruption (zero-downtime deployment)."),
  bullet("Codify the entire cloud infrastructure in Terraform so that provisioning a new environment takes minutes rather than days, and the infrastructure can be reproduced or recovered exactly."),
  bullet("Implement a monitoring and alerting stack that gives the DESC operations team full visibility into cluster health, application performance, and any anomalies — in real time."),
  space(80),
  body(
    "We have not merely designed this on paper. Every component described in this proposal has been built, deployed, and tested on a running K3s cluster. The GitHub repository shoaibikhandev/mardan-smart contains the complete source code, Kubernetes manifests, Terraform configurations, and CI/CD workflows submitted as part of this proposal.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║           SECTION 3: PROPOSED ARCHITECTURE             ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("3. Proposed Architecture"),
  divider(),
  space(80),
  h2("3.1 Architecture Overview"),
  body(
    "The Mardan Smart City Portal follows a microservices architecture where every component runs as an independent containerized service inside a Kubernetes namespace called mardan-smart-city. The architecture separates concerns cleanly: the frontend (React/Nginx) handles all user interaction, the backend (Node.js/Express) processes all business logic and API requests, PostgreSQL persists citizen data, and Redis handles token validation and API rate limiting at high speed.",
    { justify: true }
  ),
  space(120),
  // Architecture overview table
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 2200, 2600, 2560],
    rows: [
      new TableRow({
        children: ["Layer", "Component", "Technology", "Kubernetes Kind"].map((txt, i) =>
          new TableCell({
            width: { size: [2000,2200,2600,2560][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["Presentation", "React 19 + Vite 6", "Nginx Reverse Proxy", "Deployment (2 replicas)"],
        ["Application", "Node.js + Express 4", "REST API + Prometheus", "Deployment (4 replicas)"],
        ["Persistence", "PostgreSQL 15", "Sequelize ORM", "StatefulSet + PVC"],
        ["Caching / Queue", "Redis 7", "Rate-limit & token cache", "Deployment + PVC"],
        ["Monitoring", "Prometheus + Grafana", "Metrics & Dashboards", "Deployment"],
        ["GitOps CD", "ArgoCD", "Pull-based sync", "Cluster-wide"],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2000,2200,2600,2560][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h2("3.2 Technology Stack Justification"),
  body(
    "Technology choices were not made by convention. Each tool was evaluated against the specific constraints of this project — a citizen-facing public portal requiring high availability, low operational cost, and ease of handover to DESC operations staff.",
    { justify: true }
  ),
  space(80),
  // Stack justification table
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 3160, 4000],
    rows: [
      new TableRow({
        children: ["Tool", "Alternative Considered", "Reason for Selection"].map((txt, i) =>
          new TableCell({
            width: { size: [2200,3160,4000][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["K3s Kubernetes", "Full K8s / Docker Swarm", "Lightweight, same API as K8s, ideal for demo + local cluster. Production path to AWS EKS is seamless."],
        ["ArgoCD (GitOps)", "Jenkins / manual kubectl", "Pull-based model means the cluster stays in sync with git. No outbound CI access needed to the cluster."],
        ["GitHub Actions", "GitLab CI / CircleCI", "Free for public repos, tight Docker Hub integration, runs on every push automatically."],
        ["Prometheus + Grafana", "Datadog / New Relic", "Open-source, runs inside the cluster at zero licence cost, battle-tested for Kubernetes metrics."],
        ["Terraform (AWS)", "Pulumi / Ansible", "Declarative IaC with the largest provider ecosystem. AWS EKS in Mumbai region chosen for low latency to Pakistan."],
        ["Node.js + Express", "Django / FastAPI", "Non-blocking I/O handles concurrent citizen requests efficiently. Team expertise is already in JS."],
        ["PostgreSQL 15", "MySQL / MongoDB", "ACID compliance required for complaint tracking data. Full relational integrity for status transitions."],
        ["Redis 7", "Memcached", "Supports Lua scripting needed for atomic rate-limit counters and pub/sub for future notifications."],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2200,3160,4000][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h2("3.3 Request Data Flow"),
  body(
    "Understanding how a citizen request travels through the system from browser to database and back is essential to evaluating the architecture's correctness. The flow below describes a typical complaint submission:",
    { justify: true }
  ),
  space(80),
  bullet("A citizen opens the portal at the public URL. The request hits the K3s Ingress Controller, which terminates TLS and routes traffic to the React frontend service."),
  bullet("The frontend SPA loads in the browser. When the citizen submits a complaint, the browser sends a POST request to /api/v1/complaints on the backend service (NodePort 31724 for demo; Ingress path /api for production)."),
  bullet("The Express middleware chain runs in order: request-id injection, rate limit check (Redis-backed, 5 requests per 15 minutes per IP), JWT authentication verification from the HttpOnly cookie (msc_token), Helmet security headers applied, then the complaint controller."),
  bullet("The complaint controller writes the record to PostgreSQL 15 via Sequelize ORM. A unique MSC-XXXXXX tracking ID is generated. Redis is updated with the new complaint count for that citizen's session."),
  bullet("Prometheus scrapes the /api/metrics endpoint every 15 seconds, collecting custom metrics such as msc_http_requests_total and msc_active_connections. Grafana dashboards reflect this data in near real time."),
  space(120),
  h2("3.4 Stateful Data Strategy"),
  body(
    "Stateful workloads — PostgreSQL and Redis — require special handling in Kubernetes because their data must survive pod restarts and rescheduling. Our approach uses PersistentVolumeClaims (PVCs) backed by the K3s local-path provisioner for local demo and AWS EBS gp3 volumes for cloud production.",
    { justify: true }
  ),
  space(80),
  bullet("PostgreSQL data is stored on a dedicated data-pvc (10Gi). A separate postgres-backup-pvc (5Gi) is used exclusively for daily pg_dump backups triggered by a CronJob at 02:00 AM. This separation ensures that backup I/O never competes with live database writes."),
  bullet("Redis uses its own redis-pvc (1Gi) for AOF persistence so cached data survives restarts without impacting PostgreSQL storage."),
  bullet("File uploads from citizens (complaint attachments) are stored on an uploads-pvc (5Gi) mounted at /usr/src/app/uploads inside the backend container. This volume is separate from application code, allowing zero-downtime updates without losing uploaded files."),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║       SECTION 4: CONTAINERIZATION & ORCHESTRATION      ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("4. Containerization & Orchestration Strategy"),
  divider(),
  space(80),
  h2("4.1 Docker Containerization"),
  body(
    "Both the backend and frontend services are packaged using multi-stage Docker builds. The backend Dockerfile uses a node:18-alpine builder stage to install production dependencies and then copies only the necessary application files into a minimal runtime image. This approach keeps the final image size small, removes development tools from production, and reduces the attack surface significantly compared to a single-stage build.",
    { justify: true }
  ),
  space(80),
  body(
    "The frontend uses a two-stage build: the first stage runs npm run build inside a node:18-alpine container to produce the static Vite bundle, and the second stage copies those static files into an Nginx:alpine image. The resulting frontend container is approximately 30MB — far smaller than shipping Node.js with the React dev toolchain. React.lazy() code splitting is applied so the initial bundle downloaded by citizens is minimal.",
    { justify: true }
  ),
  space(80),
  h2("4.2 Kubernetes Cluster Structure"),
  body(
    "All workloads run in the mardan-smart-city namespace, providing logical isolation from other cluster tenants. The namespace is governed by a ResourceQuota that caps total CPU and memory consumption, preventing any runaway pod from consuming cluster-wide resources.",
    { justify: true }
  ),
  space(100),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 2000, 2000, 2560],
    rows: [
      new TableRow({
        children: ["Service", "Base Replicas", "CPU Request/Limit", "Memory Request/Limit"].map((txt, i) =>
          new TableCell({
            width: { size: [2800,2000,2000,2560][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["Backend (Node.js)", "4 pods", "100m / 500m", "256Mi / 512Mi"],
        ["Frontend (Nginx)", "2 pods", "50m / 200m", "64Mi / 128Mi"],
        ["PostgreSQL 15", "1 pod (StatefulSet)", "250m / 1000m", "512Mi / 1Gi"],
        ["Redis 7", "1 pod", "50m / 200m", "64Mi / 256Mi"],
        ["Prometheus", "1 pod", "100m / 500m", "256Mi / 512Mi"],
        ["Grafana", "1 pod", "100m / 300m", "128Mi / 256Mi"],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2800,2000,2000,2560][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h2("4.3 Auto-Scaling (HPA)"),
  body(
    "The backend Deployment is governed by a HorizontalPodAutoscaler configured with the following parameters: minimum 4 replicas to always maintain redundancy, maximum 15 replicas to cap cloud cost, and a scale-out trigger at 70% average CPU utilization. This means that during a load spike — for example, when a city event generates hundreds of simultaneous complaint submissions — Kubernetes automatically provisions additional backend pods within seconds, without any operator involvement.",
    { justify: true }
  ),
  space(80),
  body(
    "The frontend is similarly autoscaled between 2 and 8 replicas. Static file serving through Nginx is extremely CPU-efficient, so frontend scaling is rarely triggered, but the configuration ensures graceful handling of traffic bursts to the React SPA.",
    { justify: true }
  ),
  space(80),
  h2("4.4 Zero-Downtime Rolling Updates"),
  body(
    "Every Deployment uses a RollingUpdate strategy with maxUnavailable: 0 and maxSurge: 1. This guarantees that when a new version is deployed, Kubernetes first starts one new pod, waits for its readiness probe to pass (checking /api/health/ready every 10 seconds), and only then terminates one old pod. Citizens experience zero interruption during deployments. A startupProbe with a 30-attempt grace period handles slow cold starts, preventing premature liveness failures on newly scheduled pods.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║           SECTION 5: CI/CD PIPELINE DESIGN             ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("5. CI/CD Pipeline Design"),
  divider(),
  space(80),
  h2("5.1 Overall Pipeline Philosophy"),
  body(
    "The pipeline follows a push-pull separation: GitHub Actions (the CI side) builds and tests code and pushes Docker images, while ArgoCD (the CD side) independently detects configuration changes in git and pulls the new version into the cluster. These two systems never directly communicate with each other. This separation means the cluster does not need to expose any access to GitHub, and a CI failure never results in a partial deployment.",
    { justify: true }
  ),
  space(80),
  h2("5.2 Step-by-Step Pipeline Flow"),
  body("The complete deployment cycle from a developer code commit to live production update:", { justify: true }),
  space(80),
  // Pipeline steps
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [900, 2500, 5960],
    rows: [
      new TableRow({
        children: ["Step", "Stage", "What Happens"].map((txt, i) =>
          new TableCell({
            width: { size: [900,2500,5960][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["1", "Code Push", "Developer pushes code to the main branch of shoaibikhandev/mardan-smart on GitHub."],
        ["2", "CI Trigger", "GitHub Actions workflow deploy.yml fires automatically. The build-test.yml workflow runs linting and unit checks in parallel."],
        ["3", "Docker Build", "Actions builds Docker images for both backend and frontend using multi-stage Dockerfiles. Images are tagged with both :latest and the exact git commit SHA."],
        ["4", "Registry Push", "Both images are pushed to Docker Hub under the shoaibikhandev account. The commit SHA tag provides an immutable, traceable reference."],
        ["5", "YAML Update", "The Actions workflow uses sed to update the image tag in k3s/deployments/backend-deployment.yaml and frontend-deployment.yaml with the new commit SHA. These changes are committed back to the main branch."],
        ["6", "ArgoCD Detection", "ArgoCD is continuously polling the main branch. It detects the YAML change within 3 minutes and calculates the diff between the desired state (git) and actual state (cluster)."],
        ["7", "K3s Deployment", "ArgoCD applies the updated manifests to the mardan-smart-city namespace. Kubernetes performs a rolling update, bringing up new pods with the new image before removing old ones."],
        ["8", "Health Verification", "Readiness probes on the new pods must pass before traffic is shifted. ArgoCD marks the sync as Healthy only after all pods report Ready."],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [900,2500,5960][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h2("5.3 GitOps Source of Truth"),
  body(
    "A critical architectural decision is that git is the single source of truth for cluster state. Any direct kubectl apply that is not reflected in git will be overwritten by ArgoCD on the next sync cycle. This design prevents configuration drift — the state of the cluster three months from now will exactly match what is committed in the repository, regardless of any manual emergency changes made during incidents.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║             SECTION 6: SECURITY STRATEGY               ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("6. Security Strategy"),
  divider(),
  space(80),
  body(
    "Security has been implemented in layers, following the defense-in-depth principle. A single misconfiguration at one layer does not expose the entire system because multiple independent controls must fail simultaneously for a breach to occur. Below we describe each security layer from the network perimeter down to the application code.",
    { justify: true }
  ),
  space(80),
  h2("6.1 Kubernetes Network Policies"),
  body(
    "The default network posture is deny-all. A NetworkPolicy named default-deny selects all pods in the namespace and blocks all ingress and egress traffic by default. Additional NetworkPolicy objects then explicitly allow only the traffic flows that are required: the frontend can reach the backend, the backend can reach PostgreSQL and Redis, and the monitoring stack can reach all /metrics endpoints. No pod can initiate arbitrary outbound internet connections.",
    { justify: true }
  ),
  space(80),
  h2("6.2 Role-Based Access Control (RBAC)"),
  body(
    "Each service runs under a dedicated Kubernetes ServiceAccount. The backend-sa account is bound to a Role that grants get permission on exactly one ConfigMap: backend-config. This is the minimum necessary privilege for the backend to read its configuration. There are no ClusterRole bindings for application workloads — they cannot access resources outside their own namespace.",
    { justify: true }
  ),
  space(80),
  h2("6.3 Secrets Management"),
  body(
    "Database credentials, JWT signing keys, Redis passwords, and SMTP credentials are stored in Kubernetes Secrets. These are base64-encoded and referenced in Deployments via secretRef, meaning the sensitive values never appear in YAML files committed to git and are never exposed in application environment variable listings. Grafana admin credentials are similarly managed through a dedicated grafana-secret.",
    { justify: true }
  ),
  space(80),
  h2("6.4 Application-Level Security"),
  body("The backend implements the following application-level controls:", { justify: true }),
  space(60),
  bullet("Helmet.js enforces strict HTTP security headers on every response, including Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options. The CSP directive restricts script execution to self-origin only, blocking XSS injection attacks."),
  bullet("JWT authentication tokens are issued as HttpOnly cookies using the cookie name msc_token. HttpOnly cookies cannot be read by JavaScript running on the page, which eliminates the most common JWT theft vector (XSS-based token extraction from localStorage)."),
  bullet("Rate limiting is enforced at 5 requests per 15-minute window per IP address, using a Redis-backed store (rate-limit-redis). This prevents brute-force login attacks and API abuse while surviving pod restarts since the counters persist in Redis rather than in-process memory."),
  bullet("All API routes are versioned under /api/v1/, giving the security team a clear boundary to apply WAF rules if a cloud-based WAF is added in the managed service phase."),
  space(80),
  h2("6.5 Container Image Scanning (Trivy)"),
  body(
    "All Docker images are scanned using Aqua Security's Trivy before being pushed to Docker Hub. Trivy checks the image filesystem and installed packages against the CVE database and flags any HIGH or CRITICAL vulnerabilities. The CI pipeline is configured to fail the build if critical vulnerabilities are detected, ensuring that known-vulnerable images never reach the cluster.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║         SECTION 7: OBSERVABILITY & MONITORING          ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("7. Observability & Monitoring"),
  divider(),
  space(80),
  body(
    "The observability stack follows the Prometheus-Grafana pattern, which is the de-facto standard for Kubernetes environments. Both components run as Deployments inside the mardan-smart-city namespace, meaning they benefit from the same self-healing and resource governance as the application itself.",
    { justify: true }
  ),
  space(80),
  h2("7.1 Prometheus Metrics Collection"),
  body(
    "The backend application initializes prom-client using collectDefaultMetrics({ prefix: 'msc_' }) at startup. This automatically exposes a comprehensive set of Node.js runtime metrics prefixed with msc_ — including event loop lag, garbage collection duration, active handles, and heap statistics — on the /api/metrics endpoint. Prometheus is configured to scrape this endpoint every 15 seconds.",
    { justify: true }
  ),
  space(80),
  body("The following metrics categories are tracked:", { justify: true }),
  space(60),
  bullet("HTTP request rate (requests per second, broken down by route and status code)"),
  bullet("Response latency percentiles (p50, p95, p99 — critical for SLA compliance)"),
  bullet("Active database connection pool utilization"),
  bullet("Redis hit/miss ratio and command latency"),
  bullet("Kubernetes node CPU and memory utilization (via kube-state-metrics)"),
  bullet("Pod restart count (a leading indicator of instability)"),
  space(80),
  h2("7.2 Grafana Dashboards"),
  body(
    "Grafana is deployed with a provisioned data source pointing to the in-cluster Prometheus instance. Pre-built dashboards cover the Kubernetes cluster overview, the Node.js application performance, and a citizen-facing portal health panel showing uptime, error rate, and current active users. The Grafana admin credentials are managed through a Kubernetes Secret and are never stored in plaintext in the repository.",
    { justify: true }
  ),
  space(80),
  h2("7.3 Alerting Strategy"),
  body(
    "During the managed service phase, PrometheusRule objects will be configured for the following alert conditions: backend pod crash (immediate alert), average response time exceeding 500ms for 5 consecutive minutes (warning), PostgreSQL connection pool exhaustion above 80% (warning), and any pod entering a CrashLoopBackOff state. Alerts are routed through Alertmanager to the DESC operations team via email (SMTP egress is permitted by the backend NetworkPolicy).",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║          SECTION 8: INFRASTRUCTURE AS CODE             ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("8. Infrastructure as Code (Terraform)"),
  divider(),
  space(80),
  body(
    "The terraform/ directory contains a complete infrastructure definition for the AWS cloud production environment. Running terraform apply from a properly credentialed machine will provision the entire cloud infrastructure from scratch in under 10 minutes, with no manual steps required. This is essential for disaster recovery — if the production environment is lost, it can be recreated identically.",
    { justify: true }
  ),
  space(80),
  h2("8.1 Resources Provisioned"),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 2800, 3760],
    rows: [
      new TableRow({
        children: ["Resource", "Specification", "Purpose"].map((txt, i) =>
          new TableCell({
            width: { size: [2800,2800,3760][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["AWS VPC", "10.0.0.0/16, 2 public subnets", "Isolated network for all cluster resources"],
        ["Security Groups", "HTTP/HTTPS + K3s internal + SSH", "Firewall rules — inbound limited to known ports only"],
        ["EC2 Instances x3", "t3.large, Ubuntu 22.04 LTS, 50GB gp3", "K3s cluster — 1 server node + 2 agent nodes"],
        ["SSH Key Pair", "mardan-k3s-key", "Secure administrative access to nodes"],
        ["User Data Script", "Auto-install K3s on boot", "Zero-touch K3s installation on instance startup"],
        ["AWS Region", "ap-south-1 (Mumbai)", "Lowest latency from Pakistan; 30-60ms round trip"],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2800,2800,3760][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h2("8.2 Repeatability and Compliance"),
  body(
    "Because all infrastructure is defined in code, every environment change goes through a git pull request and review process. terraform plan produces a human-readable diff before any change is applied, giving the DESC team the ability to review infrastructure modifications with the same rigour as application code changes. There is no undocumented manual configuration anywhere in the stack.",
    { justify: true }
  ),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║      SECTION 9: DISASTER RECOVERY & HIGH AVAILABILITY  ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("9. Disaster Recovery & High Availability"),
  divider(),
  space(80),
  body(
    "Achieving 99.99% uptime requires more than just running multiple replicas. It requires that the system can survive pod failures, node failures, and operator mistakes without losing data or serving errors to citizens. The following mechanisms work together to provide this guarantee.",
    { justify: true }
  ),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({
        children: ["Mechanism", "How It Protects the System"].map((txt, i) =>
          new TableCell({
            width: { size: [2800,6560][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["Self-Healing Pods", "Kubernetes automatically restarts any pod that fails its liveness probe (checked every 20 seconds). Failed pods are rescheduled on healthy nodes. Citizens experience brief momentary latency at most — not a visible outage."],
        ["PodDisruptionBudgets", "backend-pdb and frontend-pdb enforce that at least 3 backend pods and 1 frontend pod must always be available, even during node maintenance or voluntary evictions. Kubernetes will refuse to drain a node if doing so would violate these budgets."],
        ["Daily PostgreSQL Backup", "A CronJob named postgres-backup runs pg_dump at 02:00 AM every day. The compressed backup is written to a dedicated 5Gi PVC (postgres-backup-pvc). In the event of data corruption or accidental deletion, recovery involves restoring from the previous night's dump — maximum data loss is less than 24 hours."],
        ["Persistent Volume Claims", "PostgreSQL, Redis, and uploads each have dedicated PVCs. Pod deletions and redeployments do not delete these volumes. Data persists independently of the pod lifecycle."],
        ["ArgoCD Self-Sync", "If an operator accidentally applies a wrong configuration directly via kubectl, ArgoCD will detect the drift and re-apply the correct state from git within 3 minutes. Human error has a self-correcting mechanism."],
        ["Multi-Replica Baseline", "The HPA never scales below 4 backend replicas and 2 frontend replicas. Even at zero load, the system is running with redundancy. A single pod failure never takes the portal offline."],
        ["Terraform State", "All AWS infrastructure is described in Terraform. If the cloud environment is destroyed, terraform apply recreates it identically. Infrastructure recovery time is under 15 minutes."],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2800,6560][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║          SECTION 10: IMPLEMENTATION TIMELINE           ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("10. Implementation & Managed Service Timeline"),
  divider(),
  space(80),
  body(
    "The project has two distinct phases. Phase 1 covers the initial deployment and validation, which is already substantially complete. Phase 2 covers the 12-month managed service engagement as specified in the RFP scope.",
    { justify: true }
  ),
  space(100),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 1600, 5560],
    rows: [
      new TableRow({
        children: ["Phase", "Duration", "Deliverables & Activities"].map((txt, i) =>
          new TableCell({
            width: { size: [2200,1600,5560][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      tRowTimeline("Phase 1A — Infrastructure Setup", "Week 1", "K3s cluster provisioned, namespaces and RBAC configured, Terraform state initialized, Docker images pushed to registry."),
      tRowTimeline("Phase 1B — Application Deployment", "Week 2", "All Kubernetes manifests applied, ArgoCD sync established, GitHub Actions pipeline tested end-to-end, application live at cluster IP.", true),
      tRowTimeline("Phase 1C — Monitoring & Security", "Week 3", "Prometheus + Grafana deployed, dashboards configured, Trivy scans clean, NetworkPolicies validated, load test at 5,000 VUs passed."),
      tRowTimeline("Phase 1D — Handover & Demo", "Week 4", "Live demonstration to DESC evaluation board, technical documentation delivered, DESC operations staff walkthrough completed.", true),
      tRowTimeline("Phase 2 — Managed Service (M1–M3)", "Months 1–3", "24/7 cluster monitoring, weekly health reports, patch management for base images and K8s components, backup verification."),
      tRowTimeline("Phase 2 — Managed Service (M4–M6)", "Months 4–6", "Performance review, HPA tuning based on real traffic patterns, introduction of additional Grafana alert rules, capacity planning report.", true),
      tRowTimeline("Phase 2 — Managed Service (M7–M9)", "Months 7–9", "Mid-contract security audit, Trivy re-scan of all images, network policy review, optional introduction of service mesh (Istio/Linkerd)."),
      tRowTimeline("Phase 2 — Managed Service (M10–M12)", "Months 10–12", "Annual performance review, end-of-contract knowledge transfer to DESC in-house team, final documentation package delivered.", true),
    ]
  }),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║           SECTION 11: TEAM QUALIFICATIONS              ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("11. Team Qualifications"),
  divider(),
  space(80),
  h2("Lead Architect — Muhammad Shoaib Khan"),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      ...[
        ["Academic Background", "BS Artificial Intelligence — Faculty of Information Technology, The University of Agriculture, Peshawar. Current 2nd semester with focus on machine learning fundamentals and systems architecture."],
        ["Cloud Computing Program", "Currently enrolled in the KP Government-backed Cloud Computing Program at DESC Digital Innovation Center, Mardan (Weekend Program — Katlang Campus). This program specifically covers cloud-native development, container orchestration, and DevOps practices directly relevant to this RFP."],
        ["Agentic AI Program", "Enrolled in the Aylani Smith Agentic AI Course, covering LLM integration, automation workflows, and AI agent frameworks — relevant to future DESC portal enhancements."],
        ["DevOps Training Path", "Completed a structured DevOps learning path covering VMware virtualization, Ubuntu/Linux administration, Docker containerization, and Kubernetes orchestration, culminating in the implementation of this project."],
        ["Delivered Projects", "Gemini AI Clone (3-tier containerized Flask/Nginx/MongoDB app with Docker Compose), Full-stack Todo App (Nginx + Node.js + PostgreSQL with Compose Watch), and the Mardan Smart City Portal (the subject of this proposal)."],
        ["Infrastructure", "Dell Precision 7720 workstation running a local K3s cluster for development and testing — ensuring this proposal is based on real, hands-on deployment experience, not theoretical architecture."],
        ["GitHub", "shoaibikhandev/mardan-smart — all source code, Kubernetes manifests, CI/CD workflows, and Terraform configurations are version-controlled and available for technical review."],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [2400,6960][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK, bold: i === 0 })] })]
            })
          )
        })
      )
    ]
  }),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║              SECTION 12: CONCLUSION                    ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("12. Conclusion"),
  divider(),
  space(80),
  body(
    "This proposal presents a complete, production-grade Cloud-Native solution for the Mardan Smart City Citizen Complaint Portal. Every claim in this document is backed by working code committed to a public GitHub repository and deployed on a running Kubernetes cluster. The architecture satisfies all five technical requirements specified in RFP DESC-MRD-2026-CNC-088: Docker containerization, Kubernetes orchestration, CI/CD automation, Infrastructure as Code, and Prometheus/Grafana observability.",
    { justify: true }
  ),
  space(80),
  body(
    "What differentiates this proposal from a purely theoretical submission is the load test data. At 5,000 concurrent virtual users, the system maintained 100% request success with an average response time of 239 milliseconds and a throughput of 1,817 requests per second. This was measured on local hardware — cloud deployment on AWS EC2 t3.large instances with proper network bandwidth will perform significantly better.",
    { justify: true }
  ),
  space(80),
  body(
    "We are fully prepared to demonstrate a live spin-up of the multi-tier application before the evaluation board on the scheduled demonstration date, including live auto-scaling behaviour, GitOps deployment cycle, and real-time Grafana dashboard updates. We thank DESC Digital Innovation Center for this opportunity and look forward to supporting the modernization of citizen services in Mardan.",
    { justify: true }
  ),
  space(160),
  divider(),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noAllBorders,
          width: { size: 4680, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 0, right: 120 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "Submitted by:", size: 20, font: "Arial", bold: true, color: TEXT_DARK })] }),
            space(40),
            new Paragraph({ children: [new TextRun({ text: "Muhammad Shoaib Khan", size: 22, font: "Arial", color: TEXT_DARK, bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Lead Cloud Architect", size: 20, font: "Arial", color: BLUE_MID })] }),
            new Paragraph({ children: [new TextRun({ text: "CloudPeak Technologies, Peshawar, KPK", size: 20, font: "Arial", color: TEXT_DARK })] }),
          ]
        }),
        new TableCell({
          borders: noAllBorders,
          width: { size: 4680, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 0 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "Submitted to:", size: 20, font: "Arial", bold: true, color: TEXT_DARK })] }),
            space(40),
            new Paragraph({ children: [new TextRun({ text: "DESC Digital Innovation Center", size: 22, font: "Arial", color: TEXT_DARK, bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Mardan, Khyber Pakhtunkhwa", size: 20, font: "Arial", color: BLUE_MID })] }),
            new Paragraph({ children: [new TextRun({ text: "Tender Reference: DESC-MRD-2026-CNC-088", size: 20, font: "Arial", color: TEXT_DARK })] }),
          ]
        })
      ]
    })]
  }),
  pageBreak()
);

// ╔══════════════════════════════════════════════════════════╗
// ║                    APPENDIX A                          ║
// ╚══════════════════════════════════════════════════════════╝
children.push(
  h1("Appendix A: Project File Structure"),
  divider(),
  space(80),
  body("The complete project repository (shoaibikhandev/mardan-smart) is organized as follows:"),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows: [
      new TableRow({
        children: ["Directory / File", "Contents"].map((txt, i) =>
          new TableCell({
            width: { size: [3200,6160][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["backend/", "Node.js + Express API. Controllers (auth, complaint, user, notification), Sequelize models, middleware (auth, rate limit, upload, request-id), routes, server.js."],
        ["backend/Dockerfile", "Multi-stage Docker build — alpine base, production deps only, non-root user (UID 1001)."],
        ["frontend/", "React 19 + Vite 6 SPA. Tailwind CSS styling, Lucide icons, React.lazy code splitting, Nginx reverse proxy config."],
        ["frontend/Dockerfile", "Two-stage build — Vite build in Node, static files served by Nginx:alpine."],
        ["database/", "schema.sql (PostgreSQL DDL for users, complaints, notifications), seeds (admin user insert)."],
        ["k3s/", "All Kubernetes manifests organized by function."],
        ["k3s/deployments/", "backend-deployment.yaml (4 replicas, probes, resource limits), frontend-deployment.yaml, postgres-deployment.yaml, redis-deployment.yaml."],
        ["k3s/services/", "ClusterIP services for internal communication, NodePort (31724) for backend external access during demo."],
        ["k3s/autoscaling/", "backend-hpa.yaml (min:4, max:15, CPU:70%), frontend-hpa.yaml."],
        ["k3s/security/", "service-accounts.yaml, roles.yaml (backend-role — configmaps/get on backend-config only), role-bindings.yaml."],
        ["k3s/policies/", "default-deny.yaml (block all), backend-access.yaml, db-access.yaml, monitoring-access.yaml."],
        ["k3s/reliability/", "backend-pdb.yaml, frontend-pdb.yaml, postgres-backup-cronjob.yaml (daily at 02:00)."],
        ["k3s/observability/", "prometheus-deployment.yaml, grafana-deployment.yaml."],
        ["k3s/gitops/", "argocd-app.yaml (syncs from main branch), argocd-project.yaml."],
        ["terraform/", "main.tf (VPC, SG, EC2 x3, K3s user-data), variables.tf, outputs.tf."],
        [".github/workflows/", "build-test.yml (lint + test on PRs), deploy.yml (build, push, update YAML, commit on main push)."],
        ["docker-compose.yml", "Local development orchestration for all 4 services with health-check dependency chaining."],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [3200,6160][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : GREY_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  }),
  space(120),
  h1("Appendix B: Load Test Results Summary"),
  divider(),
  space(80),
  body("Load testing was conducted using k6, targeting the backend NodePort endpoint (192.168.100.188:31724) from inside the K3s cluster network. The test simulated 5,000 concurrent virtual users ramping up over 30 seconds."),
  space(80),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 5760],
    rows: [
      new TableRow({
        children: ["Metric", "Result"].map((txt, i) =>
          new TableCell({
            width: { size: [3600,5760][i], type: WidthType.DXA },
            borders: allBorders("CCCCCC"),
            shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: WHITE, bold: true })] })]
          })
        )
      }),
      ...[
        ["Virtual Users (Peak)", "5,000 concurrent"],
        ["HTTP Success Rate", "100% (0 failed requests)"],
        ["Average Response Time", "239 ms"],
        ["Peak Throughput", "1,817 requests / second"],
        ["Rate Limiter Behaviour", "VUs sharing 10.42.0.1 (cluster NAT IP) correctly received 429 Too Many Requests after threshold — confirms the Redis-backed rate limiter is working as designed."],
        ["Test Endpoint", "POST /api/v1/auth/login, GET /api/v1/complaints"],
        ["Hardware", "Dell Precision 7720 (K3s local cluster, mardan-smart-city namespace)"],
      ].map((row, idx) =>
        new TableRow({
          children: row.map((txt, i) =>
            new TableCell({
              width: { size: [3600,5760][i], type: WidthType.DXA },
              borders: allBorders("CCCCCC"),
              shading: { fill: idx % 2 === 0 ? WHITE : BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial", color: TEXT_DARK })] })]
            })
          )
        })
      )
    ]
  })
);

// ─── Build the Document ───────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } // 0.79" margins
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
            children: [
              new TextRun({ text: "TECHNICAL PROPOSAL  |  DESC-MRD-2026-CNC-088  |  CloudPeak Technologies", size: 16, font: "Arial", color: BLUE_MID }),
              new TextRun({ text: "\t", size: 16 }),
              new TextRun({ text: "CONFIDENTIAL", size: 16, font: "Arial", color: BLUE_MID, bold: true })
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
            children: [
              new TextRun({ text: "Mardan Smart City Citizen Complaint Portal  |  Envelope A — Technical Proposal", size: 16, font: "Arial", color: BLUE_MID }),
              new TextRun({ text: "\tPage ", size: 16, font: "Arial", color: BLUE_MID }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: BLUE_MID }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          })
        ]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("./TechnicalProposal_EnvelopeA_DESC-MRD-2026-CNC-088.docx", buffer);
  console.log("Done! File saved.");
});
