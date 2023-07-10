#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 <service_name>"
  exit 1
fi

service_name=$1
directory="./${service_name}"

if [ ! -d "$directory" ]; then
  mkdir "$directory"
fi

openssl genpkey -out "${directory}/client.key" -algorithm RSA -pkeyopt rsa_keygen_bits:2048
openssl req -new -key "${directory}/client.key" -out "${directory}/client.csr" -subj "/CN=${service_name}.test.com"
openssl x509 -req -days 3650 -in "${directory}/client.csr" -signkey "${directory}/client.key" -out "${directory}/client.crt"

rm "${directory}/client.csr"

echo "Client key pair and certificate generated successfully in directory: $directory"