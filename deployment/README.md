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

## Setting up a new environment

Requirements:
 - `rancher` CLI connected to the rancher instance
 - `kubectl` CLI connected to the cluster to install to on the rancher instance

### Install mongodb chart

Create a PVC named `mongodb-${environment}` in the `soabpbuble-${environment}` namespace

```
rancher app install --namespace soapbubble-${environment} --values deployment/mongodb/values.yaml deployment/mongodb mongodb-${environment}
```

This command will return a root password. A secret will also be created with it. Note it down.

### DB setup

Connect to the datase:
```
kubectl --namespace soapbubble-${environment} get po
```
to list pods.  Find mongodb

```
kubectl port-forward --namespace soapbubble-${environment} pod/mongodb-${environment}-7f98bf4c96-vcxdx mongodb:mongodb
```

Run `mongo -u root -p ${mognoRootPassword}` to connect to DB as root

Create users:

```
use morpheus;
db.createUser({ user: 'soapbubble-morpheus', pwd: '${morpheus-mongodb-password}', roles: [{ role: 'readWrite', db: 'morpheus' }] });
use auth;
db.createUser({ user: 'soapbubble-auth', pwd: '${auth-mongodb-password}', roles: [{ role: 'readWrite', db: 'auth' }] });

```

The passwords can be anything, but note them. They will need to added the `soapbubble-${environment}-web` secret

Now quit and with the morpheus.map.json file handy prime and update the DB:

```
MORPHEUS_MONGODB_URI=mongodb://localhost/morpheus MONGODB_USERNAME=soapbubble-morpheus MONGODB_PASSWORD=RyenEthEthUranerbuct6wreibCilnud npm run db:prime

MORPHEUS_MONGODB_URI=mongodb://localhost/morpheus MONGODB_USERNAME=soapbubble-morpheus MONGODB_PASSWORD=${morpheus-mongodb-password} npm run db:update
```

### Installing docker registry

```
rancher app install --namespace docker-registry deplyoment/docker-registry
```

### Installing Soapbubble app

```
rancher app install --namespace soapbubble-${environment} --values deployment/web/values-staging.yaml deployment/web web-${environment}
```
