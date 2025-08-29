docker run -it -v "$(pwd)":/src --rm --ipc=host mcr.microsoft.com/playwright:v1.50.0-jammy /bin/bash -c "cd /src; npx playwright test --update-snapshots"
