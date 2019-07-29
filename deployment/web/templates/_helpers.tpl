{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "web.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "web.labels" -}}
app.kubernetes.io/name: {{ include "web.name" . }}
helm.sh/chart: {{ include "web.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "web.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create some names for the various endpoints
*/}}
{{- define "web.coreFullname" -}}
{{- $name := include "web.fullname" . -}}
{{- printf "core-%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- define "web.authFullname" -}}
{{- $name := include "web.fullname" . -}}
{{- printf "auth-%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- define "web.morpheusFullname" -}}
{{- $name := include "web.fullname" . -}}
{{- printf "morpheus-%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- define "web.proxyFullname" -}}
{{- $name := include "web.fullname" . -}}
{{- printf "proxy-%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
