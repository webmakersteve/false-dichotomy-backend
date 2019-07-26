#!/bin/sh

protoc --js_out=import_style=commonjs,binary:. proto/*.proto
