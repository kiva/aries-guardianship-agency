# Helm Chart Template

## Copy chart to your repo

## Setting specifics in values.yaml

Replace `replaceme` in the values.yaml with the name of your service.

Set the liveness and readiness check timeouts appropriately for your service if
it takes longer to start up or is typically slower to respond.

Set the liveness and readiness check endpoints to `/healthz` if your service
handles that endpoint or `/v1/healthz` or otherwise if your service is special.

Set replicaCount to how many instances of your service should be running by
default.

If the component needs an ingress (accessibility to the internet) set the
ingress enabled field to true and set the hostname to be appropriate.
