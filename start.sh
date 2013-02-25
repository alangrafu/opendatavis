#!/bin/bash
PYTHON=`which python`
cd server
$PYTHON app.py & 

echo $! > ../.pid
