#!/usr/bin/env bash

if [ ! -z $(docker network ls --filter name=agency --format="{{ .Name }}") ] ; then
     docker network rm $(docker network ls --filter name=agency --format='{{.Name}}')
fi

if [ -z $(docker network ls --filter name=agency-network --format="{{ .Name }}") ] ; then
     docker network create --driver=bridge --subnet=10.0.0.0/24 agency-network ;
fi
