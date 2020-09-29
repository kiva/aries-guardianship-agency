#!/bin/bash
#
# healthcheck.sh will wait for a service to come up
#
# usage: 
#   to check :8080/healthz and timeout after 20s
#
#   ./healthcheck.sh http://localhost:8080/healthz 20
#
#   default timout is 60s

url="${1:-http://localhost:8080/healthz}"
timeout="${2:-60}"

# wait for services to be up
function waitup {
  local url=$1
  local sleepcount=0
  for i in $(seq $timeout)
  do
      curl $url 2> /dev/null
      if [[ $? == 0 ]]
      then
          >&2 echo "service healthy after $sleepcount seconds"
          return 0
      fi
      sleep 1
      >&2 echo -n "."
      sleepcount=$((sleepcount+1))
  done
  return 1
}

_=$(waitup $url)
if [[ $? -ne 0 ]]
then
    >&2 echo "service unreachable after $timeout seconds wait time"
    exit 1
fi
