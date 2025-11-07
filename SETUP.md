# Setup Instructions

## Installing Node.js and npm

You need Node.js and npm to run this React application. Here are the options:

### Option 1: Install via Homebrew (Recommended for macOS)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   Follow the prompts and enter your password when asked.

2. **Install Node.js** (which includes npm):
   ```bash
   brew install node
   ```

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Option 2: Download Node.js directly

1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer and follow the setup wizard
4. Restart your terminal after installation

### Option 3: Use nvm (Node Version Manager)

1. **Install nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Restart your terminal** or run:
   ```bash
   source ~/.zshrc
   ```

3. **Install Node.js**:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

## After Installing Node.js

Once Node.js and npm are installed, navigate to the project directory and run:

```bash
cd pokemon-team-builder
npm install
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

## Troubleshooting

- If `npm` command is still not found after installation, try restarting your terminal
- Make sure you're in the `pokemon-team-builder` directory when running `npm install`
- If you encounter permission errors, you may need to configure npm permissions or use `sudo` (not recommended for global packages)

