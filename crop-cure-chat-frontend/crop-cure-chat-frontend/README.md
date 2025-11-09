# AgriClip - AI-Powered Agricultural Disease Detection

AgriClip is a comprehensive MERN stack application that uses AI to detect plant diseases from images and provides intelligent chat-based agricultural assistance.

## 🚀 Features

- **AI Disease Detection**: Upload plant images for instant disease analysis
- **Intelligent Chat**: Get agricultural advice through AI-powered conversations  
- **OTP Authentication**: Secure email-based two-factor authentication
- **User Dashboard**: Track analysis history and chat sessions
- **Real-time Processing**: Fast image analysis with detailed recommendations

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **AI Model**: FastAPI + Hugging Face Transformers
- **Authentication**: JWT + Email OTP verification
- **Deployment**: Vercel (Frontend) + Railway (Backend + AI Model)

## 📋 Quick Deployment

Ready to deploy? Follow these steps:

1. **Check Deployment Readiness**: `npm run deploy:check`
2. **Follow Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Use Deployment Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## 🛠️ Development Setup

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/222086ca-e127-4b99-bca7-f7890f8c8df7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/222086ca-e127-4b99-bca7-f7890f8c8df7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
