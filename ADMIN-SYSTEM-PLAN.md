# 👑 KING BLOGGERS - Admin God-Mode System Architecture

## Executive Vision
A sovereign command center granting absolute control over the King Bloggers platform. The Admin dashboard should feel like controlling a spaceship - powerful, precise, and visually stunning with real-time metrics and one-click power moves.

---

## 1. Database Schema Additions

### New Tables Required

```sql
-- Admin roles with granular permissions
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,  -- 'super_admin', 'content_mod', 'analytics_viewer'
  permissions JSONB NOT NULL,        -- Granular permission flags
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin users (extends existing users)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id),
  granted_by UUID REFERENCES admin_users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id)
);

-- Audit log for all admin actions
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,       -- 'ban_user', 'delete_post', 'feature_post', etc.
  target_type VARCHAR(50),            -- 'user', 'post', 'comment'
  target_id UUID,
  metadata JSONB,                     -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content reports from users
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL,  -- 'post', 'comment', 'user'
  content_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,       -- 'spam', 'harassment', 'misinformation', etc.
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP,
  action_taken VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Featured content (admin-curated)
CREATE TABLE featured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  featured_by UUID REFERENCES admin_users(id),
  position INT DEFAULT 0,             -- Display order
  start_at TIMESTAMP DEFAULT NOW(),
  end_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(post_id)
);

-- System announcements
CREATE TABLE system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',    -- 'info', 'warning', 'celebration'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'bloggers', 'readers'
  created_by UUID REFERENCES admin_users(id),
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User sanctions (bans, mutes, warnings)
CREATE TABLE user_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,          -- 'warning', 'mute', 'suspend', 'ban'
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES admin_users(id),
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,                   -- NULL = permanent
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2. Route Structure

```
/admin                          → Dashboard home (requires admin role)
├── /admin/dashboard            → Real-time overview metrics
├── /admin/users                → User management
│   ├── /admin/users/[id]       → Individual user view
│   └── /admin/users/sanctions  → Active sanctions
├── /admin/content              → Content moderation
│   ├── /admin/content/posts    → All posts with filters
│   ├── /admin/content/comments → All comments
│   ├── /admin/content/reports  → Reported content queue
│   └── /admin/content/featured → Featured content manager
├── /admin/analytics            → Deep analytics
│   ├── /admin/analytics/realtime → Live visitors, actions
│   ├── /admin/analytics/growth → User/content growth
│   └── /admin/analytics/engagement → Engagement metrics
├── /admin/settings             → Platform settings
│   ├── /admin/settings/general → Site-wide settings
│   ├── /admin/settings/categories → Category management
│   └── /admin/settings/announcements → System announcements
├── /admin/audit                → Audit log viewer
└── /admin/team                 → Admin team management
```

---

## 3. Permission System

### Permission Flags (Granular Control)

```typescript
type AdminPermissions = {
  // User Management
  users: {
    view: boolean;
    edit: boolean;
    ban: boolean;
    delete: boolean;
    promote_to_admin: boolean;
  };
  
  // Content Management
  content: {
    view_all: boolean;
    edit_any: boolean;
    delete_any: boolean;
    feature: boolean;
    review_reports: boolean;
  };
  
  // Analytics
  analytics: {
    view_basic: boolean;
    view_advanced: boolean;
    export: boolean;
  };
  
  // Settings
  settings: {
    view: boolean;
    edit: boolean;
    manage_categories: boolean;
    manage_announcements: boolean;
  };
  
  // Admin Management
  admin: {
    view_team: boolean;
    add_admin: boolean;
    remove_admin: boolean;
    view_audit_log: boolean;
  };
};
```

### Predefined Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | God Mode - Full access | All permissions |
| **Content Moderator** | Handles reports & content | content.*, users.view, users.ban |
| **Analytics Viewer** | Read-only analytics | analytics.*, users.view |
| **Community Manager** | User relations | users.*, content.view_all, content.review_reports |

---

## 4. Dashboard Components

### 4.1 Real-Time Metrics Panel
```
┌─────────────────────────────────────────────────────────┐
│  👁️ LIVE NOW                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │   127   │ │    23   │ │     8   │ │    45   │      │
│  │ Active  │ │ Reading │ │ Writing │ │ Browsing│      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Quick Actions Bar
- 🚨 **Reports Queue** - Pending count with urgency indicator
- ✨ **Feature Post** - Quick feature selection
- 📢 **Announce** - One-click announcement
- 🔒 **Emergency Mode** - Platform lockdown toggle

### 4.3 Growth Charts
- User registrations (7d/30d/90d/1y)
- Posts published
- Comments & reactions
- Category distribution pie chart

### 4.4 Content Health
- Spam detection alerts
- Flagged content summary
- Most reported users/posts
- Virality tracking

---

## 5. Key Features

### 5.1 User Management
- **Search** with advanced filters (email, name, join date, status)
- **User cards** showing:
  - Profile summary
  - Post count, comment count, reaction karma
  - Account age
  - Sanction history
  - Quick action buttons (warn, mute, suspend, ban)
- **Bulk actions** for mass operations
- **Export** user data (CSV/JSON)

### 5.2 Content Moderation
- **Report queue** with priority sorting
- **Side-by-side view** (content + report details)
- **Quick actions**:
  - ✅ Dismiss report
  - ⚠️ Warn author
  - 🗑️ Delete content
  - 🚫 Ban author
