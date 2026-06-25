#!/bin/bash
# Verifies installed k3s binary against official GitHub checksum
VERSION=$(k3s --version | head -1 | awk '{print $3}')
echo "Detected k3s version: $VERSION"

curl -sfL "https://github.com/k3s-io/k3s/releases/download/${VERSION}/sha256sum-amd64.txt" -o /tmp/k3s-official-sha256.txt
OFFICIAL=$(grep " k3s$" /tmp/k3s-official-sha256.txt | awk '{print $1}')
LOCAL=$(sha256sum "$(which k3s)" | awk '{print $1}')

echo "Official: $OFFICIAL"
echo "Local:    $LOCAL"

if [ "$OFFICIAL" == "$LOCAL" ]; then
    echo "✅ VERIFIED: k3s binary matches official checksum"
    exit 0
else
    echo "❌ MISMATCH: k3s binary does NOT match official checksum — possible tampering!"
    exit 1
fi
