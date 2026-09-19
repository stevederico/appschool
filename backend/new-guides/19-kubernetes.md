# Kubernetes - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts (Cluster, Nodes, Pods)

**2. Workload Resources** - Deployments, ReplicaSets, StatefulSets, DaemonSets

**3. Configuration** - ConfigMaps, Secrets, Environment Variables

**4. Storage** - Volumes, PersistentVolumeClaims

**5. Scaling** - HorizontalPodAutoscaler, Manual Scaling

**6. Operations** - Namespaces, kubectl Commands, Health Checks

**7. Interview Prep** - Complete Example, Questions, Practice Project

---

## What It Is

Kubernetes (K8s) is an open-source container orchestration platform that automates deploying, scaling, and managing containerized applications. Originally developed by Google based on their internal system Borg, it's now maintained by the Cloud Native Computing Foundation (CNCF).

Docker runs containers. Kubernetes manages fleets of containers across multiple machines—handling scheduling, scaling, networking, storage, and self-healing when things fail.

Without Kubernetes, you'd manually:
- Decide which server runs which container
- Handle container failures
- Scale up during traffic spikes
- Manage networking between containers
- Roll out updates without downtime

Kubernetes automates all of this.

---

## Core Concepts

### Cluster Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Control Plane                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │   │
│  │  │ API Server  │ │   etcd      │ │   Scheduler     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │            Controller Manager                   │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Worker Node  │  │   Worker Node  │  │   Worker Node  │ │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │ │
│  │  │  kubelet │  │  │  │  kubelet │  │  │  │  kubelet │  │ │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │ │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │ │
│  │  │kube-proxy│  │  │  │kube-proxy│  │  │  │kube-proxy│  │ │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │ │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │ │
│  │  │ Pods     │  │  │  │ Pods     │  │  │  │ Pods     │  │ │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Control Plane Components:**
- **API Server**: Frontend for the control plane, all communication goes through it
- **etcd**: Distributed key-value store for cluster data
- **Scheduler**: Assigns Pods to Nodes
- **Controller Manager**: Runs controllers (Deployment, ReplicaSet, etc.)

**Node Components:**
- **kubelet**: Agent that runs on each node, manages Pods
- **kube-proxy**: Maintains network rules for Pod communication
- **Container Runtime**: Runs containers (containerd, CRI-O)

---

## Workload Resources

### Pods

The smallest deployable unit—one or more containers that share storage and network.

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  containers:
  - name: app
    image: my-app:1.0.0
    ports:
    - containerPort: 3000
    env:
    - name: NODE_ENV
      value: "production"
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 3
```

**Note:** You rarely create Pods directly. Use Deployments instead.

### Deployments

Manages ReplicaSets and provides declarative updates for Pods.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.0.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

```bash
# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl rollout status deployment/my-app

# Scale
kubectl scale deployment/my-app --replicas=5

# Update image (triggers rolling update)
kubectl set image deployment/my-app app=my-app:2.0.0

# Rollback
kubectl rollout undo deployment/my-app
kubectl rollout history deployment/my-app
```

### Services

Expose Pods and provide stable networking.

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

**Service Types:**
- **ClusterIP** (default): Internal cluster IP only
- **NodePort**: Exposes on each Node's IP at a static port (30000-32767)
- **LoadBalancer**: Provisions external load balancer (cloud providers)
- **ExternalName**: Maps to external DNS name

```yaml
# LoadBalancer example
apiVersion: v1
kind: Service
metadata:
  name: my-app-lb
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
```

### Ingress

HTTP/HTTPS routing to Services.

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  tls:
  - hosts:
    - myapp.example.com
    secretName: tls-secret
```

---

## Configuration

### ConfigMaps

Store non-sensitive configuration.

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "postgres.default.svc.cluster.local"
  LOG_LEVEL: "info"
  config.json: |
    {
      "feature_flags": {
        "new_ui": true
      }
    }
```

```yaml
# Use in Pod
spec:
  containers:
  - name: app
    image: my-app:1.0.0
    envFrom:
    - configMapRef:
        name: app-config
    # Or individual keys
    env:
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DATABASE_HOST
    # As volume
    volumeMounts:
    - name: config-volume
      mountPath: /app/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

### Secrets

Store sensitive data (base64 encoded, not encrypted by default).

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:  # stringData for plain text (gets encoded)
  DATABASE_PASSWORD: "supersecret"
  API_KEY: "abc123"
```

```bash
# Create secret from command line
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_PASSWORD=supersecret \
  --from-file=tls.crt=path/to/cert
```

```yaml
# Use in Pod
spec:
  containers:
  - name: app
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: DATABASE_PASSWORD
```

---

## Storage

### Persistent Volumes

```yaml
# persistentvolumeclaim.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

```yaml
# Use in Pod
spec:
  containers:
  - name: app
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: data-pvc
```

**Access Modes:**
- **ReadWriteOnce (RWO)**: Single node read-write
- **ReadOnlyMany (ROX)**: Multiple nodes read-only
- **ReadWriteMany (RWX)**: Multiple nodes read-write