- **AI-assisted** spam/toxicity scores (future)
- **Pattern detection** for coordinated abuse

### 5.3 Featured Content Manager
- Drag-drop reordering
- Schedule features (start/end dates)
- Category-specific featuring
- Preview how it appears on home

### 5.4 Announcement System
- Rich text editor
- Target audience selection
- Scheduling with timezone support
- Dismissible vs persistent
- Analytics (views, dismissals)

### 5.5 Audit Trail
- Searchable log of all admin actions
- Filter by admin, action type, date range
- Export for compliance
- Immutable (no edits/deletes)

---

## 6. Security Measures

### Access Control
1. **Two-Factor Authentication** required for all admins
2. **IP Whitelisting** option for super admins
3. **Session timeout** (1 hour inactivity)
4. **Rate limiting** on sensitive actions

### Audit & Compliance
1. Every action logged with:
   - Admin ID
   - Action performed
   - Target entity
   - IP address
   - Timestamp
   - Before/after state (for edits)
2. Audit logs immutable (append-only)
3. Monthly audit report generation

### Emergency Protocols
1. **Platform Lockdown** - Disable new posts/comments
2. **Read-Only Mode** - No mutations allowed
3. **User Lockout** - Disable all logins except admins

---

## 7. UI/UX Design Principles

### The "Control Room" Aesthetic
- **Dark mode only** (befitting the King's throne)
- **Neon accent colors** for status indicators:
  - 🟢 Green: Healthy/Approved
  - 🟡 Amber: Pending/Warning
  - 🔴 Red: Critical/Banned
  - 🔵 Blue: Information/Action
- **Glass morphism** cards (consistent with main app)
- **Minimal animations** for performance
- **Keyboard shortcuts** for power users

### Information Hierarchy
1. **Critical alerts** always visible (top banner)
2. **Pending actions** prominent (sidebar badge counts)
3. **Analytics** easily scannable (large numbers, clear trends)
4. **Details** accessible via progressive disclosure

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations
- [ ] Basic admin middleware
- [ ] Role-based access control
- [ ] Dashboard layout + real-time metrics

### Phase 2: User Management (Week 2-3)
- [ ] User listing with search/filters
- [ ] User detail page
- [ ] Sanction system (warn, mute, suspend, ban)
- [ ] User export

### Phase 3: Content Moderation (Week 3-4)
- [ ] Report system (frontend submit + backend processing)
- [ ] Report queue UI
- [ ] Content moderation actions
- [ ] Audit logging

### Phase 4: Analytics & Features (Week 4-5)
- [ ] Real-time analytics (WebSocket/SSE)
- [ ] Historical charts
- [ ] Featured content manager
- [ ] Announcement system

### Phase 5: Polish & Security (Week 5-6)
- [ ] 2FA enforcement
- [ ] Keyboard shortcuts
- [ ] Mobile-responsive admin
- [ ] Performance optimization

---

## 9. Tech Stack for Admin

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js App Router (same as main app) |
| **State** | React Query for server state, Zustand for UI |
| **Charts** | Recharts or Tremor |
| **Tables** | TanStack Table with virtual scrolling |
| **Real-time** | WebSocket via Pusher or self-hosted |
| **Auth** | NextAuth with admin role check |
| **Audit Log** | PostgreSQL (immutable pattern) |

---

## 10. API Endpoints

```typescript
// User Management
GET    /api/admin/users              // List users with pagination/filters
GET    /api/admin/users/:id          // Get user details
PATCH  /api/admin/users/:id          // Update user (role, status)
POST   /api/admin/users/:id/sanction // Issue sanction
DELETE /api/admin/users/:id/sanction/:sid // Revoke sanction

// Content Moderation
GET    /api/admin/posts              // List all posts
DELETE /api/admin/posts/:id          // Delete post
GET    /api/admin/comments           // List all comments
DELETE /api/admin/comments/:id       // Delete comment
GET    /api/admin/reports            // List reports
PATCH  /api/admin/reports/:id        // Update report status

// Featured Content
GET    /api/admin/featured           // List featured
POST   /api/admin/featured           // Add to featured
PATCH  /api/admin/featured/:id       // Update featured
DELETE /api/admin/featured/:id       // Remove from featured

// Announcements
GET    /api/admin/announcements      // List announcements
POST   /api/admin/announcements      // Create announcement
PATCH  /api/admin/announcements/:id  // Update announcement
DELETE /api/admin/announcements/:id  // Delete announcement

// Analytics
GET    /api/admin/analytics/realtime // Current active users, etc.
GET    /api/admin/analytics/growth   // Growth metrics
GET    /api/admin/analytics/engagement // Engagement metrics

// Audit
GET    /api/admin/audit              // Get audit log
GET    /api/admin/audit/export       // Export audit log

// Team Management
GET    /api/admin/team               // List admin users
POST   /api/admin/team               // Add admin
PATCH  /api/admin/team/:id           // Update admin role
DELETE /api/admin/team/:id           // Remove admin
```

---

## Summary

This Admin God-Mode system will provide **absolute sovereignty** over the King Bloggers platform with:

✅ **Granular permissions** for role-based access  
✅ **Real-time monitoring** of platform health  
✅ **Powerful moderation tools** for content integrity  
✅ **Complete audit trail** for accountability  
✅ **Emergency controls** for crisis management  
✅ **Beautiful, efficient UI** for admin productivity  

The throne awaits. 👑
