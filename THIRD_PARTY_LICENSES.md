# Third-Party Licenses

This project uses the following open-source software and assets.

---

## Fonts

### LINESeed JP
- **Author**: LY Corporation
- **License**: SIL Open Font License 1.1
- **License file**: [`public/fonts/OFL.txt`](public/fonts/OFL.txt)
- **Source**: https://seed.line.me/index_jp.html

### JetBrains Mono
- **Author**: JetBrains
- **License**: SIL Open Font License 1.1
- **Source**: https://www.jetbrains.com/lp/mono/ / Google Fonts

---

## UI Components

### shadcn/ui
- **License**: MIT
- **Source**: https://ui.shadcn.com/
- **Note**: Components are copied into `components/ui/` and modified as needed.

```
MIT License
Copyright (c) 2023 shadcn
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Core Frameworks & Libraries

All packages listed below are distributed under the **MIT License** unless otherwise noted.

| Package | Version | Author / Maintainer | License |
|---------|---------|-------------------|---------|
| [Next.js](https://nextjs.org/) | 16.x | Vercel | MIT |
| [React](https://react.dev/) | 19.x | Meta | MIT |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Microsoft | Apache 2.0 |
| [Tailwind CSS](https://tailwindcss.com/) | 3.x | Tailwind Labs | MIT |
| [Framer Motion](https://www.framer.com/motion/) | 11.x | Framer | MIT |
| [Lucide React](https://lucide.dev/) | — | Lucide Contributors | ISC |
| [Radix UI](https://www.radix-ui.com/) | — | WorkOS | MIT |
| [Zod](https://zod.dev/) | 3.x | Colin McDonnell | MIT |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Beier(Bill) Luo | MIT |
| [class-variance-authority](https://cva.style/) | — | Joe Bell | Apache 2.0 |
| [clsx](https://github.com/lukeed/clsx) | — | Luke Edwards | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | Dany Castillo | MIT |
| [cmdk](https://cmdk.paco.me/) | — | Paco Coursey | MIT |
| [Sonner](https://sonner.emilkowal.ski/) | — | Emil Kowalski | MIT |
| [Vaul](https://vaul.emilkowal.ski/) | — | Emil Kowalski | MIT |
| [Embla Carousel](https://www.embla-carousel.com/) | — | David Cetinkaya | MIT |
| [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | — | Brian Vaughn | MIT |
| [Recharts](https://recharts.org/) | — | Recharts Group | MIT |
| [react-day-picker](https://react-day-picker.js.org/) | — | Giampaolo Bellavite | MIT |
| [date-fns](https://date-fns.org/) | — | date-fns contributors | MIT |
| [next-themes](https://github.com/pacocoursey/next-themes) | — | Paco Coursey | MIT |
| [input-otp](https://github.com/guilhermerodz/input-otp) | — | Guilherme Rodz | MIT |
| [streamdown](https://github.com/lnkiai/streamdown) | 2.x | lnkiai | MIT |

### Build / Dev Tools

| Package | License |
|---------|---------|
| [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages) | MIT |
| [postcss](https://postcss.org/) | MIT |
| [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) | MIT |

---

## AI Provider APIs

This application integrates with the following AI provider APIs. Their SDKs or code are **not** bundled in this project — only their HTTP APIs are called at runtime.

| Provider | Website | Terms |
|----------|---------|-------|
| Dify | https://dify.ai / https://github.com/langgenius/dify | [Apache 2.0 (OSS)](https://github.com/langgenius/dify/blob/main/LICENSE) |
| OpenAI | https://openai.com | [Terms of Service](https://openai.com/policies/terms-of-use) |
| Anthropic | https://anthropic.com | [Terms of Service](https://www.anthropic.com/legal/aup) |
| Google Gemini | https://ai.google.dev | [Terms of Service](https://ai.google.dev/gemini-api/terms) |
| OpenRouter | https://openrouter.ai | [Terms of Service](https://openrouter.ai/terms) |
| Longcat AI | https://longcat.chat | — |

> API keys are entered by the user and stored only in their browser's localStorage. This application does not store or transmit API keys to any server operated by this project.

---

## License

This project itself is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
