# Mini GTA Web Deploy

## Update the website files

1. Build the game in Unity as Web/WebGL into `WebGL`.
2. Run:

```powershell
.\scripts\Publish-WebGL.ps1
```

3. Commit and push the repository to GitHub.

## Cloudflare Pages settings

Use these settings:

```text
Framework preset: None
Build command: leave empty
Build output directory: web-dist
```

Cloudflare will give you a free `*.pages.dev` address. You can connect a custom domain later.
