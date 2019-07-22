# rancher local notes

## When using a RBAC kubernetes cluster, enable sudo mode for tiller:

```
kubectl create serviceaccount --namespace kube-system tiller
kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
```

## Creating a local PVC
```
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```

## Adding private docker registry

First log in to docker:
```
docker login docker.soapbubble.online:5000
```

Then apply the credentials to the kubernetes (note with rancher you can also add to the registry panel):
```
kubectl create secret generic regcred \
    --from-file=.dockerconfigjson=$HOME/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson
```

## Start mongodb locally

```
helm install --name mongodb --set persistence.enabled=false stable/mongodb
```

# Rancher deploys

1. Must add credentials to docker registry
1. Create a config map

## Staging

```
rancher app install --namespace soapbubble-staging --values deployment/web/values-staging.yaml deployment/web web-staging
```

## Production

```
rancher app install --namespace soapbubble-production --values deployment/web/values-production.yaml deployment/web web-production
```
