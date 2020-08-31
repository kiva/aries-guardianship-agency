#!/usr/bin/env bash

if [ ! -z $(docker network ls --filter name=project_agency-network --format="{{ .Name }}") ] ; then
     docker network rm project_agency-network ;
fi

if [ -z $(docker network ls --filter name=agency-network --format="{{ .Name }}") ] ; then
     docker network create --driver=bridge --subnet=10.0.0.0/24 agency-network ;
fi
