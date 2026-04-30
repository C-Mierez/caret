#!/bin/bash
# Forces the system's native npx, bypassing Bun entirely
# To be used inside package.json to bypass Bun
npx --ignore-scripts=false inngest-cli@latest dev