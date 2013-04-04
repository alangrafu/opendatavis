#!/bin/bash
PYTHON=`which python`
cd server
./server.py & 

echo $! > ../.pid