---

## Scaling

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
# Quick HPA creation
kubectl autoscale deployment my-app --min=2 --max=10 --cpu-percent=70
```

---

## Namespaces

Logical isolation within a cluster.

```bash
# Create namespace
kubectl create namespace production

# List namespaces
kubectl get namespaces

# Deploy to namespace
kubectl apply -f deployment.yaml -n production

# Set default namespace for context
kubectl config set-context --current --namespace=production
```

```yaml
# In YAML
metadata:
  name: my-app
  namespace: production
```

---

## kubectl Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Workloads
kubectl get pods
kubectl get pods -o wide                    # More details
kubectl get pods -w                         # Watch
kubectl get pods -l app=my-app              # Filter by label
kubectl get all                             # All resources

# Describe (detailed info)
kubectl describe pod my-app-xyz
kubectl describe deployment my-app

# Logs
kubectl logs my-app-xyz
kubectl logs -f my-app-xyz                  # Follow
kubectl logs my-app-xyz -c container-name   # Specific container
kubectl logs -l app=my-app --all-containers # All pods with label

# Execute commands
kubectl exec -it my-app-xyz -- /bin/sh
kubectl exec my-app-xyz -- cat /app/config.json

# Port forwarding
kubectl port-forward pod/my-app-xyz 8080:3000
kubectl port-forward service/my-app 8080:80

# Apply/Delete
kubectl apply -f manifest.yaml
kubectl delete -f manifest.yaml
kubectl delete pod my-app-xyz

# Debug
kubectl get events
kubectl top pods                            # Resource usage
kubectl top nodes
```

---

## Health Checks

```yaml
spec:
  containers:
  - name: app
    # Liveness: Is the container running?
    # Fails → container restart
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 3
    
    # Readiness: Is the container ready for traffic?
    # Fails → removed from Service endpoints
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 3
    
    # Startup: Is the container started?
    # For slow-starting containers
    startupProbe:
      httpGet:
        path: /health
        port: 3000
      failureThreshold: 30
      periodSeconds: 10
```

---

## Complete Example

```yaml
# Full application deployment
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
data:
  LOG_LEVEL: "info"

---
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secrets
stringData:
  DATABASE_URL: "postgres://user:pass@host:5432/db"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: my-app-config
        - secretRef:
            name: my-app-secrets
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 3

---
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Interview Questions

**Q: What is Kubernetes and why use it?**

A: Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerized applications. Use it when you need: automated scaling, self-healing (restart failed containers), rolling updates with zero downtime, service discovery, load balancing, and declarative configuration. It's essential for microservices at scale.

**Q: Explain the difference between Pods, Deployments, and Services.**

A: Pods are the smallest unit—one or more containers sharing network/storage. Deployments manage Pods via ReplicaSets, handle rolling updates, and maintain desired replica count. Services provide stable networking—a fixed IP/DNS that routes to matching Pods regardless of Pod IP changes. You deploy via Deployment, expose via Service.

**Q: How does a rolling update work?**

A: Deployment creates new ReplicaSet with new version. New Pods start while old ones still run. Once new Pods pass readiness checks, old Pods terminate. maxSurge controls how many extra Pods during update; maxUnavailable controls minimum available. If new Pods fail health checks, rollout pauses. Can rollback with `kubectl rollout undo`.

**Q: What's the difference between liveness and readiness probes?**

A: Liveness determines if container is running—failure triggers container restart. Readiness determines if container can accept traffic—failure removes Pod from Service endpoints but doesn't restart. Use liveness to catch deadlocks/hangs. Use readiness for dependencies (database connection) or during startup. Both prevent traffic to unhealthy containers.

**Q: How does Kubernetes networking work?**

A: Every Pod gets unique IP within cluster. Pods communicate directly via Pod IPs. Services provide stable virtual IP that load-balances to matching Pods. kube-proxy maintains network rules. Ingress handles external HTTP traffic routing. Within cluster: use Service DNS (service-name.namespace.svc.cluster.local).

**Q: Explain ConfigMaps vs Secrets.**

A: Both store configuration data separate from container images. ConfigMaps for non-sensitive data (feature flags, URLs). Secrets for sensitive data (passwords, API keys)—base64 encoded but not encrypted by default. Both can be mounted as files or exposed as environment variables. Secrets have size limits and access controls.

---

## Practice Project

Deploy a microservices application to Kubernetes:

**Requirements:**
1. Frontend deployment with Nginx
2. Backend API with multiple replicas
3. PostgreSQL StatefulSet
4. Redis for caching
5. ConfigMaps and Secrets
6. Ingress for routing
7. HPA for auto-scaling
8. Health checks and resource limits

---

## Resources

- https://kubernetes.io/docs/ (Official documentation)
- https://kubernetes.io/docs/tutorials/ (Interactive tutorials)
- https://learnk8s.io/ (Learning resources)
- https://github.com/kubernetes/examples (Example applications)
