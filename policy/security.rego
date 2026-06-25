package main

# Deny containers without CPU limits
deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	not container.resources.limits.cpu
	msg := sprintf("Container '%v' must have CPU limits", [container.name])
}

# Deny containers without memory limits
deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	not container.resources.limits.memory
	msg := sprintf("Container '%v' must have memory limits", [container.name])
}

# Deny ':latest' image tag
deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	endswith(container.image, ":latest")
	msg := sprintf("Container '%v' must not use ':latest' tag", [container.name])
}

# Deny allowPrivilegeEscalation: true
deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	container.securityContext.allowPrivilegeEscalation == true
	msg := sprintf("Container '%v' must not allow privilege escalation", [container.name])
}

# Require readOnlyRootFilesystem: true
deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	container.securityContext.readOnlyRootFilesystem != true
	msg := sprintf("Container '%v' must have readOnlyRootFilesystem: true", [container.name])
}

# Require runAsNonRoot: true at pod level
deny contains msg if {
	input.kind == "Deployment"
	input.spec.template.spec.securityContext.runAsNonRoot != true
	msg := "Pod spec must set securityContext.runAsNonRoot: true"
}

# Enforce allowed image registries
allowed_repos := [
	"shanisha/",
	"docker.io/shanisha/",
	"cr.l5d.io/",
	"quay.io/",
	"registry.k8s.io/",
	"ghcr.io/",
	"docker.io/prom/",
	"docker.io/grafana/",
	"docker.io/redis/",
	"docker.io/pgbouncer/",
	"docker.io/bitnami/",
	"ealen/",
]

deny contains msg if {
	input.kind == "Deployment"
	container := input.spec.template.spec.containers[_]
	not allowed_registry(container.image)
	msg := sprintf("Container '%v' uses image '%v' from a non-allowed registry", [container.name, container.image])
}

allowed_registry(image) if {
	some repo in allowed_repos
	startswith(image, repo)
}
