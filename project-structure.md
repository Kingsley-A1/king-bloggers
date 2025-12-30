king-bloggers/
├── src/
│   ├── app/
│   │   ├── (public)/                 # Public Guest View (Reader Layout)
│   │   │   ├── layout.tsx            # Global Glass Nav + Footer
│   │   │   ├── page.tsx              # Home: Interactive "Liquid Glass" Feed
│   │   │   ├── tech/                 # Technology Section
│   │   │   │   └── page.tsx
│   │   │   ├── art-culture/          # Art and Culture Section
│   │   │   │   └── page.tsx
│   │   │   ├── entertainment/        # Entertainment Section
│   │   │   │   └── page.tsx
│   │   │   ├── politics/             # Politics Section
│   │   │   │   └── page.tsx
│   │   │   ├── economics/            # Economics Section
│   │   │   │   └── page.tsx
│   │   │   ├── religion/             # Religion Section
│   │   │   │   └── page.tsx
│   │   │   ├── about/                # About King Bloggers
│   │   │   │   └── page.tsx
│   │   │   ├── contact/              # Contact Page
│   │   │   │   └── page.tsx
│   │   │   ├── privacy-policy/       # Legal
│   │   │   │   └── page.tsx
│   │   │   └── blog/[slug]/          # Single Post View
│   │   │       └── page.tsx          # Comments enabled for registered users
│   │   ├── (auth)/                   # Authentication Routes
│   │   │   ├── register/             # Entry: Role Cards (Reader/Blogger) & Forms
│   │   │   │   └── page.tsx
│   │   │   └── login/                # Unified Login
│   │   │       └── page.tsx
│   │   ├── (blogger)/                # Protected Blogger Workspace
│   │   │   ├── layout.tsx            # "King's Studio" Sidebar Layout
│   │   │   ├── dashboard/            # Analytics & Content Library
│   │   │   │   └── page.tsx
│   │   │   └── editor/               # The "Sovereign Write" Engine (WYSIWYG)
│   │   │       └── page.tsx
│   │   ├── (reader)/                 # Protected Reader Area
│   │   │   ├── profile/              # User Settings & Favorites
│   │   │   │   └── page.tsx
│   │   └── api/                      # Backend Endpoints
│   │       ├── auth/[...nextauth]/   # Auth.js Handler (Multi-role logic)
│   │       ├── upload/               # R2 Presigned URLs generator
│   │       └── newsletter/           # Email subscription
│   ├── components/
│   │   ├── ui/                       # Atomic Design Tokens
│   │   │   ├── GlassCard.tsx         # Standard container
│   │   │   ├── GlassButton.tsx       # Action elements
│   │   │   └── Input.tsx             # Form fields
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Smart Header (Scroll collapse)
│   │   │   ├── Footer.tsx            # Global footer
│   │   │   └── CategoryNav.tsx       # Sticky sub-nav
│   │   ├── forms/
│   │   │   ├── RegistrationForm.tsx  # Multi-step (Geo-data + Niche selection)
│   │   │   └── SovereignEditor.tsx   # Blogger Studio Component
│   │   └── features/
│   │       ├── PostCard.tsx          # Feed item component
│   │       ├── CommentSection.tsx    # Interactive engagement
│   │       └── AnalyticsChart.tsx    # Dashboard visuals
│   ├── db/
│   │   ├── schema.ts                 # Drizzle definitions (Users, Posts, Roles)
│   │   └── index.ts                  # CockroachDB Connection
│   ├── lib/
│   │   ├── auth.ts                   # Auth.js configuration & callbacks
│   │   ├── geo-data.ts               # Nigerian States & LGAs JSON
│   │   ├── r2.ts                     # Cloudflare R2 Client
│   │   └── utils.ts                  # Helper functions
│   └── styles/
│       └── globals.css               # Tailwind & CSS Variables