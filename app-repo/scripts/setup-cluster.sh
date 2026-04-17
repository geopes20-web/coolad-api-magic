#!/bin/bash
set -euo pipefail

# ============================================
# Cluster Bootstrap Script - Helm Based
# ============================================
# Run after EKS cluster is created
# Usage: ./setup-cluster.sh

echo "🚀 Starting cluster setup..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# 1. Create Namespaces
# ============================================
echo -e "${GREEN}[1/7] Creating namespaces...${NC}"
kubectl create namespace coolad-app --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -

# ============================================
# 2. Add Helm Repos
# ============================================
echo -e "${GREEN}[2/7] Adding Helm repositories...${NC}"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# ============================================
# 3. Install NGINX Ingress Controller (Helm)
# ============================================
echo -e "${GREEN}[3/7] Installing NGINX Ingress Controller via Helm...${NC}"
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.replicaCount=1 \
  --set controller.resources.requests.cpu=100m \
  --set controller.resources.requests.memory=128Mi \
  --set controller.resources.limits.cpu=200m \
  --set controller.resources.limits.memory=256Mi \
  --set controller.service.type=LoadBalancer \
  --wait --timeout 120s

# ============================================
# 4. Install ArgoCD (Helm)
# ============================================
echo -e "${GREEN}[4/7] Installing ArgoCD via Helm...${NC}"
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --set server.service.type=LoadBalancer \
  --set server.resources.requests.cpu=100m \
  --set server.resources.requests.memory=128Mi \
  --set controller.resources.requests.cpu=100m \
  --set controller.resources.requests.memory=256Mi \
  --set repoServer.resources.requests.cpu=50m \
  --set repoServer.resources.requests.memory=128Mi \
  --set redis.resources.requests.cpu=50m \
  --set redis.resources.requests.memory=64Mi \
  --wait --timeout 300s

echo -e "${YELLOW}ArgoCD Admin Password:${NC}"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""

# ============================================
# 5. Install Prometheus + Grafana (Helm)
# ============================================
echo -e "${GREEN}[5/7] Installing Prometheus & Grafana via Helm...${NC}"
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.resources.requests.cpu=100m \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheus.prometheusSpec.resources.limits.cpu=500m \
  --set prometheus.prometheusSpec.resources.limits.memory=512Mi \
  --set prometheus.prometheusSpec.retention=3d \
  --set grafana.enabled=true \
  --set grafana.adminPassword=admin123 \
  --set grafana.service.type=LoadBalancer \
  --set grafana.resources.requests.cpu=50m \
  --set grafana.resources.requests.memory=128Mi \
  --set alertmanager.enabled=true \
  --set alertmanager.alertmanagerSpec.resources.requests.cpu=50m \
  --set alertmanager.alertmanagerSpec.resources.requests.memory=64Mi \
  --set nodeExporter.enabled=true \
  --set kubeStateMetrics.enabled=true \
  --wait --timeout 300s

echo -e "${YELLOW}Grafana default credentials: admin / admin123${NC}"

# ============================================
# 6. Deploy ArgoCD Application
# ============================================
echo -e "${GREEN}[6/7] Deploying ArgoCD Application...${NC}"
kubectl apply -f argocd/application.yaml

# ============================================
# 7. Verify Everything
# ============================================
echo -e "${GREEN}[7/7] Verifying deployments...${NC}"
echo ""
echo "=== Namespaces ==="
kubectl get namespaces

echo ""
echo "=== Pods (all namespaces) ==="
kubectl get pods -A

echo ""
echo "=== Services ==="
kubectl get svc -A

echo ""
echo "=== Helm Releases ==="
helm list -A

echo ""
echo -e "${GREEN}✅ Cluster setup complete!${NC}"
echo ""
echo "📋 Access Points:"
echo "  - ArgoCD:     kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  - Prometheus: kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090"
echo "  - Grafana:    kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80"
echo "  - App:        kubectl get svc -n coolad-app"
echo ""
echo "🔗 Or access via LoadBalancer URLs:"
kubectl get svc -A | grep LoadBalancer
