#!/bin/bash
PIDFILE=.pid

if [ -e "$PIDFILE" ]; then
  PID=`cat .pid`
  if [ ! -z "$PID" ]; then
    kill $PID
  fi
else
  echo "No .pid file. Is the server running?"
  exit 1
fi
