# 🚀 CD Pipeline - Application Deployment & Monitoring

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     EKS Cluster                               │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  coolad-app   │  │  ArgoCD      │  │  Monitoring Stack │   │
│  │  namespace    │  │  namespace   │  │  namespace        │   │
│  │              │  │              │  │                   │   │
│  │  Frontend    │  │  ArgoCD      │  │  Prometheus       │   │
│  │  (React)     │  │  Server      │  │  Grafana          │   │
│  │  Deployment  │  │  App CRD     │  │  Node Exporter    │   │
│  │  Service     │  │              │  │  kube-state-      │   │
│  │  Ingress     │  │              │  │  metrics          │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────┘

CI Pipeline (GitHub Actions):
  Code Push → Build Docker → Push to DockerHub → Update K8s Manifest → ArgoCD Syncs
```

## Structure

```
app-repo/
├── .github/workflows/
│   └── ci-cd.yml              # Build, Push, Deploy
├── docker/
│   └── frontend/
│       └── Dockerfile         # React App Dockerfile
├── k8s/
│   ├── base/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       └── dev/
│           ├── kustomization.yaml
│           └── patches/
├── argocd/
│   ├── application.yaml       # ArgoCD App CRD
│   └── install.yaml           # ArgoCD Installation
├── monitoring/
│   ├── namespace.yaml
│   ├── prometheus/
│   │   ├── config.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── clusterrole.yaml
│   ├── grafana/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── datasource.yaml
│   ├── node-exporter/
│   │   └── daemonset.yaml
│   └── kube-state-metrics/
│       └── deployment.yaml
└── scripts/
    └── setup-cluster.sh       # Cluster bootstrap script
```

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `KUBE_CONFIG` | Base64 encoded kubeconfig |
