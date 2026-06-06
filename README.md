# Overview

VerifyKit is a TypeScript identity verification application that uploads a Genuine ID or International ID image, runs OCR extraction, validates the extracted fields, and stores verification records for review. The app is built to demonstrate practical TypeScript usage across UI components, service classes, typed data models, API routes, and asynchronous OCR workflows.

My purpose for writing this software was to strengthen my ability to build a full-stack TypeScript project with real data flow. I wanted to practice class-based application logic, typed React state, server-side API handlers, image processing, OCR error handling, and clean validation behavior without relying on imagined or generated identity data.

[Software Demo Video](https://youtu.be/CjV5G7o5AuU)

# Development Environment

I developed this project with Visual Studio Code, Node.js, npm, and a local Next.js development server. The application runs in the browser, with server-side API routes handling OCR and verification requests.

The project is written in TypeScript with React and Next.js. Styling is handled with Tailwind CSS, icons come from Lucide React, OCR is handled with Tesseract.js, and local application data is managed through typed service classes and browser storage.

Useful commands:

```bash
npm install
npm run dev
npm run lint
npm run build
```

# Useful Websites

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

# Future Work

- Improve OCR accuracy for more ID layouts, lighting conditions, and image angles.
- Add stronger rejection rules for non-ID images and tampered documents.
- Add a persistent database instead of only client-side storage.
- Add automated tests for OCR parsing, verification decisions, and failed upload paths.
- Record and attach the final software demonstration video.
